import { trackApiHit } from '@/lib/monitoring';
import { NextResponse } from 'next/server';
import { verifyApiKey, recordApiKeyUsage } from '@/lib/auth';

const MOEMAIL_API_BASE = 'https://moemail-api.danistimikwp.workers.dev';
const MOEMAIL_AUTH = 'Bearer moemail_zhen_2026';

export async function GET(req) {
    const auth = await verifyApiKey(req);
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    trackApiHit(req);

    try {
        // Fetch available domains from MoeMail API
        const res = await fetch(`${MOEMAIL_API_BASE}/domains`, {
            headers: {
                'Authorization': MOEMAIL_AUTH,
                'Accept': 'application/json'
            }
        });

        if (!res.ok) {
            throw new Error('Failed to fetch domains');
        }

        const data = await res.json();
        
        await recordApiKeyUsage(auth.apiKeyId, '/api/v1/temp-mail/domains', 'GET', 200);
        return NextResponse.json({
            success: true,
            ...data
        });
    } catch (error) {
        console.error('v1 Domains API Error:', error);
        await recordApiKeyUsage(auth.apiKeyId, '/api/v1/temp-mail/domains', 'GET', 500);
        return NextResponse.json({ 
            success: false,
            error: 'Failed to fetch domains' 
        }, { status: 500 });
    }
}
