import { NextResponse } from 'next/server';
import { trackApiHit } from '@/lib/monitoring';

const MOEMAIL_API_BASE = 'https://moemail-api.danistimikwp.workers.dev';
const MOEMAIL_AUTH = 'Bearer moemail_zhen_2026';

export async function GET(req) {
    trackApiHit(req);
    try {
        const res = await fetch(`${MOEMAIL_API_BASE}/domains`, {
            headers: {
                'Authorization': MOEMAIL_AUTH,
                'Accept': 'application/json'
            }
        });

        if (!res.ok) {
            throw new Error('Failed to fetch domains');
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('MoeMail Domains Error:', error);
        return NextResponse.json({ error: 'Failed to fetch domains' }, { status: 500 });
    }
}
