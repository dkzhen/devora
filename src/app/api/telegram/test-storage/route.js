import prisma from '@/lib/db';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { decrypt } from '@/lib/encryption';
import { trackApiHit } from '@/lib/monitoring';

async function getAuthenticatedUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return null;

    try {
        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secretKey);
        return await prisma.user.findUnique({ where: { id: payload.sub } });
    } catch (e) {
        return null;
    }
}

export async function POST(request) {
    trackApiHit(request);
    const user = await getAuthenticatedUser();
    if (!user || user.role !== 'ULTRA') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { chatId, topicId, type } = body;

        if (!chatId || !topicId) {
            return NextResponse.json({ error: 'Chat ID and Topic ID are required' }, { status: 400 });
        }

        // Get Bot Token
        const botConfig = await prisma.globalConfig.findUnique({
            where: { key: 'BOT_TOKEN_TELEGRAM' }
        });

        if (!botConfig) {
            return NextResponse.json({ error: 'BOT_TOKEN_TELEGRAM not found in configuration' }, { status: 404 });
        }

        const botToken = decrypt(botConfig.value);

        // Send Test Message
        // Format: https://api.telegram.org/bot<token>/sendMessage?chat_id=<chat_id>&message_thread_id=<topic_id>&text=<text>
        const text = `🛠 *Storage Test Connection*\n\nType: ${type}\nStatus: Success\nTimestamp: ${new Date().toISOString()}\n\nVerified by ULTRA Developer Utility.`;

        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                message_thread_id: parseInt(topicId),
                text: text,
                parse_mode: 'Markdown'
            }),
            signal: AbortSignal.timeout(10000)
        });

        const data = await response.json();

        if (!response.ok || !data.ok) {
            return NextResponse.json({ error: data.description || 'Telegram API Error' }, { status: response.status });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
