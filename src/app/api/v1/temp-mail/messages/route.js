import { trackApiHit } from '@/lib/monitoring';
import { NextResponse } from 'next/server';
import { verifyApiKey, recordApiKeyUsage } from '@/lib/auth';
import prisma from '@/lib/db';

const API_BASE = 'https://api.mail.tm';
const MOEMAIL_API_BASE = 'https://moemail-api.danistimikwp.workers.dev';
const MOEMAIL_AUTH = 'Bearer moemail_zhen_2026';

export async function GET(req) {
    const auth = await verifyApiKey(req);
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    trackApiHit(req);

    try {
        const { searchParams } = new URL(req.url);
        const accountId = searchParams.get('accountId');
        const provider = searchParams.get('provider') || 'mail.tm';

        if (!accountId) {
            await recordApiKeyUsage(auth.apiKeyId, '/api/v1/temp-mail/messages', 'GET', 400);
            return NextResponse.json({ error: 'accountId required' }, { status: 400 });
        }

        let messages = [];
        let statusCode = 200;

        if (provider === 'moemail') {
            // Fetch from MoeMail API
            try {
                const res = await fetch(`${MOEMAIL_API_BASE}/inbox/${accountId}`, {
                    headers: {
                        'Authorization': MOEMAIL_AUTH,
                        'Accept': 'application/json'
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    const messagesArray = Array.isArray(data) ? data : (data.messages || []);

                    // Save messages to database
                    if (messagesArray.length > 0) {
                        let newMessagesCount = 0;
                        
                        for (const msg of messagesArray) {
                            const exists = await prisma.tempMailMessage.findUnique({
                                where: { id: msg.id }
                            });

                            if (!exists) {
                                newMessagesCount++;
                            }

                            await prisma.tempMailMessage.upsert({
                                where: { id: msg.id },
                                update: { seen: msg.seen || false },
                                create: {
                                    id: msg.id,
                                    msgid: msg.id,
                                    fromName: msg.fromName || (msg.from ? msg.from.split('@')[0] : null),
                                    fromAddress: msg.fromAddress || msg.from || null,
                                    subject: msg.subject || null,
                                    intro: msg.body ? msg.body.substring(0, 100) : (msg.subject || null),
                                    seen: msg.seen || false,
                                    createdAt: msg.createdAt ? new Date(msg.createdAt) : (msg.receivedAt ? new Date(msg.receivedAt) : new Date()),
                                    accountId: accountId
                                }
                            });
                        }

                        // Update statistics
                        if (newMessagesCount > 0) {
                            await prisma.tempMailStats.upsert({
                                where: { id: 1 },
                                update: { messagesReceived: { increment: newMessagesCount } },
                                create: { id: 1, messagesReceived: newMessagesCount }
                            });
                        }
                    }

                    messages = messagesArray;
                } else {
                    statusCode = res.status;
                }
            } catch (error) {
                console.error('MoeMail fetch error:', error);
                statusCode = 500;
            }
        } else {
            // Mail.tm flow - get token from database
            const account = await prisma.tempMailAccount.findUnique({
                where: { id: accountId },
                select: { token: true }
            });

            if (!account || !account.token) {
                await recordApiKeyUsage(auth.apiKeyId, '/api/v1/temp-mail/messages', 'GET', 401);
                return NextResponse.json({ error: 'Account not found or no token' }, { status: 401 });
            }

            try {
                const res = await fetch(`${API_BASE}/messages?page=1`, {
                    headers: {
                        'Authorization': `Bearer ${account.token}`,
                        'Accept': 'application/json'
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    messages = Array.isArray(data) ? data : (data['hydra:member'] || []);

                    // Save messages to database
                    if (messages.length > 0) {
                        let newMessagesCount = 0;
                        
                        for (const msg of messages) {
                            const exists = await prisma.tempMailMessage.findUnique({
                                where: { id: msg.id }
                            });

                            if (!exists) {
                                newMessagesCount++;
                            }

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
                                    accountId: accountId
                                }
                            });
                        }

                        // Update statistics
                        if (newMessagesCount > 0) {
                            await prisma.tempMailStats.upsert({
                                where: { id: 1 },
                                update: { messagesReceived: { increment: newMessagesCount } },
                                create: { id: 1, messagesReceived: newMessagesCount }
                            });
                        }
                    }
                } else {
                    statusCode = res.status;
                }
            } catch (error) {
                console.error('Mail.tm fetch error:', error);
                statusCode = 500;
            }
        }

        await recordApiKeyUsage(auth.apiKeyId, '/api/v1/temp-mail/messages', 'GET', statusCode);
        return NextResponse.json({ 
            success: true,
            messages,
            count: messages.length 
        }, { status: statusCode });

    } catch (error) {
        console.error('v1 Messages API Error:', error);
        await recordApiKeyUsage(auth.apiKeyId, '/api/v1/temp-mail/messages', 'GET', 500);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}
