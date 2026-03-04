import { NextResponse } from 'next/server';
import { trackApiHit } from '@/lib/monitoring';

export async function GET(req) {
    trackApiHit(req);
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const urlOptions = searchParams.get('url');

        if (!urlOptions || !urlOptions.startsWith('https://api.mail.tm/')) {
            return new NextResponse('Invalid URL provided', { status: 400 });
        }

        const res = await fetch(urlOptions, {
            headers: {
                'Authorization': authHeader
            }
        });

        const blob = await res.blob();

        return new NextResponse(blob, {
            status: res.status,
            headers: {
                'Content-Type': res.headers.get('Content-Type') || 'application/octet-stream',
            }
        });
    } catch (error) {
        console.error('Image Proxy Error:', error);
        return new NextResponse('Failed to proxy image', { status: 500 });
    }
}
