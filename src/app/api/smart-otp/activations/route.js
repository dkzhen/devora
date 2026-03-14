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
        if (data.status === 'success' && Array.isArray(data.data)) {
            // Map Hero SMS fields to our normalized format
            const mapped = data.data.map(a => ({
                id: String(a.activationId),
                phoneNumber: a.phoneNumber,
                phone: a.phoneNumber,
                activationCost: Number(a.cost || a.activationCost),
                activationStatus: a.activationStatus,
                activationTime: a.activationTime,
                activationEndTime: a.estDate || a.activationEndTime,
                serviceCode: a.serviceCode
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
