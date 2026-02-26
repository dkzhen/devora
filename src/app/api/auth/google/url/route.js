import { trackApiHit } from '@/lib/monitoring';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import prisma from '@/lib/db';
import { generateAuthUrl } from '@/lib/services/gmail.service';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    trackApiHit(request);
    try {
        // 1. Authenticate User
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secretKey);
        const userId = payload.sub;

        // 2. Fetch User Credentials
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { googleClientId: true, googleClientSecret: true }
        });

        if (!user || !user.googleClientId || !user.googleClientSecret) {
            return NextResponse.json({ error: 'No credentials configured' }, { status: 400 });
        }

        // 3. Decrypt Credentials
        const { decrypt } = await import('@/lib/crypto');
        let clientId, clientSecret;

        try {
            clientId = user.googleClientId.includes(':') ? decrypt(user.googleClientId) : user.googleClientId;
            clientSecret = user.googleClientSecret.includes(':') ? decrypt(user.googleClientSecret) : user.googleClientSecret;
        } catch (e) {
            console.error('Decryption failed:', e);
            return NextResponse.json({ error: 'Failed to decrypt credentials' }, { status: 500 });
        }

        // 4. Generate Auth URL
        const url = generateAuthUrl(clientId, clientSecret);

        return NextResponse.json({ url });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
