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

        // Get total requests and tokens
        const totalRequests = await prisma.apiKeyUsage.count();
        
        let totalTokenStats = { _sum: { promptTokens: 0, completionTokens: 0, totalTokens: 0 } };
        let myTokenStats = { _sum: { promptTokens: 0, completionTokens: 0, totalTokens: 0 } };
        
        try {
            totalTokenStats = await prisma.apiKeyUsage.aggregate({
                _sum: {
                    promptTokens: true,
                    completionTokens: true,
                    totalTokens: true
                }
            });
        } catch (tokenError) {
            console.warn('Token fields not available yet:', tokenError.message);
        }

        // Get current user's requests and tokens
        const myRequests = await prisma.apiKeyUsage.count({
            where: {
                apiKey: {
                    userId: auth.user.id
                }
            }
        });
        
        try {
            myTokenStats = await prisma.apiKeyUsage.aggregate({
                where: {
                    apiKey: {
                        userId: auth.user.id
                    }
                },
                _sum: {
                    promptTokens: true,
                    completionTokens: true,
                    totalTokens: true
                }
            });
        } catch (tokenError) {
            console.warn('Token fields not available for user:', tokenError.message);
        }

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

        // Get token stats for each user
        const userTokenStats = await Promise.all(users.map(async (user) => {
            let tokens = { _sum: { promptTokens: 0, completionTokens: 0, totalTokens: 0 } };
            
            try {
                tokens = await prisma.apiKeyUsage.aggregate({
                    where: {
                        apiKey: {
                            userId: user.id
                        }
                    },
                    _sum: {
                        promptTokens: true,
                        completionTokens: true,
                        totalTokens: true
                    }
                });
            } catch (tokenError) {
                // Token fields not available, use defaults
            }
            
            return {
                userId: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                keyCount: user.apiKeys.length,
                requestCount: user.apiKeys.reduce((sum, key) => sum + key._count.usages, 0),
                totalTokens: tokens._sum.totalTokens || 0,
                promptTokens: tokens._sum.promptTokens || 0,
                completionTokens: tokens._sum.completionTokens || 0
            };
        }));
        
        const userBreakdown = userTokenStats.sort((a, b) => b.requestCount - a.requestCount);

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
            totalTokens: totalTokenStats._sum.totalTokens || 0,
            totalPromptTokens: totalTokenStats._sum.promptTokens || 0,
            totalCompletionTokens: totalTokenStats._sum.completionTokens || 0,
            myTokens: myTokenStats._sum.totalTokens || 0,
            myPromptTokens: myTokenStats._sum.promptTokens || 0,
            myCompletionTokens: myTokenStats._sum.completionTokens || 0,
            userBreakdown,
            myHistory
        });
    } catch (err) {
        console.error('GET /api/api-keys/admin/statistics error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
