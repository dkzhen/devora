import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/encryption';
import prisma from '@/lib/db';
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

export async function POST(req) {
    try {
        await trackApiHit(req);
        const user = await getAuthenticatedUser();
        if (!user || user.role !== 'ULTRA') {
            return NextResponse.json({ error: 'Requires ULTRA role' }, { status: 401 });
        }

        const formData = await req.formData();
        const appId = formData.get('appId');
        const appName = formData.get('appName'); // for caption
        const version = formData.get('version');
        const features = formData.get('features');
        const androidVersion = formData.get('androidVersion') || '';
        const apkFile = formData.get('apkFile');

        if (!appId || !version || !apkFile) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if app exists
        const existingApp = await prisma.app.findUnique({
            where: { id: appId },
            include: { versions: { orderBy: { releaseDate: 'desc' }, take: 1 } }
        });

        if (!existingApp) {
            return NextResponse.json({ error: 'App not found' }, { status: 404 });
        }

        // Retrieve the latest version's imageUrl to inherit if any
        let existingImageUrl = null;
        if (existingApp.versions && existingApp.versions.length > 0) {
            existingImageUrl = existingApp.versions[0].imageUrl;
        }

        // Get Bot Token
        const botTokenConfig = await prisma.globalConfig.findUnique({
            where: { key: 'BOT_TOKEN_TELEGRAM' }
        });

        if (!botTokenConfig) {
            return NextResponse.json({ error: 'Telegram Bot Token not configured' }, { status: 400 });
        }
        const botToken = decrypt(botTokenConfig.value);

        // Get Storage Configs
        const configs = await prisma.globalConfig.findMany({
            where: {
                key: {
                    in: ['TELEGRAM_STORAGE_CHAT_ID', 'TELEGRAM_STORAGE_TOPIC_APK']
                }
            }
        });

        const configMap = configs.reduce((acc, curr) => {
            acc[curr.key] = decrypt(curr.value) || curr.value;
            return acc;
        }, {});

        const chatId = configMap.TELEGRAM_STORAGE_CHAT_ID;
        const apkTopic = configMap.TELEGRAM_STORAGE_TOPIC_APK;

        if (!chatId || !apkTopic) {
            return NextResponse.json({ error: 'Storage configuration incomplete' }, { status: 400 });
        }

        let apkFileId = '';

        // Helper to send file to Telegram with Retry Logic
        const sendToTelegram = async (file, type, topicId) => {
            const endpoint = type === 'document' ? 'sendDocument' : 'sendPhoto';
            const tgFormData = new FormData();
            tgFormData.append('chat_id', chatId);
            tgFormData.append('message_thread_id', topicId);

            const buffer = await file.arrayBuffer();
            const blob = new Blob([buffer], { type: file.type });
            tgFormData.append(type, blob, file.name);

            tgFormData.append('caption', `Update: ${appName} - ${version}`);

            let lastError;
            const maxAttempts = 3;

            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                    const response = await fetch(`https://api.telegram.org/bot${botToken}/${endpoint}`, {
                        method: 'POST',
                        body: tgFormData
                    });

                    if (!response.ok && response.status >= 500) {
                        throw new Error(`HTTP ${response.status} from Telegram API`);
                    }

                    const data = await response.json();

                    if (!data.ok) {
                        if (data.error_code >= 500 || data.error_code === 429) {
                            throw new Error(`Telegram API Error ${data.error_code}: ${data.description}`);
                        }
                        console.error(`[TELEGRAM UPLOAD DEBUG - ${type}] FATAL:`, {
                            chatId,
                            topicId,
                            endpoint,
                            telegramResponseCode: data.error_code,
                            telegramDescription: data.description,
                        });
                        throw new Error(`Telegram rejected upload (unrecoverable): ${data.description || 'Unknown API Error'}`);
                    }

                    if (type === 'document') {
                        return data.result.document.file_id;
                    } else if (type === 'photo') {
                        const photos = data.result.photo;
                        return photos[photos.length - 1].file_id;
                    }
                } catch (err) {
                    lastError = err;
                    console.warn(`[UPLOAD ${type}] Attempt ${attempt} failed: ${err.message}`);
                    if (err.message.includes('(unrecoverable)')) throw err;

                    if (attempt < maxAttempts) {
                        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
                    }
                }
            }
            throw new Error(`Upload failed after ${maxAttempts} attempts. Last error: ${lastError.message}`);
        };

        // Upload files
        try {
            apkFileId = await sendToTelegram(apkFile, 'document', apkTopic);
        } catch (uploadError) {
            return NextResponse.json({ error: uploadError.message }, { status: 502 });
        }

        // Save to Database
        const newVersionRecord = await prisma.appVersion.create({
            data: {
                appId: appId,
                version: version,
                androidVersion: androidVersion || null,
                apkUrl: apkFileId,
                imageUrl: existingImageUrl,
                features: features || null
            }
        });

        // Update the app's updatedAt stamp
        await prisma.app.update({
            where: { id: appId },
            data: { updatedAt: new Date() }
        });

        return NextResponse.json({
            success: true,
            message: 'Version added successfully!',
            version: newVersionRecord
        });

    } catch (error) {
        console.error('Add version upload handler error details:', error);
        return NextResponse.json({ error: 'Internal server error processing upload: ' + error.message }, { status: 500 });
    }
}
