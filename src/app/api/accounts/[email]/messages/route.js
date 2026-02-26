import prisma from '@/lib/db';
import { getLatestMessages } from '@/lib/services/gmail.service';
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

// Get messages for an account (from DB)
export async function GET(request, { params }) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { email } = await params;
        const decodedEmail = decodeURIComponent(email);

        // Verify ownership
        const account = await prisma.account.findFirst({
            where: { email: decodedEmail, userId: user.id }
        });

        if (!account) {
            return NextResponse.json({ error: 'Account not found' }, { status: 404 });
        }

        const messages = await prisma.message.findMany({
            where: { accountId: decodedEmail },
            orderBy: { receivedAt: 'desc' }
        });

        return NextResponse.json(messages);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Trigger refresh from Gmail
export async function POST(request, { params }) {
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

        // Verify ownership and get refresh token
        const account = await prisma.account.findFirst({
            where: { email: decodedEmail, userId: user.id }
        });

        if (!account || !account.refreshToken) {
            return NextResponse.json({ error: 'Account not found or not linked' }, { status: 404 });
        }

        // Fetch latest 5 messages from Gmail
        const messages = await getLatestMessages(account.refreshToken, clientId, clientSecret);

        // Transaction: Delete old messages for this account, insert new ones
        await prisma.$transaction([
            prisma.message.deleteMany({
                where: { accountId: decodedEmail }
            }),
            prisma.message.createMany({
                data: messages.map(msg => ({
                    id: msg.id,
                    subject: msg.subject,
                    from: msg.from,
                    snippet: msg.snippet,
                    body: msg.body,
                    receivedAt: msg.receivedAt,
                    accountId: decodedEmail
                }))
            })
        ]);

        // Return the fresh messages
        return NextResponse.json(messages);

    } catch (error) {
        console.error('Error syncing messages:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
