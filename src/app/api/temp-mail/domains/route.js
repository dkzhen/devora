import { NextResponse } from 'next/server';
import { trackApiHit } from '@/lib/monitoring';

const API_BASE = 'https://api.mail.tm';

export async function GET(req) {
    trackApiHit(req);
    try {
        const { searchParams } = new URL(req.url);
        const page = searchParams.get('page') || '1';

        const res = await fetch(`${API_BASE}/domains?page=1`);
        const data = await res.json();

        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error('Domains API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch domains', details: error.message, stack: error.stack }, { status: 500 });
    }
}
