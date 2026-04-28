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

    const { id, msgId } = await params;
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
            const res = await fetch(`${MOEMAIL_API_BASE}/message/${msgId}`, {
                headers: {
                    'Authorization': MOEMAIL_AUTH,
                    'Accept': 'application/json',
                    'Accept-Encoding': 'identity'
                }
            });

            if (res.ok) {
                const messageData = await res.json();
                const normalizedMessage = {
                    ...messageData,
                    html: messageData.html && typeof messageData.html === 'string' ? [messageData.html] : (messageData.html || null),
                    text: messageData.text || '',
                    from: {
                        name: messageData.fromName || (messageData.from ? messageData.from.split('@')[0] : 'Unknown'),
                        address: messageData.fromAddress || messageData.from || ''
                    },
                    subject: messageData.subject || '(No Subject)'
                };

                try {
                    await prisma.tempMailMessage.upsert({
                        where: { id: messageData.id || msgId },
                        update: {
                            seen: messageData.seen || true,
                            subject: messageData.subject || null,
                            intro: messageData.text ? messageData.text.substring(0, 100) : (messageData.subject || 'Click to view message'),
                        },
                        create: {
                            id: messageData.id || msgId,
                            msgid: messageData.id || msgId,
                            fromName: normalizedMessage.from.name,
                            fromAddress: normalizedMessage.from.address,
                            subject: messageData.subject || null,
                            intro: messageData.text ? messageData.text.substring(0, 100) : (messageData.subject || 'Click to view message'),
                            seen: messageData.seen || true,
                            createdAt: messageData.createdAt ? new Date(messageData.createdAt) : (messageData.receivedAt ? new Date(messageData.receivedAt) : new Date()),
                            accountId: id,
                        }
                    });
                } catch (dbErr) { console.error("v1 Nested MoeMail detail sync err:", dbErr); }

                await recordApiKeyUsage(auth.apiKeyId, `/api/v1/temp-mail/accounts/${id}/messages/${msgId}`, 'GET', 200);
                return new Response(JSON.stringify(normalizedMessage), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Encoding': 'identity' }
                });
            }

            await recordApiKeyUsage(auth.apiKeyId, `/api/v1/temp-mail/accounts/${id}/messages/${msgId}`, 'GET', res.status);
            return new Response(JSON.stringify({ error: 'Failed to fetch MoeMail message detail' }), {
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
                headers: { 
                    'Content-Type': 'application/json; charset=utf-8',
                    'Content-Encoding': 'identity'
                }
            });
        }

        await recordApiKeyUsage(auth.apiKeyId, `/api/v1/temp-mail/accounts/${id}/messages/${msgId}`, 'GET', res.status);
        return new Response(JSON.stringify({ error: 'Failed to fetch message detail' }), {
            status: res.status,
            headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Encoding': 'identity' }
        });

    } catch (error) {
        console.error('v1 Nested Message Detail Error:', error);
        await recordApiKeyUsage(auth.apiKeyId, `/api/v1/temp-mail/accounts/${id}/messages/${msgId}`, 'GET', 500);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Encoding': 'identity' }
        });
    }
}
