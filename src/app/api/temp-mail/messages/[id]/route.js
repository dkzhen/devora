import { NextResponse } from 'next/server';
import { trackApiHit } from '@/lib/monitoring';

import prisma from '@/lib/db';

const API_BASE = 'https://api.mail.tm';

export async function GET(req, { params }) {
    trackApiHit(req);
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Must await params in Next.js 15+ 
        const { id } = await params;

        let messageData = null;

        try {
            const res = await fetch(`${API_BASE}/messages/${id}`, {
                headers: {
                    'Authorization': authHeader,
                    'Accept': 'application/json'
                }
            });

            if (res.ok) {
                messageData = await res.json();

                // Save/update full details to DB if fetched from API successfully
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
                            accountId: messageData.accountId,
                        }
                    });
                } catch (dbErr) {
                    console.error("Failed to update message details in DB:", dbErr);
                }
            } else {
                throw new Error(`API returned ${res.status}`);
            }
        } catch (fetchErr) {
            console.log(`Fetch to mail.tm for detail ${id} failed:`, fetchErr);
            console.log('Falling back to database for message details...');

            // Fallback to database
            const dbMsg = await prisma.tempMailMessage.findUnique({
                where: { id }
            });

            if (dbMsg) {
                // Reconstruct data to match expected API shape
                messageData = {
                    id: dbMsg.id,
                    msgid: dbMsg.msgid,
                    from: { name: dbMsg.fromName, address: dbMsg.fromAddress },
                    subject: dbMsg.subject,
                    intro: dbMsg.intro,
                    text: dbMsg.text,
                    html: dbMsg.html ? JSON.parse(dbMsg.html) : null,
                    seen: dbMsg.seen,
                    createdAt: dbMsg.createdAt.toISOString(),
                };
            }
        }

        if (messageData) {
            return NextResponse.json(messageData, { status: 200 });
        } else {
            return NextResponse.json({ error: 'Message not found in API or Database' }, { status: 404 });
        }
    } catch (error) {
        console.error('Message Detail API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch message details' }, { status: 500 });
    }
}
