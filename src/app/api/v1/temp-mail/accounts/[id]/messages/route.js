import { trackApiHit } from '@/lib/monitoring';
import { NextResponse } from 'next/server';
import { verifyApiKey, recordApiKeyUsage } from '@/lib/auth';
import prisma from '@/lib/db';

const API_BASE = 'https://api.mail.tm';

export async function GET(req, { params }) {
    const auth = await verifyApiKey(req);
    if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });

    const { id } = await params;
    trackApiHit(req);

    try {
        // Verify account ownership
        const account = await prisma.tempMailAccount.findUnique({
            where: { id: id, userId: auth.user.id },
            select: { token: true }
        });

        if (!account || !account.token) {
            await recordApiKeyUsage(auth.apiKeyId, `/api/v1/temp-mail/accounts/${id}/messages`, 'GET', 404);
            return NextResponse.json({ error: 'Account not found or unauthorized' }, { status: 404 });
        }

        const res = await fetch(`${API_BASE}/messages?page=1`, {
            headers: {
                'Authorization': `Bearer ${account.token}`,
                'Accept': 'application/json'
            }
        });

        if (res.ok) {
            const data = await res.json();
            const messages = Array.isArray(data) ? data : (data['hydra:member'] || []);
            
            // Background sync
            if (messages.length > 0) {
                try {
                    let newMessagesCount = 0;
                    for (const msg of messages) {
                        const exists = await prisma.tempMailMessage.findUnique({
                            where: { id: msg.id },
                            select: { id: true }
                        });

                        if (!exists) newMessagesCount++;

                        await prisma.tempMailMessage.upsert({
                            where: { id: msg.id },
                            update: { seen: msg.seen || false },
                            create: {
                                id: msg.id,
                                msgid: msg.msgid || null,
                                fromName: msg.from?.name || null,
                                fromAddress: msg.from?.address || null,
                                subject: msg.subject || null,
                                intro: msg.intro || null,
                                seen: msg.seen || false,
                                createdAt: new Date(msg.createdAt),
                                accountId: id
                            }
                        });
                    }

                    if (newMessagesCount > 0) {
                        await prisma.tempMailStats.upsert({
                            where: { id: 1 },
                            update: { messagesReceived: { increment: newMessagesCount } },
                            create: { id: 1, messagesReceived: newMessagesCount }
                        });
                    }
                } catch (dbErr) { console.error("v1 Nested Message sync err:", dbErr); }
            }

            await recordApiKeyUsage(auth.apiKeyId, `/api/v1/temp-mail/accounts/${id}/messages`, 'GET', 200);
            return NextResponse.json(messages);
        }

        await recordApiKeyUsage(auth.apiKeyId, `/api/v1/temp-mail/accounts/${id}/messages`, 'GET', res.status);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: res.status });

    } catch (error) {
        console.error('v1 Nested Messages List Error:', error);
        await recordApiKeyUsage(auth.apiKeyId, `/api/v1/temp-mail/accounts/${id}/messages`, 'GET', 500);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
