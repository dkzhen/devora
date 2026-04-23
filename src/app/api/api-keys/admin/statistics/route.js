import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import prisma from '@/lib/db';
import { trackApiHit } from '@/lib/monitoring';

export async function GET(request) {
    trackApiHit(request);
    try {
        const auth = await verifyAuth(request);
        if (!auth.success) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Only ULTRA users can access this endpoint
        if (auth.user.role !== 'ULTRA') {
            return NextResponse.json({ error: 'Forbidden - ULTRA role required' }, { status: 403 });
        }

        // Get total users with API keys
        const totalUsers = await prisma.user.count({
            where: {
                apiKeys: {
                    some: {}
                }
            }
        });

        // Get total API keys
        const totalKeys = await prisma.apiKey.count();

        // Get total requests from cumulative stats
        const totalStatsAgg = await prisma.userApiStats.aggregate({
            _sum: {
                totalRequests: true
            }
        });
        const totalRequests = totalStatsAgg._sum.totalRequests || 0;

        // Get current user's complete usage history (limited to 50 records) for stats calculation
        const recentUsage = await prisma.apiKeyUsage.findMany({
            where: {
                apiKey: {
                    userId: auth.user.id
                }
            },
            select: {
                status: true
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 50
        });

        // Calculate success and failed from snapshot
        const totalSuccess = recentUsage.filter(u => u.status >= 200 && u.status < 400).length;
        const totalFailed = recentUsage.filter(u => u.status >= 400).length;

        // Get usage breakdown by user
        const users = await prisma.user.findMany({
            where: {
                apiKeys: {
                    some: {}
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                apiKeys: {
                    select: {
                        id: true,
                        _count: {
                            select: {
                                usages: true
                            }
                        }
                    }
                }
            }
        });

        // Get cumulative stats for each user
        const userStatsMap = await prisma.userApiStats.findMany({
            where: {
                userId: {
                    in: users.map(u => u.id)
                }
            }
        });
        
        const statsLookup = Object.fromEntries(
            userStatsMap.map(s => [s.userId, s.totalRequests])
        );
        
        const userTokenStats = users.map(user => ({
            userId: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            keyCount: user.apiKeys.length,
            requestCount: statsLookup[user.id] || 0
        }));
        
        const userBreakdown = userTokenStats.sort((a, b) => b.requestCount - a.requestCount);

        // Get current user's complete usage history (limited to 50 records)
        const myHistory = await prisma.apiKeyUsage.findMany({
            where: {
                apiKey: {
                    userId: auth.user.id
                }
            },
            include: {
                apiKey: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 50
        });

        return NextResponse.json({
            totalUsers,
            totalKeys,
            totalRequests,
            totalSuccess,
            totalFailed,
            userBreakdown,
            myHistory
        });
    } catch (err) {
        console.error('GET /api/api-keys/admin/statistics error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
