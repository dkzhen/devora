import { NextResponse } from 'next/server';
import { verifyApiKey, recordApiKeyUsage } from '@/lib/auth';
import { trackApiHit } from '@/lib/monitoring';
import prisma from '@/lib/db';

export async function POST(req) {
    // 1. Verify API Key (OpenAI Header style: Authorization: Bearer devora_...)
    const auth = await verifyApiKey(req);
    if (!auth.success) {
        return NextResponse.json({ 
            error: { 
                message: auth.error, 
                type: 'invalid_request_error', 
                code: 'invalid_api_key' 
            } 
        }, { status: 401 });
    }

    // 2. Track hit in global stats (Devora Statistics)
    trackApiHit(req, '/api/v1/ai/chat/completions');

    try {
        const body = await req.json();
        const modelId = body.model;

        if (!modelId) {
            await recordApiKeyUsage(auth.apiKeyId, '/api/v1/ai/chat/completions', 'POST', 400);
            return NextResponse.json({ 
                error: { 
                    message: 'Missing model parameter in request body.', 
                    type: 'invalid_request_error', 
                    code: 400 
                } 
            }, { status: 400 });
        }

        // 3. Enforcement Logic: Check model status and whitelist in our Database
        const modelConfig = await prisma.aiModel.findUnique({
            where: { id: modelId },
            include: { allowedEmails: true }
        });

        // Default settings if not found in DB
        const status = modelConfig?.status || 'active';
        const isRestricted = modelConfig?.isRestricted || false;
        const allowedEmails = modelConfig?.allowedEmails.map(a => a.email) || [];

        // 3a. Check for Global Suspension/Hidden (ULTRA bypass enabled)
        if ((status === 'suspend' || status === 'hidden') && auth.user.role !== 'ULTRA') {
            const errorMessage = status === 'suspend' 
                ? `Model '${modelId}' is currently suspended.` 
                : `Model '${modelId}' not found or unavailable.`;

            await recordApiKeyUsage(auth.apiKeyId, '/api/v1/ai/chat/completions', 'POST', 403);
            return NextResponse.json({ 
                error: { 
                    message: errorMessage, 
                    type: 'access_denied', 
                    code: 403 
                } 
            }, { status: 403 });
        }

        // 3b. Check for Email-based Restriction (Whitelist) (ULTRA bypass enabled)
        if (isRestricted && !allowedEmails.includes(auth.user.email) && auth.user.role !== 'ULTRA') {
            await recordApiKeyUsage(auth.apiKeyId, '/api/v1/ai/chat/completions', 'POST', 403);
            return NextResponse.json({ 
                error: { 
                    message: `Access to model '${modelId}' is restricted to authorized users.`, 
                    type: 'access_denied', 
                    code: 403 
                } 
            }, { status: 403 });
        }

        // 3c. Check for Email-prefixed ID (Private Models) (ULTRA bypass enabled)
        if (modelId.includes('/') && auth.user.role !== 'ULTRA') {
            const prefix = modelId.split('/')[0];
            const isEmail = prefix.includes('@');
            if (isEmail && auth.user.email !== prefix) {
                await recordApiKeyUsage(auth.apiKeyId, '/api/v1/ai/chat/completions', 'POST', 403);
                return NextResponse.json({ 
                    error: { 
                        message: `Access to model '${modelId}' is limited to its owner.`, 
                        type: 'access_denied', 
                        code: 403 
                    } 
                }, { status: 403 });
            }
        }

        // 4. Proxy Request to Upstream VPS
        const aiProxyBase = process.env.AI_PROXY_URL || 'http://localhost:8317';
        const upstreamRes = await fetch(`${aiProxyBase}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer Bandulan113', // Your VPS token
                'Accept': 'application/json',
            },
            body: JSON.stringify(body),
        });

        // 5. Handle Streaming Response
        if (body.stream && upstreamRes.ok) {
            const reader = upstreamRes.body.getReader();
            const stream = new ReadableStream({
                async start(controller) {
                    try {
                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) break;
                            controller.enqueue(value);
                        }
                        controller.close();
                        await recordApiKeyUsage(auth.apiKeyId, '/api/v1/ai/chat/completions', 'POST', 200);
                    } catch (err) {
                        controller.error(err);
                    }
                }
            });

            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                }
            });
        }

        // 6. Handle Standard JSON Response
        const data = await upstreamRes.json().catch(() => ({ message: 'Invalid response from upstream' }));
        await recordApiKeyUsage(auth.apiKeyId, '/api/v1/ai/chat/completions', 'POST', upstreamRes.status);
        
        return NextResponse.json(data, { status: upstreamRes.status });

    } catch (error) {
        console.error('LLM Proxy Error:', error);
        await recordApiKeyUsage(auth.apiKeyId, '/api/v1/ai/chat/completions', 'POST', 500);
        return NextResponse.json({ 
            error: { 
                message: 'Internal reverse proxy error.', 
                type: 'server_error', 
                code: 500 
            } 
        }, { status: 500 });
    }
}
