import { trackApiHit } from '@/lib/monitoring';
import prisma from '@/lib/db';
import { NextResponse } from 'next/server';
import { decrypt } from '@/lib/encryption';

export async function GET(request, { params }) {
    trackApiHit(request);

    try {
        const { fileId } = await params;
        if (!fileId) return NextResponse.json({ error: 'File ID required' }, { status: 400 });

        const configRecord = await prisma.globalConfig.findUnique({
            where: { key: 'BOT_TOKEN_TELEGRAM' }
        });

        if (!configRecord) return NextResponse.json({ error: 'Token missing' }, { status: 404 });
        const botToken = decrypt(configRecord.value);
        if (!botToken) return NextResponse.json({ error: 'Token decryption failed' }, { status: 500 });

        try {
            // 1. Get File path
            const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`, { signal: AbortSignal.timeout(15000) });
            const fileData = await fileRes.json();

            if (!fileData.ok) {
                return NextResponse.json({ error: 'Failed to get file path', detail: fileData.description }, { status: 502 });
            }

            const filePath = fileData.result.file_path;
            const photoUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;

            // 2. Pipe the image data
            const imageRes = await fetch(photoUrl, { signal: AbortSignal.timeout(15000) });
            if (!imageRes.ok) throw new Error('Failed to fetch image data');

            const imageBuffer = await imageRes.arrayBuffer();

            return new NextResponse(imageBuffer, {
                headers: {
                    'Content-Type': imageRes.headers.get('Content-Type') || 'image/jpeg',
                    'Cache-Control': 'public, max-age=86400' // Cache for 1 day
                }
            });
        } catch (apiError) {
            console.error('Telegram External Error:', apiError);
            return NextResponse.json({ error: 'Telegram API Unavailable', message: apiError.message }, { status: 502 });
        }

    } catch (error) {
        console.error('Telegram Image Proxy Error:', error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
