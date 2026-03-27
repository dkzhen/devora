import { getHeroApiKey } from '@/lib/hero-sms-utils';
import { trackApiHit } from '@/lib/monitoring';

const BASE = 'https://hero-sms.com/stubs/handler_api.php';

export async function GET(request) {
    trackApiHit(request);
    const apiKey = await getHeroApiKey(request);
    if (!apiKey) return Response.json({ error: 'API key required' }, { status: 401 });

    try {
        const res = await fetch(
            `${BASE}?action=getActiveActivations&api_key=${apiKey}`,
            { cache: 'no-store' }
        );

        if (!res.ok) return Response.json({ error: 'Hero SMS API error' }, { status: res.status });

        const data = await res.json();
        // Response: { status: 'success', activeActivations: [ {id, serviceCode, phoneNumber, activationCost, ...} ] }
        const rawList = data.activeActivations || data.data || (Array.isArray(data) ? data : []);
        
        if (Array.isArray(rawList)) {
            // Map Hero SMS fields to our normalized format
            const mapped = rawList.map(a => ({
                id: String(a.activationId || a.id),
                phoneNumber: a.phoneNumber || a.number || a.phone,
                phone: a.phoneNumber || a.number || a.phone,
                activationCost: Number(a.cost || a.activationCost || 0),
                activationStatus: String(a.activationStatus || a.status || '1'),
                activationTime: a.activationTime || a.date,
                activationEndTime: a.estDate || a.activationEndTime,
                serviceCode: a.serviceCode || a.service
            }));
            return Response.json({ activations: mapped });
        } else {
            return Response.json({ activations: [] });
        }
    } catch (err) {
        console.error('Smart OTP activations error:', err);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}
