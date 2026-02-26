import { trackApiHit } from '@/lib/monitoring';
import { NextResponse } from 'next/server';

export async function POST(request) {
    trackApiHit(request);
    const response = NextResponse.json({ success: true });

    // Clear the auth cookie
    response.cookies.set({
        name: 'auth_token',
        value: '',
        expires: new Date(0),
        path: '/',
    });

    return response;
}
