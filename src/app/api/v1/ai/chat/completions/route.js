import { NextResponse } from 'next/server';
import { verifyApiKey, recordApiKeyUsage } from '@/lib/auth';
import { trackApiHit } from '@/lib/monitoring';
import prisma from '@/lib/db';
import { getProxyConfig } from '@/constants/ai-proxy.constants';
import modelCache from '@/lib/model-cache';

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
        // Try cache first to reduce database load
        let modelConfig = modelCache.get(modelId);
        
        if (!modelConfig) {
            // Cache miss - fetch from database
            modelConfig = await prisma.aiModel.findUnique({
                where: { id: modelId },
                include: { allowedEmails: true }
            });
            
            // Cache the result (even if null for ULTRA users)
            if (modelConfig) {
                modelCache.set(modelId, modelConfig);
            }
        }

        // 3a. STRICT MODE: NON-ULTRA users can only use models in database
        if (!modelConfig && auth.user.role !== 'ULTRA') {
            await recordApiKeyUsage(auth.apiKeyId, '/api/v1/ai/chat/completions', 'POST', 404);
            return NextResponse.json({ 
                error: { 
                    message: `Model '${modelId}' not found or not available. Please check available models at /api/v1/ai/models`, 
                    type: 'invalid_request_error', 
                    code: 'model_not_found' 
                } 
            }, { status: 404 });
        }

        // Default settings if not found in DB (for ULTRA users)
        const status = modelConfig?.status || 'active';
        const isRestricted = modelConfig?.isRestricted || false;
        const allowedEmails = modelConfig?.allowedEmails.map(a => a.email) || [];

        // 3b. Check for Global Suspension/Hidden (ULTRA bypass enabled)
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

        // 3c. Check for Email-based Restriction (Whitelist) (ULTRA bypass enabled)
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

        // 3d. Check for Email-prefixed ID (Private Models) (ULTRA bypass enabled)
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

        // 4. Proxy Request to Upstream (Use preset config from database)
        const proxyPreset = modelConfig?.proxyPreset || 'DEFAULT';
        const proxyConfig = getProxyConfig(proxyPreset);
        
        // If model has custom baseUrl, use it (backward compatibility)
        const finalUrl = modelConfig?.baseUrl || proxyConfig.url;
        const cleanBaseUrl = finalUrl.replace(/\/$/, '');
        
        // Check if URL already has /v1, if not add it
        const hasV1 = cleanBaseUrl.includes('/v1');
        const endpoint = hasV1 ? `${cleanBaseUrl}/chat/completions` : `${cleanBaseUrl}/v1/chat/completions`;
        
        // Add timeout to prevent hanging requests (60 seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);
        
        try {
            var upstreamRes = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${proxyConfig.token}`,
                    'Accept': 'application/json',
                },
                body: JSON.stringify(body),
                signal: controller.signal
            });
        } catch (fetchError) {
            clearTimeout(timeoutId);
            if (fetchError.name === 'AbortError') {
                await recordApiKeyUsage(auth.apiKeyId, '/api/v1/ai/chat/completions', 'POST', 504);
                return NextResponse.json({ 
                    error: { 
                        message: 'Request timeout. The model provider took too long to respond.',
                        type: 'timeout_error', 
                        code: 504
                    } 
                }, { status: 504 });
            }
            throw fetchError;
        } finally {
            clearTimeout(timeoutId);
        }

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
        if (!upstreamRes.ok) {
            // Log actual error for debugging (server-side only)
            const errorText = await upstreamRes.text().catch(() => 'Unknown error');
            console.error('Upstream Error:', {
                status: upstreamRes.status,
                statusText: upstreamRes.statusText,
                body: errorText
            });

            // Detect rate limit from error message
            const isRateLimit = errorText.toLowerCase().includes('rate_limit') || 
                               errorText.toLowerCase().includes('rate limit') ||
                               errorText.toLowerCase().includes('cooldown') ||
                               errorText.toLowerCase().includes('too many requests');

            // Determine final status code
            let finalStatus = upstreamRes.status;
            if (isRateLimit && upstreamRes.status === 500) {
                finalStatus = 429; // Convert 500 to 429 if it's rate limit
            }

            await recordApiKeyUsage(auth.apiKeyId, '/api/v1/ai/chat/completions', 'POST', finalStatus);

            // Return generic error without exposing upstream details
            const errorMessages = {
                400: 'Invalid request. Please check your request parameters.',
                401: 'Authentication failed. The model provider rejected the request.',
                403: 'Access forbidden. You may not have permission to use this model.',
                404: 'Model endpoint not found on the upstream provider.',
                429: 'Rate limit exceeded. The model is currently in cooldown. Please try again later.',
                500: 'The model provider encountered an internal error.',
                502: 'Bad gateway. Unable to connect to the model provider.',
                503: 'Service temporarily unavailable. Please try again later.',
                504: 'Gateway timeout. The model provider took too long to respond.'
            };

            const message = errorMessages[finalStatus] || 'An error occurred while processing your request.';

            return NextResponse.json({ 
                error: { 
                    message,
                    type: isRateLimit ? 'rate_limit_error' : 'upstream_error', 
                    code: finalStatus
                } 
            }, { status: finalStatus });
        }

        const data = await upstreamRes.json().catch(() => ({ 
            error: { 
                message: 'Invalid response format from upstream provider.',
                type: 'parse_error'
            }
        }));
        
        await recordApiKeyUsage(auth.apiKeyId, '/api/v1/ai/chat/completions', 'POST', 200);
        return NextResponse.json(data);

    } catch (error) {
        // Log actual error for debugging (server-side only)
        console.error('LLM Proxy Error:', error);
        await recordApiKeyUsage(auth.apiKeyId, '/api/v1/ai/chat/completions', 'POST', 500);
        
        // Return generic error without exposing internal details
        return NextResponse.json({ 
            error: { 
                message: 'An unexpected error occurred. Please try again later.', 
                type: 'server_error', 
                code: 500 
            } 
        }, { status: 500 });
    }
}
