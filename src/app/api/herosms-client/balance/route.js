import { getHeroApiKey } from '@/lib/hero-sms-utils';
import { trackApiHit } from '@/lib/monitoring';

// GET /api/herosms-client/balance
// Proxies to Hero SMS getBalance
export async function GET(request) {
    trackApiHit(request);
    const apiKey = await getHeroApiKey(request);

    try {
        const res = await fetch(
            `https://hero-sms.com/stubs/handler_api.php?action=getBalance&api_key=${apiKey}`,
            { cache: 'no-store' }
        );

        if (!res.ok) {
            return Response.json({ error: 'Failed to fetch balance from Hero SMS' }, { status: res.status });
        }

        const text = await res.text();
        // Response format: "ACCESS_BALANCE:12.34" or "BAD_KEY"
        if (text.startsWith('ACCESS_BALANCE:')) {
            const balance = parseFloat(text.replace('ACCESS_BALANCE:', ''));
            return Response.json({ balance });
        } else if (text === 'BAD_KEY') {
            return Response.json({ error: 'Invalid API key' }, { status: 401 });
        } else {
            return Response.json({ error: text }, { status: 400 });
        }
    } catch (err) {
        console.error('HeroSMS Client balance error:', err);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}
