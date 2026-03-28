import { trackApiHit } from '@/lib/monitoring';
import { NextResponse } from 'next/server';
import { verifyApiKey, recordApiKeyUsage } from '@/lib/auth';

const API_BASE = 'https://api.mail.tm';

export async function POST(req) {
    const auth = await verifyApiKey(req);
    if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });

    trackApiHit(req);

    try {
        const body = await req.json();
        const { address, password } = body;

        if (!address || !password) {
            await recordApiKeyUsage(auth.apiKeyId, '/api/v1/temp-mail/token', 'POST', 400);
            return NextResponse.json({ error: 'Address and password required' }, { status: 400 });
        }

        const res = await fetch(`${API_BASE}/token`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ address, password })
        });

        const data = await res.json();
        await recordApiKeyUsage(auth.apiKeyId, '/api/v1/temp-mail/token', 'POST', res.status);
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error('v1 Token API Error:', error);
        await recordApiKeyUsage(auth.apiKeyId, '/api/v1/temp-mail/token', 'POST', 500);
        return NextResponse.json({ error: 'Failed to create token' }, { status: 500 });
    }
}
