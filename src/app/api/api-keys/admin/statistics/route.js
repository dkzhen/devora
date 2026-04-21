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

        // Get total requests
        const totalRequests = await prisma.apiKeyUsage.count();

        // Get current user's requests
        const myRequests = await prisma.apiKeyUsage.count({
            where: {
                apiKey: {
                    userId: auth.user.id
                }
            }
        });

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

        const userBreakdown = users.map(user => ({
            userId: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            keyCount: user.apiKeys.length,
            requestCount: user.apiKeys.reduce((sum, key) => sum + key._count.usages, 0)
        })).sort((a, b) => b.requestCount - a.requestCount);

        // Get current user's complete usage history
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
            }
        });

        return NextResponse.json({
            totalUsers,
            totalKeys,
            totalRequests,
            myRequests,
            userBreakdown,
            myHistory
        });
    } catch (err) {
        console.error('GET /api/api-keys/admin/statistics error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
