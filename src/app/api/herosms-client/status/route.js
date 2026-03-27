import { getHeroApiKey } from '@/lib/hero-sms-utils';
import { trackApiHit } from '@/lib/monitoring';

// PUT /api/herosms-client/status
// body: { id, status }
// status codes: 1=markReady, 3=complete (finishActivation), 6=requestResend
// Proxies to Hero SMS setStatus

const BASE = 'https://hero-sms.com/stubs/handler_api.php';

export async function PUT(request) {
    trackApiHit(request);
    const apiKey = await getHeroApiKey(request);
    if (!apiKey) return Response.json({ error: 'API key required' }, { status: 401 });

    try {
        const { id, status } = await request.json();
        if (!id || status === undefined) {
            return Response.json({ error: 'id and status are required' }, { status: 400 });
        }

        // Use finishActivation for complete (status=3), setStatus for others
        const action = status === 3 ? 'finishActivation' : 'setStatus';
        const url = action === 'finishActivation'
            ? `${BASE}?action=finishActivation&id=${id}&api_key=${apiKey}`
            : `${BASE}?action=setStatus&id=${id}&status=${status}&api_key=${apiKey}`;

        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return Response.json({ error: 'Hero SMS API error' }, { status: res.status });

        const text = await res.text();
        return Response.json({ result: text });
    } catch (err) {
        console.error('HeroSMS Client setStatus error:', err);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// GET /api/herosms-client/status?id=...
// Proxies to Hero SMS getStatus
export async function GET(request) {
    trackApiHit(request);
    const apiKey = await getHeroApiKey(request);
    if (!apiKey) return Response.json({ error: 'API key required' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return Response.json({ error: 'id is required' }, { status: 400 });

    try {
        const url = `${BASE}?action=getStatus&id=${id}&api_key=${apiKey}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return Response.json({ error: 'Hero SMS API error' }, { status: res.status });

        const text = await res.text();
        // Returns "STATUS_WAIT_CODE", "STATUS_OK:code", "STATUS_CANCEL", etc.
        return Response.json({ status: text });
    } catch (err) {
        console.error('HeroSMS Client getStatus error:', err);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}
