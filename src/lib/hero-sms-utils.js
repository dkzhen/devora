import { jwtVerify } from 'jose';
import prisma from '@/lib/db';
import { decrypt } from '@/lib/encryption';

export async function getHeroApiKey(request) {
    // 1. Try to get from header first (legacy/manual)
    const headerKey = request.headers.get('x-api-key');
    if (headerKey) return headerKey;

    // 2. Try to get from database for authenticated user
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return null;

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        
        const user = await prisma.user.findUnique({
            where: { id: payload.sub },
            select: { heroSmsApiKey: true }
        });

        if (user?.heroSmsApiKey) {
            return decrypt(user.heroSmsApiKey);
        }
    } catch (err) {
        console.error('getHeroApiKey Error:', err);
    }

    return null;
}
