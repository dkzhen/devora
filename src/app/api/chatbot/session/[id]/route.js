import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import prisma from '@/lib/db';
import { decrypt } from '@/lib/encryption';
import { trackApiHit } from '@/lib/monitoring';

const getUserId = async () => {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return payload.sub;
    } catch {
        return null;
    }
};

export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await trackApiHit('/api/chatbot/session/:id');

        // Ensure session belongs to user
        const session = await prisma.chatSession.findFirst({
            where: { id: id, userId }
        });

        if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

        const messages = await prisma.chatMessage.findMany({
            where: { sessionId: id },
            orderBy: { createdAt: 'asc' },
            select: { role: true, content: true }
        });

        const decryptedMessages = messages.map(msg => ({
            role: msg.role,
            content: decrypt(msg.content)
        }));

        return NextResponse.json({ messages: decryptedMessages });
    } catch (error) {
        console.error("GET /api/chatbot/session/[id] error:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await trackApiHit('/api/chatbot/session/:id');

        // Delete where id matches AND userId matches (security)
        await prisma.chatSession.delete({
            where: {
                id: id,
                userId: userId // enforce ownership at DB level, Prisma will throw if not found/owned
            }
        }).catch(err => {
            console.error("Delete failed or unowned", err);
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/chatbot/session/[id] error:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
