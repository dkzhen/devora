import { getHeroApiKey } from '@/lib/hero-sms-utils';
import { trackApiHit } from '@/lib/monitoring';

// GET /api/herosms-client/countries
// Proxies to Hero SMS getCountries (SMS-Activate compatible API)
export async function GET(request) {
    trackApiHit(request);
    const apiKey = await getHeroApiKey(request);
    if (!apiKey) {
        return Response.json({ error: 'API key required' }, { status: 401 });
    }

    try {
        // Fetch external dial codes mapping
        const dialCodesRes = await fetch('https://gist.githubusercontent.com/anubhavshrimal/75f6183458db8c453306f93521e93d37/raw/f77e7598a8503f1f70528ae1cbf9f66755698a16/CountryCodes.json');
        let dialCodesMap = {};
        let dialList = [];
        if (dialCodesRes.ok) {
            const dialCodesData = await dialCodesRes.json();
            dialList = dialCodesData;
            dialCodesData.forEach(item => {
                const lower = item.name.toLowerCase();
                dialCodesMap[lower] = item.dial_code;
                
                // Also map a simplified version
                const simple = lower
                    .replace(', plurinational state of', '')
                    .replace(', democratic republic of the', '')
                    .replace(' (the)', '')
                    .replace(' republic of', '')
                    .split(',')[0].trim();
                dialCodesMap[simple] = item.dial_code;
            });
        }

        const res = await fetch(
            `https://hero-sms.com/stubs/handler_api.php?action=getCountries&api_key=${apiKey}`,
            { cache: 'no-store' }
        );

        if (!res.ok) {
            return Response.json({ error: 'Failed to fetch countries from Hero SMS' }, { status: res.status });
        }

        const data = await res.json();
        
        // Returns object keyed by country id
        const countries = Object.values(data)
            .filter(c => c.visible !== 0)
            .map(c => {
                const name = c.eng || c.rus || String(c.id);
                const lowerName = name.toLowerCase();
                
                // 1. Direct match
                let dial = dialCodesMap[lowerName];

                // 2. Cleaned match
                if (!dial) {
                    const cleanName = lowerName
                        .replace('republic of ', '')
                        .replace('the ', '')
                        .split(' (')[0]
                        .split(',')[0]
                        .trim();
                    dial = dialCodesMap[cleanName];
                }

                // 3. Fallback to partial matching if still no dial (e.g. "Vietnam" vs "Viet Nam")
                if (!dial && dialList.length > 0) {
                    const partialMatch = dialList.find(d => {
                        const dLow = d.name.toLowerCase();
                        return dLow.includes(lowerName) || lowerName.includes(dLow);
                    });
                    if (partialMatch) dial = partialMatch.dial_code;
                }
                
                return {
                    id: String(c.id),
                    name: name,
                    dial: dial || '',
                    retry: c.retry,
                    multiService: c.multiService,
                };
            })
            .sort((a, b) => a.name.localeCompare(b.name));
        return Response.json({ countries });
    } catch (err) {
        console.error('HeroSMS Client countries error:', err);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}
