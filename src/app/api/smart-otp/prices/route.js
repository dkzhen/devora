const BASE = 'https://hero-sms.com/stubs/handler_api.php';

import { getHeroApiKey } from '@/lib/hero-sms-utils';
import { trackApiHit } from '@/lib/monitoring';

export async function GET(request) {
    trackApiHit(request);
    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service');
    const country = searchParams.get('country');
    const apiKey = await getHeroApiKey(request);

    if (!apiKey) return Response.json({ error: 'API key required' }, { status: 401 });
    if (!service || !country) return Response.json({ error: 'service and country are required' }, { status: 400 });

    try {
        const res = await fetch(
            `${BASE}?action=getPrices&service=${service}&country=${country}&api_key=${apiKey}`,
            { cache: 'no-store' }
        );

        if (!res.ok) return Response.json({ error: 'Hero SMS API error' }, { status: res.status });

        const data = await res.json();

        // getPrices with service+country returns:
        // { "serviceCode": { "countryId": { "count": N, "cost": X, "retail_price": X } } }
        // OR keyed by country first: { "countryId": { "serviceCode": { count, cost } } }
        let prices = [];

        if (typeof data === 'object' && data !== null) {
            const firstKey = Object.keys(data)[0] ?? '';
            const isCountryKeyed = !isNaN(firstKey);

            if (isCountryKeyed) {
                // { countryId: { serviceCode: { count, cost } } }
                const countryData = data[country] ?? data[Number(country)] ?? {};
                for (const [, info] of Object.entries(countryData)) {
                    if (typeof info === 'object' && (info.count ?? 0) > 0) {
                        prices.push({ cost: info.cost ?? 0, count: info.count, operator: info.operator || null });
                    }
                }
            } else {
                // { serviceCode: { countryId: { count, cost } } }
                const serviceData = data[service] ?? data;
                const countryData = serviceData[country] ?? serviceData[Number(country)] ?? serviceData;

                if (countryData.count !== undefined) {
                    // Single entry
                    prices = [{ cost: countryData.cost ?? 0, count: countryData.count, operator: null }];
                } else {
                    // Multiple operator entries under country
                    for (const [key, val] of Object.entries(countryData)) {
                        if (typeof val === 'object' && (val.count ?? 0) > 0) {
                            prices.push({ cost: val.cost ?? 0, count: val.count, operator: key });
                        }
                    }
                }
            }
        }

        prices = prices.filter(p => p.count > 0).sort((a, b) => a.cost - b.cost);

        return Response.json({ prices });
    } catch (err) {
        console.error('Smart OTP prices error:', err);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}
