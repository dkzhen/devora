import { trackApiHit } from '@/lib/monitoring';
import { NextResponse } from 'next/server';
import { verifyApiKey, recordApiKeyUsage } from '@/lib/auth';
import prisma from '@/lib/db';

const API_BASE = 'https://api.mail.tm';

export async function GET(req, { params }) {
    const auth = await verifyApiKey(req);
    if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });

    const { id, msgId } = await params;
    trackApiHit(req);

    try {
        // Verify account ownership
        const account = await prisma.tempMailAccount.findUnique({
            where: { id: id, userId: auth.user.id },
            select: { token: true }
        });

        if (!account || !account.token) {
            await recordApiKeyUsage(auth.apiKeyId, `/api/v1/temp-mail/accounts/${id}/messages/${msgId}`, 'GET', 404);
            return NextResponse.json({ error: 'Account not found or unauthorized' }, { status: 404 });
        }

        const res = await fetch(`${API_BASE}/messages/${msgId}`, {
            headers: {
                'Authorization': `Bearer ${account.token}`,
                'Accept': 'application/json',
                'Accept-Encoding': 'identity'
            }
        });

        if (res.ok) {
            const messageData = await res.json();
            
            // Background sync
            try {
                await prisma.tempMailMessage.upsert({
                    where: { id: messageData.id },
                    update: {
                        seen: messageData.seen || true,
                        subject: messageData.subject,
                        intro: messageData.intro,
                    },
                    create: {
                        id: messageData.id,
                        msgid: messageData.msgid || null,
                        fromName: messageData.from?.name || null,
                        fromAddress: messageData.from?.address || null,
                        subject: messageData.subject,
                        intro: messageData.intro,
                        seen: messageData.seen || true,
                        createdAt: new Date(messageData.createdAt),
                        accountId: id,
                    }
                });
            } catch (dbErr) { console.error("v1 Nested Message detail sync err:", dbErr); }

            await recordApiKeyUsage(auth.apiKeyId, `/api/v1/temp-mail/accounts/${id}/messages/${msgId}`, 'GET', 200);
            return new Response(JSON.stringify(messageData), {
                status: 200,
                headers: { 'Content-Type': 'application/json; charset=utf-8' }
            });
        }

        await recordApiKeyUsage(auth.apiKeyId, `/api/v1/temp-mail/accounts/${id}/messages/${msgId}`, 'GET', res.status);
        return NextResponse.json({ error: 'Failed to fetch message detail' }, { status: res.status });

    } catch (error) {
        console.error('v1 Nested Message Detail Error:', error);
        await recordApiKeyUsage(auth.apiKeyId, `/api/v1/temp-mail/accounts/${id}/messages/${msgId}`, 'GET', 500);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
