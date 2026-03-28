import { generateAuthUrl } from '@/lib/services/gmail.service';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secretKey);
        const userId = payload.sub;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { googleClientId: true, googleClientSecret: true }
        });

        if (!user || !user.googleClientId || !user.googleClientSecret) {
            return NextResponse.redirect(new URL('/settings?error=missing_credentials', request.url));
        }

        const { decrypt } = await import('@/lib/crypto');
        let clientId, clientSecret;

        try {
            clientId = user.googleClientId.includes(':') ? decrypt(user.googleClientId) : user.googleClientId;
            clientSecret = user.googleClientSecret.includes(':') ? decrypt(user.googleClientSecret) : user.googleClientSecret;
        } catch (e) {
            console.error('Decryption failed:', e);
            return NextResponse.redirect(new URL('/settings?error=decryption_failed', request.url));
        }

        const url = generateAuthUrl(clientId, clientSecret);
        return NextResponse.redirect(url);
    } catch (error) {
        console.error('Auth route error:', error);
        return NextResponse.redirect(new URL('/settings?error=auth_error', request.url));
    }
}
