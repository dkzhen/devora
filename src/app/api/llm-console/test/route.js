import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import prisma from '@/lib/db';
import { decrypt } from '@/lib/encryption';
import { trackApiHit } from '@/lib/monitoring';

export const dynamic = 'force-dynamic';

async function getUserId(request) {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return null;
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return payload.sub;
    } catch {
        return null;
    }
}

export async function POST(request) {
    trackApiHit(request);

    try {
        const body = await request.json();

        // Logged-in users: fetch credentials from DB
        // Guest users: pass credentials directly in body (stored client-side)
        let { baseUrl, model, apiKey } = body;

        const userId = await getUserId(request);
        if (userId && !apiKey) {
            // Fetch from DB if logged in and no apiKey in body
            const record = await prisma.llmConsole.findUnique({ where: { userId } });
            if (!record) {
                return NextResponse.json({ error: 'No config found. Please save your credentials first.' }, { status: 400 });
            }
            baseUrl = record.baseUrl;
            model = record.model;
            apiKey = decrypt(record.apiKey);
        }

        if (!baseUrl || !model || !apiKey) {
            return NextResponse.json({ error: 'baseUrl, model, and apiKey are required' }, { status: 400 });
        }

        // Normalize base URL — strip trailing slash
        const cleanBase = baseUrl.replace(/\/+$/, '');
        const endpoint = `${cleanBase}/chat/completions`;

        const llmRes = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages: [{ role: 'user', content: 'Hello' }],
                temperature: 0,
                max_tokens: 5,
            }),
            // Hard timeout via AbortController
            signal: AbortSignal.timeout(15000),
        });

        const statusCode = llmRes.status;
        let data;
        try {
            data = await llmRes.json();
        } catch {
            data = null;
        }

        if (!llmRes.ok) {
            const errMsg = data?.error?.message || data?.error || data?.message || `HTTP ${statusCode}`;
            return NextResponse.json({
                success: false,
                statusCode,
                error: errMsg,
                raw: data,
            });
        }

        const content = data?.choices?.[0]?.message?.content ?? null;
        return NextResponse.json({
            success: true,
            statusCode,
            content,
            model: data?.model ?? model,
            usage: data?.usage ?? null,
        });

    } catch (error) {
        const isTimeout = error?.name === 'TimeoutError' || error?.code === 'ABORT_ERR';
        return NextResponse.json({
            success: false,
            statusCode: isTimeout ? 408 : 502,
            error: isTimeout ? 'Request timed out after 15 seconds' : (error.message || 'Network error'),
        });
    }
}
