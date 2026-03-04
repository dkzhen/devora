import { NextResponse } from 'next/server';

const API_BASE = 'https://api.mail.tm';

export async function POST(req) {
    try {
        const body = await req.json();
        const { address, password } = body;

        if (!address || !password) {
            return NextResponse.json({ error: 'Address and password required' }, { status: 400 });
        }

        const res = await fetch(`${API_BASE}/token`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ address, password })
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error('Token API Error:', error);
        return NextResponse.json({ error: 'Failed to create token' }, { status: 500 });
    }
}
