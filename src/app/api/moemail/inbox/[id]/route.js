import { NextResponse } from 'next/server';
import { trackApiHit } from '@/lib/monitoring';
import prisma from '@/lib/db';

const MOEMAIL_API_BASE = 'https://moemail-api.danistimikwp.workers.dev';
const MOEMAIL_AUTH = 'Bearer moemail_zhen_2026';

export async function GET(req, { params }) {
    trackApiHit(req);
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
        }

        const res = await fetch(`${MOEMAIL_API_BASE}/inbox/${id}`, {
            headers: {
                'Authorization': MOEMAIL_AUTH,
                'Accept': 'application/json'
            }
        });

        if (!res.ok) {
            const errorText = await res.text();
            // If the email simply hasn't received anything yet, MoeMail might return an error like "Email not found"
            if (errorText.includes('Email not found') || res.status === 404) {
                return NextResponse.json([]);
            }
            throw new Error(`MoeMail API error: ${errorText}`);
        }

        const data = await res.json();

        // Save messages to database (similar to Mail.tm)
        if (data && data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
            try {
                let newMessagesCount = 0;
                
                for (const msg of data.messages) {
                    // Check if message already exists
                    const exists = await prisma.tempMailMessage.findUnique({
                        where: { id: msg.id }
                    });

                    if (!exists) {
                        newMessagesCount++;
                    }

                    // Upsert message to database
                    await prisma.tempMailMessage.upsert({
                        where: { id: msg.id },
                        update: { 
                            seen: msg.seen || false 
                        },
                        create: {
                            id: msg.id,
                            msgid: msg.id, // MoeMail uses same id
                            fromName: msg.fromName || (msg.from ? msg.from.split('@')[0] : null),
                            fromAddress: msg.fromAddress || msg.from || null,
                            subject: msg.subject || null,
                            intro: msg.body ? msg.body.substring(0, 100) : (msg.subject || null),
                            seen: msg.seen || false,
                            createdAt: msg.createdAt ? new Date(msg.createdAt) : (msg.receivedAt ? new Date(msg.receivedAt) : new Date()),
                            accountId: id
                        }
                    });
                }

                // Update statistics if there are new messages
                if (newMessagesCount > 0) {
                    await prisma.tempMailStats.upsert({
                        where: { id: 1 },
                        update: { messagesReceived: { increment: newMessagesCount } },
                        create: { id: 1, messagesReceived: newMessagesCount }
                    });
                }
            } catch (dbErr) {
                console.error('Error saving MoeMail messages to DB:', dbErr);
                // Don't fail the request if DB save fails
            }
        }

        // Return the data (messages array or full object)
        return NextResponse.json(data);
    } catch (error) {
        console.error('MoeMail Inbox Error:', error);
        return NextResponse.json({ error: 'Failed to fetch MoeMail inbox' }, { status: 500 });
    }
}
