import { getHeroApiKey } from '@/lib/hero-sms-utils';
import { trackApiHit } from '@/lib/monitoring';

const BASE = 'https://hero-sms.com/stubs/handler_api.php';

export async function GET(request) {
    trackApiHit(request);
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const apiKey = await getHeroApiKey(request);

    if (!apiKey) return Response.json({ error: 'API key required' }, { status: 401 });
    if (!country) return Response.json({ error: 'country is required' }, { status: 400 });

    try {
        const res = await fetch(
            `${BASE}?action=getServicesList&country=${country}&lang=en&api_key=${apiKey}`,
            { cache: 'no-store' }
        );

        if (!res.ok) return Response.json({ error: 'Hero SMS API error' }, { status: res.status });

        const data = await res.json();

        // Response: { status: "success", services: [{ code, name }, ...] }
        if (data.status === 'success' && Array.isArray(data.services)) {
            const services = data.services.map(s => ({ code: s.code, name: s.name }));
            return Response.json({ services });
        }

        return Response.json({ services: [] });
    } catch (err) {
        console.error('Smart OTP services error:', err);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}
