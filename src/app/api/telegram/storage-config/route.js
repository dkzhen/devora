import prisma from '@/lib/db';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { encrypt, decrypt } from '@/lib/encryption';
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

const STORAGE_KEYS = [
    'TELEGRAM_STORAGE_CHAT_ID',
    'TELEGRAM_STORAGE_TOPIC_APK',
    'TELEGRAM_STORAGE_TOPIC_IMAGES',
    'TELEGRAM_STORAGE_TOPIC_METADATA'
];

export async function GET(request) {
    trackApiHit(request);
    const user = await getAuthenticatedUser();
    if (!user || user.role !== 'ULTRA') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Check if Bot Token exists first
        const botToken = await prisma.globalConfig.findUnique({
            where: { key: 'BOT_TOKEN_TELEGRAM' }
        });

        if (!botToken) {
            return NextResponse.json({ error: 'BOT_TOKEN_NOT_FOUND' }, { status: 404 });
        }

        const configs = await prisma.globalConfig.findMany({
            where: { key: { in: STORAGE_KEYS } }
        });

        const configMap = {};
        configs.forEach(c => {
            configMap[c.key] = decrypt(c.value);
        });

        return NextResponse.json({ success: true, config: configMap });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
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

        // Validasi: Chat ID, APK Topic, dan Image Topic wajib diisi
        if (!body.TELEGRAM_STORAGE_CHAT_ID || !body.TELEGRAM_STORAGE_TOPIC_APK || !body.TELEGRAM_STORAGE_TOPIC_IMAGES) {
            return NextResponse.json({ 
                error: 'Chat ID, APK Topic ID, and Image Topic ID are required' 
            }, { status: 400 });
        }

        // Validasi: Chat ID harus dimulai dengan "-"
        if (!String(body.TELEGRAM_STORAGE_CHAT_ID).startsWith('-')) {
            return NextResponse.json({ 
                error: 'Chat ID must start with "-" (e.g., -100xxxxxxxxxx)' 
            }, { status: 400 });
        }

        // Validasi: Topic IDs harus berupa angka
        if (isNaN(body.TELEGRAM_STORAGE_TOPIC_APK) || isNaN(body.TELEGRAM_STORAGE_TOPIC_IMAGES)) {
            return NextResponse.json({ 
                error: 'Topic IDs must be valid numbers' 
            }, { status: 400 });
        }

        const updates = STORAGE_KEYS.map(key => {
            if (body[key] !== undefined && body[key] !== '') {
                return prisma.globalConfig.upsert({
                    where: { key },
                    update: { value: encrypt(String(body[key])) },
                    create: { key, value: encrypt(String(body[key])), description: `Telegram Storage Setting: ${key}` }
                });
            }
            return null;
        }).filter(Boolean);

        await Promise.all(updates);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
