import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

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

/**
 * GET - Check if Telegram credentials are configured
 * Returns status of GROQ_API_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHANNEL_ID
 */
export async function GET(request) {
    try {
        const user = await getAuthenticatedUser();
        
        // Only ULTRA users can check telegram config
        if (!user || user.role !== 'ULTRA') {
            return NextResponse.json({ 
                configured: false,
                message: 'Unauthorized'
            }, { status: 401 });
        }

        // Check if required credentials exist in GlobalConfig
        const requiredKeys = ['GROQ_API_KEY', 'TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHANNEL_ID'];
        const configs = await prisma.globalConfig.findMany({
            where: {
                key: { in: requiredKeys }
            },
            select: { key: true }
        });

        const existingKeys = configs.map(c => c.key);
        const missingKeys = requiredKeys.filter(key => !existingKeys.includes(key));

        const allConfigured = missingKeys.length === 0;

        return NextResponse.json({
            configured: allConfigured,
            missingKeys,
            message: allConfigured 
                ? 'All Telegram credentials are configured' 
                : `Missing credentials: ${missingKeys.join(', ')}`
        });

    } catch (error) {
        console.error('[check-telegram] Error:', error);
        return NextResponse.json({ 
            configured: false,
            error: 'Failed to check credentials',
            message: error.message 
        }, { status: 500 });
    }
}
