import { getHeroApiKey } from '@/lib/hero-sms-utils';
import { trackApiHit } from '@/lib/monitoring';

const BASE = 'https://hero-sms.com/stubs/handler_api.php';

export async function POST(request) {
    trackApiHit(request);
    const apiKey = await getHeroApiKey(request);
    if (!apiKey) return Response.json({ error: 'API key required' }, { status: 401 });

    try {
        const { service, country, maxPrice, fixedPrice, operator } = await request.json();
        if (!service || !country) {
            return Response.json({ error: 'service and country are required' }, { status: 400 });
        }

        const params = new URLSearchParams({
            action: 'getNumberV2',
            service,
            country,
            api_key: apiKey,
        });
        if (maxPrice)    params.set('maxPrice', maxPrice);
        if (fixedPrice)  params.set('fixedPrice', 'true');
        if (operator)    params.set('operator', operator);

        const res = await fetch(`${BASE}?${params}`, { cache: 'no-store' });
        if (!res.ok) return Response.json({ error: 'Hero SMS API error' }, { status: res.status });

        const data = await res.json();

        // getNumberV2 returns JSON on success, or { error } on failure
        if (data.activationId && data.phoneNumber) {
            return Response.json({
                id:       String(data.activationId),
                phone:    data.phoneNumber,
                cost:     data.activationCost,
                operator: data.activationOperator,
                canGetAnotherSms: data.canGetAnotherSms,
                endTime:  data.activationEndTime,
            });
        } else {
            return Response.json({ error: data.error || data.message || JSON.stringify(data) }, { status: 400 });
        }
    } catch (err) {
        console.error('HeroSMS Client buyNumber error:', err);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}


export async function GET(request) {
    trackApiHit(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const apiKey = await getHeroApiKey(request);
    if (!apiKey) return Response.json({ error: 'API key required' }, { status: 401 });
    if (!id) return Response.json({ error: 'id is required' }, { status: 400 });

    try {
        const res = await fetch(
            `${BASE}?action=getStatus&id=${id}&api_key=${apiKey}`,
            { cache: 'no-store' }
        );
        if (!res.ok) return Response.json({ error: 'Hero SMS API error' }, { status: res.status });

        const text = await res.text();
        // STATUS_WAIT_CODE, STATUS_CANCEL, STATUS_OK:otp, etc.
        if (text.startsWith('STATUS_OK:')) {
            return Response.json({ status: 'STATUS_OK', sms: text.replace('STATUS_OK:', '') });
        } else {
            return Response.json({ status: text });
        }
    } catch (err) {
        console.error('HeroSMS Client getStatus error:', err);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request) {
    trackApiHit(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const apiKey = await getHeroApiKey(request);
    if (!apiKey) return Response.json({ error: 'API key required' }, { status: 401 });
    if (!id) return Response.json({ error: 'id is required' }, { status: 400 });

    try {
        const res = await fetch(
            `${BASE}?action=cancelActivation&id=${id}&api_key=${apiKey}`,
            { cache: 'no-store' }
        );
        if (!res.ok) return Response.json({ error: 'Hero SMS API error' }, { status: res.status });

        const text = await res.text();
        return Response.json({ result: text });
    } catch (err) {
        console.error('HeroSMS Client cancel error:', err);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}
