import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

const API_BASE = 'https://api.mail.tm';

export async function GET(req) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const accountId = searchParams.get('accountId');

        let externalError = false;
        let messages = [];
        let mailResStatus = 200;

        try {
            const res = await fetch(`${API_BASE}/messages?page=1`, {
                headers: {
                    'Authorization': authHeader,
                    'Accept': 'application/json'
                }
            });
            mailResStatus = res.status;
            // console.log("mailResStatus", mailResStatus);

            if (res.ok) {
                const data = await res.json();
                messages = Array.isArray(data) ? data : (data['hydra:member'] || []);

                if (messages.length > 0 && accountId) {
                    try {
                        for (const msg of messages) {
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
                    } catch (dbErr) {
                        console.error('Error saving messages to DB:', dbErr);
                    }
                }

                return NextResponse.json(messages, { status: 200 });
            } else {
                externalError = true;
            }
        } catch (fetchErr) {
            console.error('Fetch to mail.tm failed:', fetchErr);
            externalError = true;
            mailResStatus = 500;
        }

        if (externalError && accountId) {
            console.log("Falling back to database for messages...");
            try {
                const dbMessages = await prisma.tempMailMessage.findMany({
                    where: { accountId: accountId },
                    orderBy: { createdAt: 'desc' }
                });

                const formattedMessages = dbMessages.map(msg => ({
                    id: msg.id,
                    msgid: msg.msgid,
                    from: { name: msg.fromName, address: msg.fromAddress },
                    subject: msg.subject,
                    intro: msg.intro,
                    seen: msg.seen,
                    createdAt: msg.createdAt.toISOString(),
                }));

                return NextResponse.json(formattedMessages, { status: 200 });
            } catch (dbErr) {
                console.error("DB Fallback error", dbErr);
                return NextResponse.json({ error: 'Services down' }, { status: 500 });
            }
        }

        return NextResponse.json({ error: 'Failed' }, { status: mailResStatus });

    } catch (error) {
        console.error('Messages API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch messages', details: error.message, stack: error.stack }, { status: 500 });
    }
}
