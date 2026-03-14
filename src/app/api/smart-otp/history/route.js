import { getHeroApiKey } from '@/lib/hero-sms-utils';
import { trackApiHit } from '@/lib/monitoring';

/**
 * GET /api/smart-otp/history
 * Proxies to Hero SMS getHistory action
 * 
 * Query params:
 * - start (optional): list start index
 * - end (optional): list end index
 * - offset (optional): offset
 * - size (optional): size/limit
 */
export async function GET(request) {
    trackApiHit(request);
    const apiKey = await getHeroApiKey(request);
    if (!apiKey) {
        return Response.json({ error: 'API key not found' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const now = Math.floor(Date.now() / 1000);
    const endTimestamp = now + (24 * 60 * 60); // 1-day future buffer for timezone safety
    const startTimestamp = now - (3 * 24 * 60 * 60); // Default to 3 days ago to get TONS of recent items first

    const start = searchParams.get('start') || String(startTimestamp);
    const end = searchParams.get('end') || String(endTimestamp);
    const offset = searchParams.get('offset') || '100';
    const size = searchParams.get('size') || '100'; // Maximize per-page count

    try {
        const url = `https://hero-sms.com/stubs/handler_api.php?action=getHistory&api_key=${apiKey}&start=${start}&end=${end}&offset=${offset}&size=${size}`;


        const res = await fetch(url, { cache: 'no-store' });

        if (!res.ok) {
            console.error('History API error status:', res.status);
            return Response.json({ error: 'Failed to fetch history' }, { status: res.status });
        }

        const text = await res.text();


        try {
            let data = JSON.parse(text);
            if (Array.isArray(data)) {

                data.sort((a, b) => {
                    const isRecA = a.date === '0000-00-00 00:00:00' || !a.date;
                    const isRecB = b.date === '0000-00-00 00:00:00' || !b.date;

                    if (isRecA && isRecB) return Number(b.id) - Number(a.id);
                    if (isRecA) return -1;
                    if (isRecB) return 1;

                    // Direct string comparison works for YYYY-MM-DD HH:MM:SS format
                    if (a.date !== b.date) return b.date.localeCompare(a.date);
                    return Number(b.id) - Number(a.id);
                });
            }
            return Response.json(data);
        } catch (e) {
            console.error('Failed to parse history JSON:', e);
            return Response.json({ error: 'Invalid response format', raw: text.substring(0, 100) }, { status: 500 });
        }
    } catch (err) {
        console.error('Smart OTP history error:', err);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}
