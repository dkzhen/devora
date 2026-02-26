import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
    try {
        // Fetch counts from DB
        const totalAccounts = await prisma.account.count();
        const activeAccounts = await prisma.account.count({ where: { status: 'active' } });
        const totalMessages = await prisma.message.count();

        // Fetch API Endpoint Stats
        const endpointStats = await prisma.apiEndpointStats.findMany({
            orderBy: { hitCount: 'desc' }
        });

        // Group messages by account for "Requests by API" chart (repurposed as Messages by Account)
        const messagesByAccount = await prisma.message.groupBy({
            by: ['accountId'],
            _count: {
                id: true
            }
        });

        // Format for Recharts
        const formattedMessagesByAccount = messagesByAccount.map(item => ({
            name: item.accountId.split('@')[0], // Display username only
            value: item._count.id,
            color: '#34A853' // Green
        }));

        // Mock time data for "Traffic" line chart (since we don't track historical message arrival time in a way that maps to API requests easily without complex query)
        // We will just show a flat or simulated line for now, or maybe "Messages Received Over Time" if we use receivedAt

        // Let's try to get messages received in last 24h for line chart
        const oneDayAgo = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
        const recentMessages = await prisma.message.findMany({
            where: {
                receivedAt: {
                    gte: oneDayAgo
                }
            },
            select: {
                receivedAt: true
            }
        });

        // Bucket by hour
        const hourlyCounts = {};
        for (let i = 0; i < 24; i++) {
            const d = new Date();
            d.setHours(d.getHours() - i);
            const key = d.getHours() + ':00';
            hourlyCounts[key] = 0;
        }

        recentMessages.forEach(msg => {
            const h = new Date(msg.receivedAt).getHours() + ':00';
            if (hourlyCounts[h] !== undefined) hourlyCounts[h]++;
        });

        const totalRequestsData = Object.keys(hourlyCounts).reverse().map(time => ({
            time,
            requests: hourlyCounts[time]
        }));

        return NextResponse.json({
            totalRequests: totalRequestsData, // Repurposed as "Messages Over Time"
            requestsByApi: formattedMessagesByAccount, // Repurposed as "Messages by Account"
            requestsByStatus: [
                { name: 'Active Accounts', value: activeAccounts, color: '#34A853' },
                { name: 'Inactive Accounts', value: totalAccounts - activeAccounts, color: '#EA4335' }
            ],
            summary: {
                totalAccounts,
                totalMessages
            },
            apiStats: endpointStats // True API Endpoint hits
        });
    } catch (error) {
        console.error('Error fetching internal stats:', error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
