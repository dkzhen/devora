import { trackApiHit } from '@/lib/monitoring';
import prisma from '@/lib/db';
import { checkGmail } from '@/lib/services/gmail.service';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

async function getAuthenticatedUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return null;

    try {
        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secretKey);
        return await prisma.user.findUnique({ where: { id: payload.sub } });
    } catch (e) {
        return null;
    }
}

export async function DELETE(request, { params }) {
    trackApiHit(request);
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { email } = await params;
        const decodedEmail = decodeURIComponent(email);

        // Ensure account belongs to user
        const account = await prisma.account.findFirst({
            where: { email: decodedEmail, userId: user.id }
        });

        if (!account) {
            return NextResponse.json({ error: 'Account not found' }, { status: 404 });
        }

        await prisma.account.delete({
            where: { email: decodedEmail }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Check individual account
export async function POST(request, { params }) {
    trackApiHit(request);
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { email } = await params;
        const decodedEmail = decodeURIComponent(email);

        // Fetch user credentials for the operation
        let clientId, clientSecret;
        if (user.googleClientId && user.googleClientSecret) {
            const { decrypt } = await import('@/lib/crypto');
            try {
                clientId = user.googleClientId.includes(':') ? decrypt(user.googleClientId) : user.googleClientId;
                clientSecret = user.googleClientSecret.includes(':') ? decrypt(user.googleClientSecret) : user.googleClientSecret;
            } catch (e) {
                console.warn('Credential decryption failed', e);
            }
        }

        const account = await prisma.account.findFirst({
            where: { email: decodedEmail, userId: user.id }
        });

        if (!account) {
            return NextResponse.json({ error: 'Account not found' }, { status: 404 });
        }

        if (!account.refreshToken) {
            return NextResponse.json({ success: false, error: 'No refresh token' });
        }

        const result = await checkGmail(account.refreshToken, clientId, clientSecret);

        if (result.success) {
            await prisma.account.update({
                where: { email: decodedEmail },
                data: {
                    totalMessages: result.totalMessages,
                    totalThreads: result.totalThreads,
                    status: 'active',
                    lastCheck: new Date()
                }
            });
        } else {
            await prisma.account.update({
                where: { email: decodedEmail },
                data: { status: 'invalid', lastCheck: new Date() }
            });
        }

        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
