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
        // Usually payload.sub is the user ID
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
        const appName = formData.get('appName');
        const version = formData.get('version');
        const description = formData.get('description');
        const category = formData.get('category') || 'Utility';
        const developer = formData.get('developer') || '';
        const androidVersion = formData.get('androidVersion') || '';

        const apkFile = formData.get('apkFile');
        const imageFile = formData.get('imageFile');

        if (!appName || !version || !apkFile) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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
                    in: ['TELEGRAM_STORAGE_CHAT_ID', 'TELEGRAM_STORAGE_TOPIC_APK', 'TELEGRAM_STORAGE_TOPIC_IMAGES']
                }
            }
        });

        const configMap = configs.reduce((acc, curr) => {
            acc[curr.key] = decrypt(curr.value) || curr.value;
            return acc;
        }, {});

        const chatId = configMap.TELEGRAM_STORAGE_CHAT_ID;
        const apkTopic = configMap.TELEGRAM_STORAGE_TOPIC_APK;
        const imageTopic = configMap.TELEGRAM_STORAGE_TOPIC_IMAGES;

        if (!chatId || !apkTopic || !imageTopic) {
            return NextResponse.json({ error: 'Storage configuration incomplete' }, { status: 400 });
        }

        let apkFileId = '';
        let imageFileId = '';

        // Helper to send file to Telegram with Retry Logic
        const sendToTelegram = async (file, type, topicId) => {
            const endpoint = type === 'document' ? 'sendDocument' : 'sendPhoto';
            const tgFormData = new FormData();
            tgFormData.append('chat_id', chatId);
            tgFormData.append('message_thread_id', topicId);

            // Convert Next.js File object to Blob to ensure native fetch handles it correctly
            const buffer = await file.arrayBuffer();
            const blob = new Blob([buffer], { type: file.type });
            tgFormData.append(type, blob, file.name);

            tgFormData.append('caption', `Uploaded: ${appName} - ${version}`);

            let lastError;
            const maxAttempts = 3;

            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                    const response = await fetch(`https://api.telegram.org/bot${botToken}/${endpoint}`, {
                        method: 'POST',
                        body: tgFormData
                    });

                    // If response is a server error (e.g., 502), throw to trigger retry
                    if (!response.ok && response.status >= 500) {
                        throw new Error(`HTTP ${response.status} from Telegram API`);
                    }

                    const data = await response.json();

                    if (!data.ok) {
                        // Retry on Telegram internal errors or rate limits
                        if (data.error_code >= 500 || data.error_code === 429) {
                            throw new Error(`Telegram API Error ${data.error_code}: ${data.description}`);
                        }
                        // Don't retry on 400 Bad Request
                        console.error(`[TELEGRAM UPLOAD DEBUG - ${type}] FATAL:`, {
                            chatId,
                            topicId,
                            endpoint,
                            telegramResponseCode: data.error_code,
                            telegramDescription: data.description,
                            fullData: data,
                        });
                        throw new Error(`Telegram rejected upload (unrecoverable): ${data.description || 'Unknown API Error'}`);
                    }

                    // Extract the correct file_id based on type
                    if (type === 'document') {
                        return data.result.document.file_id;
                    } else if (type === 'photo') {
                        // Return the largest photo file_id
                        const photos = data.result.photo;
                        return photos[photos.length - 1].file_id;
                    }
                } catch (err) {
                    lastError = err;
                    console.warn(`[UPLOAD ${type}] Attempt ${attempt} failed: ${err.message}`);
                    if (err.message.includes('(unrecoverable)')) throw err;

                    if (attempt < maxAttempts) {
                        // Wait 2s on 1st retry, 4s on 2nd retry, etc.
                        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
                    }
                }
            }
            throw new Error(`Upload failed after ${maxAttempts} attempts. Last error: ${lastError.message}`);
        };

        // Upload files
        try {
            apkFileId = await sendToTelegram(apkFile, 'document', apkTopic);
            if (imageFile) {
                imageFileId = await sendToTelegram(imageFile, 'photo', imageTopic);
            }
        } catch (uploadError) {
            return NextResponse.json({ error: uploadError.message }, { status: 502 });
        }

        // Save to Database
        const appRecord = await prisma.app.create({
            data: {
                name: appName,
                developer: developer || null,
                category: category,
                description: description || '',
                iconStatic: imageFileId ? null : '📦',
                versions: {
                    create: {
                        version: version,
                        androidVersion: androidVersion || null,
                        apkUrl: apkFileId,
                        imageUrl: imageFileId || null
                    }
                }
            },
            include: {
                versions: true
            }
        });

        return NextResponse.json({
            success: true,
            message: 'App uploaded and saved successfully!',
            app: appRecord
        });

    } catch (error) {
        console.error('Upload handler error details:', error);
        return NextResponse.json({ error: 'Internal server error processing upload: ' + error.message }, { status: 500 });
    }
}
