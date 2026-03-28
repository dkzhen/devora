import { trackApiHit } from '@/lib/monitoring';
import { NextResponse } from 'next/server';
import { verifyApiKey, recordApiKeyUsage } from '@/lib/auth';

const API_BASE = 'https://api.mail.tm';

export async function GET(req) {
    const auth = await verifyApiKey(req);
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    trackApiHit(req);

    try {
        const res = await fetch(`${API_BASE}/domains?page=1`);
        const data = await res.json();

        await recordApiKeyUsage(auth.apiKeyId, '/api/v1/temp-mail/domains', 'GET', res.status);
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error('v1 Domains API Error:', error);
        await recordApiKeyUsage(auth.apiKeyId, '/api/v1/temp-mail/domains', 'GET', 500);
        return NextResponse.json({ error: 'Failed to fetch domains' }, { status: 500 });
    }
}
