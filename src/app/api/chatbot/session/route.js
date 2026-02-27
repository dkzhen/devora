import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import prisma from '@/lib/db';
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

export async function GET(request) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await trackApiHit('/api/chatbot/session');

        const sessions = await prisma.chatSession.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
            select: { id: true, title: true, updatedAt: true }
        });

        return NextResponse.json({ sessions });
    } catch (error) {
        console.error("GET /api/chatbot/session error:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await trackApiHit('/api/chatbot/session');

        const session = await prisma.chatSession.create({
            data: {
                userId,
                title: 'New Chat'
            }
        });

        return NextResponse.json({ session });
    } catch (error) {
        console.error("POST /api/chatbot/session error:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
