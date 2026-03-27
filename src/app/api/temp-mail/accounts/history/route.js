import { NextResponse } from 'next/server';
import { trackApiHit } from '@/lib/monitoring';
import { jwtVerify } from 'jose';
import prisma from '@/lib/db';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    trackApiHit(req);
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        try {
            const secret = new TextEncoder().encode(process.env.JWT_SECRET);
            const { payload } = await jwtVerify(token, secret);
            const userId = payload.sub;

            const history = await prisma.tempMailAccount.findMany({
                where: { userId: userId },
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    address: true,
                    password: true,
                    createdAt: true
                }
            });

            return NextResponse.json(history);
        } catch (e) {
            console.error("JWT verification failed in history API", e);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    } catch (error) {
        console.error('History API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}
