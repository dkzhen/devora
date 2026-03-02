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
        const resolvedParams = params instanceof Promise ? await params : params;
        const { fileId } = resolvedParams;
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
        const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);

        if (!fileRes.ok) {
            return new NextResponse("Telegram HTTP Error: " + fileRes.status, { status: 502 });
        }

        const rawText = await fileRes.text();
        let fileData;
        try {
            fileData = JSON.parse(rawText);
        } catch {
            return new NextResponse("Invalid JSON from Telegram", { status: 502 });
        }

        if (!fileData.ok) {
            console.error('Telegram getFile Error:', fileData);
            return new NextResponse('Failed to get file information from Telegram', { status: 502 });
        }

        const filePath = fileData.result.file_path;
        const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;

        // Fetch the actual file
        const downloadRes = await fetch(fileUrl);

        if (!downloadRes.ok) {
            return new NextResponse('Failed to download file from Telegram', { status: 502 });
        }

        // Increment download count on the parent App (fire and forget to not block stream)
        const updateCount = async () => {
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
        };
        updateCount();

        // Try to guess a filename if possible, otherwise generic default
        const fileName = filePath.split('/').pop() || 'download.apk';

        const headers = new Headers();
        headers.set('Content-Type', downloadRes.headers.get('Content-Type') || 'application/vnd.android.package-archive');
        headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
        const contentLength = downloadRes.headers.get('Content-Length');
        if (contentLength) {
            headers.set('Content-Length', contentLength);
        }

        return new NextResponse(downloadRes.body, { headers });

    } catch (error) {
        console.error('Download Proxy Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
