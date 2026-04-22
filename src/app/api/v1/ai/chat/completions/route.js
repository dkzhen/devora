import { NextResponse } from 'next/server';
import { verifyApiKey, recordApiKeyUsage } from '@/lib/auth';
import { trackApiHit } from '@/lib/monitoring';
import prisma from '@/lib/db';
import { getProxyConfig } from '@/constants/ai-proxy.constants';
import modelCache from '@/lib/model-cache';

// CORS headers for cross-origin requests (OpenClaw, etc)
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, User-Agent',
    'Access-Control-Max-Age': '86400',
};

// Handle OPTIONS preflight request
export async function OPTIONS(req) {
    return NextResponse.json({}, { 
        status: 200,
        headers: corsHeaders
    });
}

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
        }, { status: 401, headers: corsHeaders });
    }

    // 2. Parse body early and validate
    let body, modelId;
    try {
        body = await req.json();
        modelId = body.model;
        
        if (!modelId) {
            // Fire and forget - don't await
            recordApiKeyUsage(auth.apiKeyId, '/api/v1/ai/chat/completions', 'POST', 400);
            return NextResponse.json({ 
                error: { 
                    message: 'Missing model parameter in request body.', 
                    type: 'invalid_request_error', 
                    code: 400 
                } 
            }, { status: 400, headers: corsHeaders });
        }
    } catch (parseError) {
        recordApiKeyUsage(auth.apiKeyId, '/api/v1/ai/chat/completions', 'POST', 400);
        return NextResponse.json({ 
            error: { 
                message: 'Invalid JSON in request body.', 
                type: 'invalid_request_error', 
                code: 400 
            } 
        }, { status: 400, headers: corsHeaders });
    }

    // 3. Track hit in global stats (fire and forget)
    trackApiHit(req, '/api/v1/ai/chat/completions');

    try {

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
            recordApiKeyUsage(auth.apiKeyId, '/api/v1/ai/chat/completions', 'POST', 404); // Fire and forget
            return NextResponse.json({ 
                error: { 
                    message: `Model '${modelId}' not found or not available. Please check available models at /api/v1/ai/models`, 
                    type: 'invalid_request_error', 
                    code: 'model_not_found' 
                } 
            }, { status: 404, headers: corsHeaders });
        }

        // Default settings if not found in DB (for ULTRA users)
        const status = modelConfig?.status || 'active';
        const isRestricted = modelConfig?.isRestricted || false;
        const allowedEmails = modelConfig?.allowedEmails?.map(a => a.email) || [];

        // 3b. Check for Global Suspension/Hidden (ULTRA bypass enabled)
        if ((status === 'suspend' || status === 'hidden') && auth.user.role !== 'ULTRA') {
            recordApiKeyUsage(auth.apiKeyId, '/api/v1/ai/chat/completions', 'POST', 403); // Fire and forget
            return NextResponse.json({ 
                error: { 
                    message: status === 'suspend' ? `Model '${modelId}' is currently suspended.` : `Model '${modelId}' not found or unavailable.`,
                    type: 'access_denied', 
                    code: 403 
                } 
            }, { status: 403, headers: corsHeaders });
        }

        // 3c. Check for Email-based Restriction (Whitelist) (ULTRA bypass enabled)
        if (isRestricted && !allowedEmails.includes(auth.user.email) && auth.user.role !== 'ULTRA') {
            recordApiKeyUsage(auth.apiKeyId, '/api/v1/ai/chat/completions', 'POST', 403); // Fire and forget
            return NextResponse.json({ 
                error: { 
                    message: `Access to model '${modelId}' is restricted to authorized users.`, 
                    type: 'access_denied', 
                    code: 403 
                } 
            }, { status: 403, headers: corsHeaders });
        }

        // 3d. Check for Email-prefixed ID (Private Models) (ULTRA bypass enabled)
        if (modelId.includes('/') && auth.user.role !== 'ULTRA') {
            const prefix = modelId.split('/')[0];
            if (prefix.includes('@') && auth.user.email !== prefix) {
                recordApiKeyUsage(auth.apiKeyId, '/api/v1/ai/chat/completions', 'POST', 403); // Fire and forget
                return NextResponse.json({ 
                    error: { 
                        message: `Access to model '${modelId}' is limited to its owner.`, 
                        type: 'access_denied', 
                        code: 403 
                    } 
                }, { status: 403, headers: corsHeaders });
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
        
        // Sanitize request body - only send valid OpenAI API fields
        const sanitizedBody = {
            model: body.model,
            messages: body.messages,
            ...(body.temperature !== undefined && { temperature: body.temperature }),
            ...(body.top_p !== undefined && { top_p: body.top_p }),
            ...(body.n !== undefined && { n: body.n }),
            ...(body.stream !== undefined && { stream: body.stream }),
            ...(body.stop !== undefined && { stop: body.stop }),
            ...(body.max_tokens !== undefined && { max_tokens: body.max_tokens }),
            ...(body.presence_penalty !== undefined && { presence_penalty: body.presence_penalty }),
            ...(body.frequency_penalty !== undefined && { frequency_penalty: body.frequency_penalty }),
            ...(body.logit_bias !== undefined && { logit_bias: body.logit_bias }),
            ...(body.user !== undefined && { user: body.user }),
            ...(body.response_format !== undefined && { response_format: body.response_format }),
            ...(body.seed !== undefined && { seed: body.seed }),
            ...(body.tools !== undefined && { tools: body.tools }),
            ...(body.tool_choice !== undefined && { tool_choice: body.tool_choice }),
        };
        
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
                body: JSON.stringify(sanitizedBody),
                signal: controller.signal
            });
        } catch (fetchError) {
            clearTimeout(timeoutId);
            if (fetchError.name === 'AbortError') {
                recordApiKeyUsage(auth.apiKeyId, '/api/v1/ai/chat/completions', 'POST', 504);
                return NextResponse.json({ 
                    error: { 
                        message: 'Request timeout. The model provider took too long to respond.',
                        type: 'timeout_error', 
                        code: 504
                    } 
                }, { status: 504, headers: corsHeaders });
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
                        recordApiKeyUsage(auth.apiKeyId, '/api/v1/ai/chat/completions', 'POST', 200);
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
                    ...corsHeaders
                }
            });
        }

        // 6. Handle Standard JSON Response
        if (!upstreamRes.ok) {
            const errorText = await upstreamRes.text().catch(() => 'Unknown error');
            
            // Only log critical errors (not 429, 500, 502, 503)
            if (![429, 500, 502, 503].includes(upstreamRes.status)) {
                console.error(`[${upstreamRes.status}] ${modelId}`);
            }

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

            recordApiKeyUsage(auth.apiKeyId, '/api/v1/ai/chat/completions', 'POST', finalStatus);

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
            }, { status: finalStatus, headers: corsHeaders });
        }

        const data = await upstreamRes.json().catch(() => ({ 
            error: { 
                message: 'Invalid response format from upstream provider.',
                type: 'parse_error'
            }
        }));
        
        // Extract token usage from response
        let tokens = null;
        if (data && data.usage) {
            tokens = {
                prompt: data.usage.prompt_tokens || 0,
                completion: data.usage.completion_tokens || 0,
                total: data.usage.total_tokens || 0
            };
        }
        
        // Sanitize response to ensure OpenAI compatibility
        if (data && !data.error) {
            // Ensure id is a string (some providers return number or null)
            if (data.id !== undefined && data.id !== null && typeof data.id !== 'string') {
                data.id = String(data.id);
            }
            
            // Ensure model is a string
            if (data.model !== undefined && data.model !== null && typeof data.model !== 'string') {
                data.model = String(data.model);
            }
            
            // Ensure choices array exists and has proper structure
            if (data.choices && Array.isArray(data.choices)) {
                data.choices = data.choices.map(choice => ({
                    ...choice,
                    index: typeof choice.index === 'number' ? choice.index : 0,
                    message: choice.message || choice.delta || {},
                    finish_reason: choice.finish_reason || null
                }));
            }
        }
        
        recordApiKeyUsage(auth.apiKeyId, '/api/v1/ai/chat/completions', 'POST', 200, tokens, modelId);
        return NextResponse.json(data, { headers: corsHeaders });

    } catch (error) {
        // Log actual error for debugging (server-side only)
        console.error('LLM Proxy Error:', error);
        recordApiKeyUsage(auth.apiKeyId, '/api/v1/ai/chat/completions', 'POST', 500);
        
        // Return generic error without exposing internal details
        return NextResponse.json({ 
            error: { 
                message: 'An unexpected error occurred. Please try again later.', 
                type: 'server_error', 
                code: 500 
            } 
        }, { status: 500, headers: corsHeaders });
    }
}
