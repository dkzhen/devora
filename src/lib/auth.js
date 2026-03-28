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

export async function recordApiKeyUsage(apiKeyId, endpoint, method, status) {
    try {
        await prisma.apiKeyUsage.create({
            data: {
                apiKeyId,
                endpoint,
                method,
                status
            }
        });
    } catch (err) {
        console.error('Failed to record API Key usage:', err);
    }
}
