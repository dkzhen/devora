import { trackApiHit } from '@/lib/monitoring';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { jwtVerify } from 'jose';

export async function POST(request) {
    trackApiHit(request);
    try {
        const token = request.cookies.get('auth_token')?.value;
        if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);

        const { clientId, clientSecret } = await request.json();

        if (!clientId || !clientSecret) {
            return NextResponse.json({ error: 'Client ID and Client Secret are required' }, { status: 400 });
        }

        // Determine callback URL based on environment
        const callbackUrl = process.env.NODE_ENV === 'production'
            ? process.env.CALLBACK_URL_PROD
            : process.env.CALLBACK_URL_DEV;

        // Fetch current user to check their role
        const currentUser = await prisma.user.findUnique({ where: { id: payload.sub } });

        let newRole = 'PRO';
        if (currentUser && currentUser.role === 'ULTRA') {
            newRole = 'ULTRA';
        }

        // Update user with new credentials and conditionally set role
        // Encrypt credentials before saving
        const { encrypt } = await import('@/lib/crypto');

        const updatedUser = await prisma.user.update({
            where: { id: payload.sub },
            data: {
                googleClientId: encrypt(clientId),
                googleClientSecret: encrypt(clientSecret),
                role: newRole
            }
        });

        return NextResponse.json({ success: true, user: updatedUser });

    } catch (error) {
        console.error('Upgrade error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
