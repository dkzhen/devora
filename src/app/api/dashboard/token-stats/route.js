import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import prisma from '@/lib/db';
import { trackApiHit } from '@/lib/monitoring';

export async function GET(request) {
    trackApiHit(request);
    try {
        const auth = await verifyAuth(request);
        if (!auth.success) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get global token stats (all users)
        const globalStats = await prisma.apiKeyUsage.aggregate({
            _sum: {
                promptTokens: true,
                completionTokens: true,
                totalTokens: true
            }
        });

        // Get total requests count
        const totalRequests = await prisma.apiKeyUsage.count();

        // Get requests per model (group by model field)
        const modelUsageRaw = await prisma.apiKeyUsage.groupBy({
            by: ['model'],
            where: {
                endpoint: '/api/v1/ai/chat/completions',
                model: {
                    not: null
                }
            },
            _count: {
                id: true
            },
            _sum: {
                totalTokens: true
            },
            orderBy: {
                _count: {
                    id: 'desc'
                }
            },
            take: 10
        });

        // Format model breakdown for chart
        const modelBreakdown = modelUsageRaw.map(item => ({
            model: item.model,
            requests: item._count.id,
            tokens: item._sum.totalTokens || 0
        }));

        return NextResponse.json({
            totalTokens: globalStats._sum.totalTokens || 0,
            promptTokens: globalStats._sum.promptTokens || 0,
            completionTokens: globalStats._sum.completionTokens || 0,
            totalRequests: totalRequests,
            modelBreakdown: modelBreakdown
        });
    } catch (err) {
        console.error('GET /api/dashboard/token-stats error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
