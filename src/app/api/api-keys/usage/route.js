import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import prisma from '@/lib/db';
import { trackApiHit } from '@/lib/monitoring';

export async function GET(request) {
    trackApiHit(request);
    try {
        const auth = await verifyAuth(request);
        if (!auth.success) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const history = await prisma.apiKeyUsage.findMany({
            where: {
                apiKey: { userId: auth.user.id }
            },
            include: {
                apiKey: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 10 // Limit to recent 10 hits
        });

        // Get token stats for the user
        const tokenStats = await prisma.userApiStats.findUnique({
            where: { userId: auth.user.id },
            select: {
                totalPromptTokens: true,
                totalCompletionTokens: true,
                totalTokens: true
            }
        });

        // Get user's API keys to check for custom rate limits
        const userApiKeys = await prisma.apiKey.findMany({
            where: { userId: auth.user.id },
            select: {
                rateLimitRpm: true,
                rateLimitRpd: true,
                rateLimitMaxTokens: true
            }
        });

        // Find the most restrictive rate limits across all user's keys
        // (or use defaults if no custom limits set)
        let minRpm = null;
        let minRpd = null;
        let minMaxTokens = null;

        userApiKeys.forEach(key => {
            if (key.rateLimitRpm !== null) {
                minRpm = minRpm === null ? key.rateLimitRpm : Math.min(minRpm, key.rateLimitRpm);
            }
            if (key.rateLimitRpd !== null) {
                minRpd = minRpd === null ? key.rateLimitRpd : Math.min(minRpd, key.rateLimitRpd);
            }
            if (key.rateLimitMaxTokens !== null) {
                const tokenLimit = Number(key.rateLimitMaxTokens);
                minMaxTokens = minMaxTokens === null ? tokenLimit : Math.min(minMaxTokens, tokenLimit);
            }
        });

        // Convert BigInt to Number for JSON serialization
        const serializedTokenStats = tokenStats ? {
            totalPromptTokens: Number(tokenStats.totalPromptTokens),
            totalCompletionTokens: Number(tokenStats.totalCompletionTokens),
            totalTokens: Number(tokenStats.totalTokens),
            rateLimitRpm: minRpm,
            rateLimitRpd: minRpd,
            rateLimitMaxTokens: minMaxTokens
        } : {
            totalPromptTokens: 0,
            totalCompletionTokens: 0,
            totalTokens: 0,
            rateLimitRpm: null,
            rateLimitRpd: null,
            rateLimitMaxTokens: null
        };

        return NextResponse.json({ 
            history,
            tokenStats: serializedTokenStats
        });
    } catch (err) {
        console.error('GET /api/api-keys/usage error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
