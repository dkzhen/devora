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
            `${BASE}?action=getOperators&country=${country}&api_key=${apiKey}`,
            { cache: 'no-store' }
        );

        if (!res.ok) return Response.json({ error: 'Hero SMS API error' }, { status: res.status });

        const data = await res.json();

        // Response: { status: "success", countryOperators: { "countryId": ["op1","op2",...] } }
        let operators = [];
        if (data.status === 'success' && data.countryOperators) {
            const ops = data.countryOperators[country] ?? data.countryOperators[String(country)] ?? [];
            operators = Array.isArray(ops) ? ops : Object.keys(ops);
        } else if (Array.isArray(data)) {
            operators = data;
        } else if (typeof data === 'object' && data !== null) {
            operators = Object.keys(data);
        }

        return Response.json({ operators: operators.sort() });
    } catch (err) {
        console.error('Smart OTP operators error:', err);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}
