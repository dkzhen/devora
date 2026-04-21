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

        // --- NEW REAL DB DATA FOR DASHBOARD REFINEMENTS --- //

        const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899'];

        // Fetch Top 5 Airdrops by Task Count (Only Public Projects)
        const topAirdropsRaw = await prisma.airdrop.findMany({
            where: { isPublic: true },
            include: {
                _count: { select: { tasks: true } }
            },
            orderBy: { tasks: { _count: 'desc' } },
            take: 5
        });

        // Fetch Total Airdrops Count (All projects, private or public)
        const totalAirdrops = await prisma.airdrop.count();

        const topAirdrops = topAirdropsRaw.map((a, idx) => ({
            name: a.name,
            tasks: a._count.tasks,
            color: COLORS[idx % COLORS.length]
        }));

        // Fetch Total AI Token Usage across all GroqCredential records
        const groqStats = await prisma.groqCredential.aggregate({
            _sum: {
                promptTokens: true,
                completionTokens: true
            }
        });
        const promptTokens = groqStats._sum.promptTokens || 0;
        const completionTokens = groqStats._sum.completionTokens || 0;

        const tokenUsage = [
            { name: 'Prompt', value: promptTokens, color: '#3B82F6' },
            { name: 'Completion', value: completionTokens, color: '#8B5CF6' }
        ];

        // Fetch Total Gmail Messages and Threads
        const accountStats = await prisma.account.aggregate({
            _sum: {
                totalMessages: true,
                totalThreads: true
            }
        });

        const gmailActivity = [
            { name: 'Messages', value: accountStats._sum.totalMessages || 0, color: '#10B981' }, // Green
            { name: 'Threads', value: accountStats._sum.totalThreads || 0, color: '#3B82F6' } // Blue
        ];

        // Fetch Drive Insights Data
        const driveFiles = await prisma.driveFile.findMany({
            select: { size: true, mimeType: true, accountId: true }
        });

        let totalStorageBytes = 0;
        const driveAccountIds = new Set();
        const fileTypesMap = { Images: 0, Documents: 0, Videos: 0, Folders: 0, Other: 0 };
        const filesPerAccountMap = {};

        driveFiles.forEach(file => {
            driveAccountIds.add(file.accountId);
            if (file.size) totalStorageBytes += parseInt(file.size, 10) || 0;

            const mime = file.mimeType.toLowerCase();
            if (mime.includes('image/')) fileTypesMap.Images++;
            else if (mime.includes('video/')) fileTypesMap.Videos++;
            else if (mime.includes('pdf') || mime.includes('document') || mime.includes('text/') || mime.includes('sheet') || mime.includes('presentation')) fileTypesMap.Documents++;
            else if (mime.includes('folder')) fileTypesMap.Folders++;
            else fileTypesMap.Other++;

            if (!filesPerAccountMap[file.accountId]) filesPerAccountMap[file.accountId] = 0;
            filesPerAccountMap[file.accountId]++;
        });

        const formatBytes = (bytes) => {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
        };

        const maskName = (name) => {
            if (!name) return 'Unknown';
            if (name.length <= 3) return name;
            return name[0] + '...' + name[name.length - 1];
        };

        const driveInsights = {
            summary: {
                totalStorage: formatBytes(totalStorageBytes),
                totalFiles: driveFiles.length,
                connectedAccounts: driveAccountIds.size
            },
            fileTypes: [
                { name: 'Images', value: fileTypesMap.Images, color: '#F59E0B' },
                { name: 'Documents', value: fileTypesMap.Documents, color: '#3B82F6' },
                { name: 'Videos', value: fileTypesMap.Videos, color: '#EC4899' },
                { name: 'Folders', value: fileTypesMap.Folders, color: '#10B981' },
                { name: 'Other', value: fileTypesMap.Other, color: '#6B7280' }
            ].filter(t => t.value > 0),
            filesPerAccount: Object.entries(filesPerAccountMap).map(([account, count], index) => {
                const username = account.split('@')[0];
                return {
                    name: maskName(username),
                    value: count,
                    color: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EC4899'][index % 5]
                };
            }).sort((a, b) => b.value - a.value).slice(0, 5)
        };

        // Fetch Temp Mail Stats - Count directly from database for accuracy
        const totalEmailsGenerated = await prisma.tempMailAccount.count();
        
        // Count messages received from actual DB records (all providers)
        const messagesReceived = await prisma.tempMailMessage.count();

        // Fetch recent temp mail accounts (last 10)
        const recentTempMailAccounts = await prisma.tempMailAccount.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
                id: true,
                address: true,
                createdAt: true
            }
        });

        // Count active temp mail accounts (created in last 7 days)
        const sevenDaysAgo = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000);
        const activeTempMailAccounts = await prisma.tempMailAccount.count({
            where: {
                createdAt: {
                    gte: sevenDaysAgo
                }
            }
        });

        const tempMailStats = {
            emailsGenerated: totalEmailsGenerated, // Count from actual DB records
            messagesReceived: messagesReceived,
            activeAccounts: activeTempMailAccounts,
            recentEmails: recentTempMailAccounts
        };

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
            apiStats: endpointStats, // True API Endpoint hits
            topAirdrops,
            totalAirdrops,
            tokenUsage,
            gmailActivity,
            driveInsights,
            tempMailStats
        });
    } catch (error) {
        console.error('Error fetching internal stats:', error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
