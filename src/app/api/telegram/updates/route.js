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

export async function GET(request) {
    trackApiHit(request);

    try {
        const user = await getAuthenticatedUser();

        // Ensure only ULTRA users can access this console
        if (!user || user.role !== 'ULTRA') {
            return NextResponse.json({ error: 'Unauthorized. Only ULTRA users can access the Telegram Console.' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const shouldSync = searchParams.get('sync') === 'true';

        // ONLY sync when explicitly requested (auto-sync or manual pull)
        // On initial page load, we skip Telegram API and serve from DB directly
        if (shouldSync) {
            try {
                const configRecord = await prisma.globalConfig.findUnique({
                    where: { key: 'BOT_TOKEN_TELEGRAM' }
                });

                if (!configRecord) {
                    return NextResponse.json({ error: 'BOT_TOKEN_NOT_FOUND' }, { status: 404 });
                }

                const botToken = decrypt(configRecord.value);
                if (!botToken) {
                    return NextResponse.json({ error: 'BOT_TOKEN_NOT_FOUND' }, { status: 404 });
                }

                // Fetch updates from Telegram API with a safe timeout
                const telegramRes = await fetch(
                    `https://api.telegram.org/bot${botToken}/getUpdates`,
                    { signal: AbortSignal.timeout(20000) }
                );

                if (telegramRes.ok) {
                    const rawText = await telegramRes.text();
                    let telegramData;
                    try {
                        telegramData = JSON.parse(rawText);
                    } catch (e) {
                        console.error('[Telegram Sync] Invalid JSON from Telegram:', rawText.slice(0, 200));
                        telegramData = null;
                    }

                    if (telegramData && telegramData.ok && Array.isArray(telegramData.result)) {
                        const updates = telegramData.result;

                        if (updates.length > 0) {
                            // Get existing IDs for this user
                            const existingIds = await prisma.telegramUpdate.findMany({
                                where: { userId: user.id },
                                select: { id: true }
                            });
                            const existingIdSet = new Set(existingIds.map(u => u.id.toString()));

                            // Filter and save new updates
                            const newUpdates = updates.filter(u => !existingIdSet.has(u.update_id.toString()));
                            if (newUpdates.length > 0) {
                                await prisma.telegramUpdate.createMany({
                                    data: newUpdates.map(u => ({
                                        id: BigInt(u.update_id),
                                        userId: user.id,
                                        data: JSON.stringify(u)
                                    })),
                                    skipDuplicates: true
                                });
                            }
                        }
                    }
                } else {
                    console.warn('[Telegram Sync] Telegram returned non-OK status:', telegramRes.status);
                }
            } catch (syncError) {
                // Log the error and continue — serve whatever we have in DB
                console.error('[Telegram Sync Recovery]', syncError.message);
            }
        }

        // Always return from DB (both on initial load and after sync)
        return await returnDbUpdates(user.id);

    } catch (error) {
        console.error('Telegram Console API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
    }
}

async function returnDbUpdates(userId) {
    const allUpdates = await prisma.telegramUpdate.findMany({
        where: { userId },
        orderBy: { id: 'desc' },
        take: 100
    });

    const result = allUpdates.map(u => {
        let parsedData = {};
        try {
            parsedData = JSON.parse(u.data);
        } catch (e) {
            console.error('[Telegram DB] Failed to parse update data:', u.id.toString());
        }
        return {
            ...parsedData,
            id: u.id.toString(),
            savedAt: u.createdAt
        };
    });

    return NextResponse.json({ ok: true, result });
}
