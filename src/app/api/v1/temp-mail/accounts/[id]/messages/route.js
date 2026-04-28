import { trackApiHit } from '@/lib/monitoring';
import { NextResponse } from 'next/server';
import { verifyApiKey, recordApiKeyUsage } from '@/lib/auth';
import prisma from '@/lib/db';

const API_BASE = 'https://api.mail.tm';
const MOEMAIL_API_BASE = 'https://moemail-api.danistimikwp.workers.dev';
const MOEMAIL_AUTH = 'Bearer moemail_zhen_2026';

function isMoemailAddress(address = '') {
    return address.includes('.my.id') || address.includes('moemail');
}

export async function GET(req, { params }) {
    const auth = await verifyApiKey(req);
    if (!auth.success) {
        return new Response(JSON.stringify({ error: auth.error }), {
            status: 401,
            headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Encoding': 'identity' }
        });
    }

    const { id } = await params;
    trackApiHit(req);

    try {
        // Verify account ownership
        const account = await prisma.tempMailAccount.findFirst({
            where: { id: id, userId: auth.user.id },
            select: { token: true, address: true }
        });

        if (!account) {
            return new Response(JSON.stringify({ error: 'Account not found or unauthorized' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Encoding': 'identity' }
            });
        }

        if (isMoemailAddress(account.address)) {
            const res = await fetch(`${MOEMAIL_API_BASE}/inbox/${id}`, {
                headers: {
                    'Authorization': MOEMAIL_AUTH,
                    'Accept': 'application/json',
                    'Accept-Encoding': 'identity'
                }
            });

            if (res.ok) {
                const data = await res.json();
                const messages = Array.isArray(data) ? data : (data.messages || []);

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
                                    msgid: msg.id,
                                    fromName: msg.fromName || (msg.from ? msg.from.split('@')[0] : null),
                                    fromAddress: msg.fromAddress || msg.from || null,
                                    subject: msg.subject || null,
                                    intro: msg.body ? msg.body.substring(0, 100) : (msg.subject || 'Click to view message'),
                                    seen: msg.seen || false,
                                    createdAt: msg.createdAt ? new Date(msg.createdAt) : (msg.receivedAt ? new Date(msg.receivedAt) : new Date()),
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
                    } catch (dbErr) { console.error("v1 Nested MoeMail message sync err:", dbErr); }
                }

                await recordApiKeyUsage(auth.apiKeyId, `/api/v1/temp-mail/accounts/${id}/messages`, 'GET', 200);
                return new Response(JSON.stringify(messages), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Encoding': 'identity' }
                });
            }

            await recordApiKeyUsage(auth.apiKeyId, `/api/v1/temp-mail/accounts/${id}/messages`, 'GET', res.status);
            return new Response(JSON.stringify({ error: 'Failed to fetch MoeMail messages' }), {
                status: res.status,
                headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Encoding': 'identity' }
            });
        }

        if (!account.token) {
            return new Response(JSON.stringify({ error: 'Account token not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Encoding': 'identity' }
            });
        }

        const res = await fetch(`${API_BASE}/messages?page=1`, {
            headers: {
                'Authorization': `Bearer ${account.token}`,
                'Accept': 'application/json',
                'Accept-Encoding': 'identity'
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
            return new Response(JSON.stringify(messages), {
                status: 200,
                headers: { 
                    'Content-Type': 'application/json; charset=utf-8',
                    'Content-Encoding': 'identity'
                }
            });
        }

        await recordApiKeyUsage(auth.apiKeyId, `/api/v1/temp-mail/accounts/${id}/messages`, 'GET', res.status);
        return new Response(JSON.stringify({ error: 'Failed to fetch messages' }), {
            status: res.status,
            headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Encoding': 'identity' }
        });

    } catch (error) {
        console.error('v1 Nested Messages List Error:', error);
        await recordApiKeyUsage(auth.apiKeyId, `/api/v1/temp-mail/accounts/${id}/messages`, 'GET', 500);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Encoding': 'identity' }
        });
    }
}
