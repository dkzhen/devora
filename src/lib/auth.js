import { jwtVerify } from 'jose';
import prisma from '@/lib/db';

export async function verifyAuth(request) {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
        return { success: false, error: 'Not authenticated' };
    }

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);

        const user = await prisma.user.findUnique({
            where: { id: payload.sub },
            select: {
                id: true,
                email: true,
                name: true,
                role: true
            }
        });

        if (!user) {
            return { success: false, error: 'User not found' };
        }

        return { success: true, user };
    } catch (error) {
        console.error('verifyAuth Error:', error);
        return { success: false, error: 'Invalid token' };
    }
}

export async function verifyApiKey(request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { success: false, error: 'Missing or invalid Authorization header' };
    }

    const key = authHeader.substring(7); // Remove 'Bearer '
    if (!key.startsWith('devora_')) {
        return { success: false, error: 'Invalid API Key format' };
    }

    try {
        const apiKey = await prisma.apiKey.findUnique({
            where: { key: key },
            include: { user: true }
        });

        if (!apiKey) {
            return { success: false, error: 'Invalid API Key' };
        }

        return { success: true, user: apiKey.user, apiKeyId: apiKey.id };
    } catch (error) {
        console.error('verifyApiKey Error:', error);
        return { success: false, error: 'Internal server error' };
    }
}

export function recordApiKeyUsage(apiKeyId, endpoint, method, status, tokens = null, model = null) {
    // Fire and forget - don't block the main request
    setImmediate(async () => {
        try {
            // Get the userId from the apiKey
            const apiKey = await prisma.apiKey.findUnique({
                where: { id: apiKeyId },
                select: { userId: true }
            });
            
            if (!apiKey) return;
            
            const data = {
                apiKeyId,
                endpoint,
                method,
                status
            };
            
            // Add model if provided
            if (model) {
                data.model = model;
            }
            
            // Add token data if provided
            if (tokens) {
                data.promptTokens = tokens.prompt || 0;
                data.completionTokens = tokens.completion || 0;
                data.totalTokens = tokens.total || 0;
            }
            
            // Create the usage record
            await prisma.apiKeyUsage.create({ data });
            
            // Update cumulative stats for the user
            await prisma.userApiStats.upsert({
                where: { userId: apiKey.userId },
                create: {
                    userId: apiKey.userId,
                    totalRequests: 1
                },
                update: {
                    totalRequests: { increment: 1 }
                }
            });
            
            // Enforce 50-record limit per user - delete oldest records if over limit
            const userUsageCount = await prisma.apiKeyUsage.count({
                where: {
                    apiKey: {
                        userId: apiKey.userId
                    }
                }
            });
            
            if (userUsageCount > 50) {
                // Get the oldest records to delete
                const recordsToDelete = await prisma.apiKeyUsage.findMany({
                    where: {
                        apiKey: {
                            userId: apiKey.userId
                        }
                    },
                    orderBy: {
                        createdAt: 'asc'
                    },
                    take: userUsageCount - 50,
                    select: { id: true }
                });
                
                // Delete the oldest records
                await prisma.apiKeyUsage.deleteMany({
                    where: {
                        id: {
                            in: recordsToDelete.map(r => r.id)
                        }
                    }
                });
            }
        } catch (err) {
            // Silently fail - don't spam logs
            // Usage tracking is non-critical
        }
    });
}
