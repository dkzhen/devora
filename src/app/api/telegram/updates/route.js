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

        // Check if we already have updates in the DB
        const dbUpdateCount = await prisma.telegramUpdate.count({
            where: { userId: user.id }
        });

        // Sync if requested OR if we have no history at all
        if (shouldSync || dbUpdateCount === 0) {
            try {
                // Fetch the BOT_TOKEN_TELEGRAM from Global Configs
                const configRecord = await prisma.globalConfig.findUnique({
                    where: { key: 'BOT_TOKEN_TELEGRAM' }
                });

                if (configRecord) {
                    // Decrypt the token
                    const botToken = decrypt(configRecord.value);
                    if (botToken) {
                        // Fetch updates from Telegram API (increased timeout for better stability)
                        const telegramRes = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates`, { signal: AbortSignal.timeout(8000) });

                        if (telegramRes.ok) {
                            const telegramData = await telegramRes.json();
                            if (telegramData.ok && Array.isArray(telegramData.result)) {
                                const updates = telegramData.result;

                                // Sync with Database
                                // 1. Get existing IDs for this user
                                const existingIds = await prisma.telegramUpdate.findMany({
                                    where: { userId: user.id },
                                    select: { id: true }
                                });
                                const existingIdSet = new Set(existingIds.map(u => u.id.toString()));

                                // 2. Filter for new updates
                                const newUpdates = updates.filter(u => !existingIdSet.has(u.update_id.toString()));

                                // 3. Save new updates
                                if (newUpdates.length > 0) {
                                    await prisma.telegramUpdate.createMany({
                                        data: newUpdates.map(u => ({
                                            id: BigInt(u.update_id),
                                            userId: user.id,
                                            data: u
                                        })),
                                        skipDuplicates: true
                                    });
                                }
                            }
                        }
                    } else {
                        return NextResponse.json({ error: 'BOT_TOKEN_NOT_FOUND' }, { status: 404 });
                    }
                } else {
                    return NextResponse.json({ error: 'BOT_TOKEN_NOT_FOUND' }, { status: 404 });
                }
            } catch (syncError) {
                const isTimeout = syncError.name === 'AbortError' || syncError.code === 'ETIMEDOUT' || syncError.cause?.code === 'ETIMEDOUT';
                console.error(`[Telegram Sync Recovery] ${isTimeout ? 'Network Timeout (8s)' : 'Fetch Error'}: ${syncError.message}`);
                // Continue to return DB updates even if sync fails
            }

            // If we just sync-failed and have no data, return a specific error
            const finalCount = await prisma.telegramUpdate.count({ where: { userId: user.id } });
            if (finalCount === 0) {
                return NextResponse.json({ error: 'Failed to sync with Telegram and no history found.' }, { status: 502 });
            }
        }

        // Return from DB
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

    const result = allUpdates.map(u => ({
        ...u.data,
        id: u.id.toString(),
        savedAt: u.createdAt
    }));

    return NextResponse.json({ ok: true, result });
}
