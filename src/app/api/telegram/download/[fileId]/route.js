import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';
import { decrypt } from '@/lib/encryption';
import { trackApiHit } from '@/lib/monitoring';

async function getAuthenticatedUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return null;

    try {
        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secretKey);
        const userId = payload.sub || payload.id;
        return await prisma.user.findUnique({ where: { id: userId } });
    } catch (e) {
        return null;
    }
}

export async function GET(request, { params }) {
    try {
        const { fileId } = await params;
        await trackApiHit(request, `/api/telegram/download/:fileId`);
        // Authenticate user
        const user = await getAuthenticatedUser();
        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }


        if (!fileId) {
            return new NextResponse('File ID is required', { status: 400 });
        }

        // Get Bot Token
        const botTokenConfig = await prisma.globalConfig.findUnique({
            where: { key: 'BOT_TOKEN_TELEGRAM' }
        });

        if (!botTokenConfig) {
            return new NextResponse('Telegram Bot Token not configured', { status: 500 });
        }
        const botToken = decrypt(botTokenConfig.value);

        // Fetch file info from Telegram
        const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`, {
            signal: AbortSignal.timeout(15000)
        });

        const fileData = await fileRes.json();

        if (!fileData.ok) {
            console.error('Telegram getFile Error:', fileData);
            return new NextResponse('Failed to get file information from Telegram', { status: 502 });
        }

        const filePath = fileData.result.file_path;
        const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;

        // Fetch the actual file
        const downloadRes = await fetch(fileUrl, {
            signal: AbortSignal.timeout(30000) // longer timeout for potentially large files
        });

        if (!downloadRes.ok) {
            return new NextResponse('Failed to download file from Telegram', { status: 502 });
        }

        const fileBuffer = await downloadRes.arrayBuffer();

        // Increment download count on the parent App
        try {
            const versionRecord = await prisma.appVersion.findFirst({
                where: { apkUrl: fileId },
                select: { appId: true }
            });
            if (versionRecord) {
                await prisma.app.update({
                    where: { id: versionRecord.appId },
                    data: { downloadCount: { increment: 1 } }
                });
            }
        } catch (countErr) {
            console.error('Failed to increment download count:', countErr);
        }

        // Try to guess a filename if possible, otherwise generic default
        const fileName = filePath.split('/').pop() || 'download.apk';

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': downloadRes.headers.get('Content-Type') || 'application/vnd.android.package-archive',
                'Content-Disposition': `attachment; filename="${fileName}"`,
                'Content-Length': fileBuffer.byteLength.toString(),
            }
        });

    } catch (error) {
        console.error('Download Proxy Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
