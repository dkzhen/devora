import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Fetch Airdrops Tasks (total)
        const airdropCount = await prisma.airdrop.count();

        // Fetch Gmail Accounts and sum up messages and threads
        const accountAggregations = await prisma.account.aggregate({
            _count: {
                email: true
            },
            _sum: {
                totalMessages: true,
                totalThreads: true
            }
        });

        const gmailAccounts = accountAggregations._count.email || 0;
        const totalMessages = accountAggregations._sum.totalMessages || 0;
        const totalThreads = accountAggregations._sum.totalThreads || 0;

        // Fetch API Calls (Endpoints hits sum)
        const endpointAggregations = await prisma.apiEndpointStats.aggregate({
            _sum: {
                hitCount: true,
            },
        });
        const totalApiHits = endpointAggregations._sum.hitCount || 0;

        return NextResponse.json({
            success: true,
            stats: {
                airdrops: airdropCount,
                gmails: gmailAccounts,
                messages: totalMessages,
                threads: totalThreads,
                apiHits: totalApiHits
            }
        }, { status: 200 });
    } catch (error) {
        console.error('Error fetching public stats:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
