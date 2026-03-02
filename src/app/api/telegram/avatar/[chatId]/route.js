import { trackApiHit } from '@/lib/monitoring';
import prisma from '@/lib/db';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { decrypt } from '@/lib/encryption';

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

export async function GET(request, { params }) {
    trackApiHit(request);

    try {
        const user = await getAuthenticatedUser();
        if (!user || user.role !== 'ULTRA') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const resolvedParams = params instanceof Promise ? await params : params;
        const { chatId } = resolvedParams;
        if (!chatId) return NextResponse.json({ error: 'Chat ID required' }, { status: 400 });

        const configRecord = await prisma.globalConfig.findUnique({
            where: { key: 'BOT_TOKEN_TELEGRAM' }
        });

        if (!configRecord) return NextResponse.json({ error: 'Token missing' }, { status: 404 });
        const botToken = decrypt(configRecord.value);
        if (!botToken) return NextResponse.json({ error: 'Token decryption failed' }, { status: 500 });

        try {
            // 1. Get Chat Info to find the photo file_id
            const chatRes = await fetch(`https://api.telegram.org/bot${botToken}/getChat?chat_id=${chatId}`);
            if (!chatRes.ok) return NextResponse.json({ error: "Telegram HTTP Error", status: chatRes.status }, { status: 502 });

            const chatRaw = await chatRes.text();
            let chatData;
            try { chatData = JSON.parse(chatRaw); }
            catch { return NextResponse.json({ error: "Invalid JSON from Telegram" }, { status: 502 }); }

            if (!chatData.ok || !chatData.result.photo) {
                return NextResponse.json({ error: 'No photo found' }, { status: 404 });
            }

            const fileId = chatData.result.photo.small_file_id;

            // 2. Get File path
            const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
            if (!fileRes.ok) return NextResponse.json({ error: "Telegram HTTP Error", status: fileRes.status }, { status: 502 });

            const fileRaw = await fileRes.text();
            let fileData;
            try { fileData = JSON.parse(fileRaw); }
            catch { return NextResponse.json({ error: "Invalid JSON from Telegram" }, { status: 502 }); }

            if (!fileData.ok) {
                return NextResponse.json({ error: 'Failed to get file path' }, { status: 502 });
            }

            const filePath = fileData.result.file_path;
            const photoUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;

            // 3. Pipe the image data
            const imageRes = await fetch(photoUrl);
            if (!imageRes.ok) throw new Error('Failed to fetch image data');

            return new NextResponse(imageRes.body, {
                headers: {
                    'Content-Type': imageRes.headers.get('Content-Type') || 'image/jpeg',
                    'Cache-Control': 'public, max-age=3600'
                }
            });
        } catch (apiError) {
            console.error('Telegram External Error:', apiError);
            return NextResponse.json({ error: 'Telegram API Unavailable', message: apiError.message }, { status: 502 });
        }

    } catch (error) {
        console.error('Telegram Avatar Route Error:', error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
