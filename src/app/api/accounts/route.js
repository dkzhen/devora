import prisma from '@/lib/db';
import { checkGmail } from '@/lib/services/gmail.service';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

async function getAuthenticatedUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return null;

    try {
        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secretKey);
        return await prisma.user.findUnique({ where: { id: payload.sub } });
    } catch (e) {
        console.error('getAuthenticatedUser error:', e);
        return null;
    }
}

export async function GET() {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const accounts = await prisma.account.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(accounts);
    } catch (error) {
        console.error('API Accounts GET Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Handler for refreshing/checking all accounts
export async function POST(request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action } = await request.json(); // e.g. { action: 'check-all' }

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

        if (action === 'check-all') {
            const accounts = await prisma.account.findMany({
                where: { userId: user.id }
            });
            const results = [];

            for (const account of accounts) {
                if (!account.refreshToken) {
                    results.push({ email: account.email, success: false, error: 'No refresh token' });
                    continue;
                }

                const result = await checkGmail(account.refreshToken, clientId, clientSecret);
                // Status mapping:
                // Only update if success or explicitly invalid.
                if (result.success) {
                    await prisma.account.update({
                        where: { email: account.email },
                        data: {
                            totalMessages: result.totalMessages,
                            totalThreads: result.totalThreads,
                            status: 'active',
                            lastCheck: new Date()
                        }
                    });
                } else {
                    await prisma.account.update({
                        where: { email: account.email },
                        data: { status: 'invalid', lastCheck: new Date() }
                    });
                }
                results.push({ email: account.email, ...result });
            }

            return NextResponse.json({ success: true, results });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
