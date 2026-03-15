import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

async function verifyAuth(request) {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return null;

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return {
            ...payload,
            id: payload.sub || payload.id
        };
    } catch (error) {
        return null;
    }
}

export async function POST(request) {
    const user = await verifyAuth(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { url, method, headers, body } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        const fetchOptions = {
            method: method || 'GET',
            headers: headers || {},
        };

        if (body && method !== 'GET' && method !== 'HEAD') {
            fetchOptions.body = body;
        }

        const start = performance.now();
        const res = await fetch(url, fetchOptions);
        const elapsed = Math.round(performance.now() - start);

        const resText = await res.text();
        const resHeaders = {};
        res.headers.forEach((val, key) => {
            resHeaders[key] = val;
        });

        return NextResponse.json({
            status: res.status,
            statusText: res.statusText,
            headers: resHeaders,
            body: resText,
            time: elapsed,
            ok: res.ok
        });

    } catch (error) {
        console.error('Proxy Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to execute request through proxy' }, { status: 500 });
    }
}
