import { getHeroApiKey } from '@/lib/hero-sms-utils';
import { trackApiHit } from '@/lib/monitoring';

const BASE = 'https://hero-sms.com/stubs/handler_api.php';

/**
 * GET /api/smart-otp/sms?id=xxx&size=10&page=1
 * Proxies Hero SMS getAllSms - returns all SMS messages for an activation
 * Response: { data: [{ id, phoneFrom, code, text, service, date, type }], meta: { total, service } }
 */
export async function GET(request) {
    trackApiHit(request);
    console.log('GET /api/smart-otp/sms called');
    const apiKey = await getHeroApiKey(request);
    if (!apiKey) return Response.json({ error: 'API key required' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return Response.json({ error: 'id is required' }, { status: 400 });

    const size = searchParams.get('size') || '10';
    const page = searchParams.get('page') || '1';

    try {
        const url = `${BASE}?action=getAllSms&id=${id}&size=${size}&page=${page}&api_key=${apiKey}`;
        const res = await fetch(url, { cache: 'no-store' });

        if (!res.ok) return Response.json({ error: 'Hero SMS API error' }, { status: res.status });

        const data = await res.json();
        return Response.json(data);
    } catch (err) {
        console.error('Smart OTP getAllSms error:', err);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}
