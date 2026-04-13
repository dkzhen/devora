import { NextResponse } from 'next/server';


export async function GET(req) {
    // API is now public for cluster transparency

    try {
        const aiProxyBase = process.env.AI_PROXY_URL || 'http://localhost:8317';
        const response = await fetch(`${aiProxyBase}/v0/management/usage`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer Bandulan113',
                'Pragma': 'no-cache',
                'Cache-Control': 'no-cache',
                'Accept': 'application/json'
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`Stats Fetch Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Stats Fetch Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
