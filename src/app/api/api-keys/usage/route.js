import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import prisma from '@/lib/db';
import { trackApiHit } from '@/lib/monitoring';

export async function GET(request) {
    trackApiHit(request);
    try {
        const auth = await verifyAuth(request);
        if (!auth.success) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const history = await prisma.apiKeyUsage.findMany({
            where: {
                apiKey: { userId: auth.user.id }
            },
            include: {
                apiKey: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 50 // Limit to recent 50 hits
        });

        return NextResponse.json({ history });
    } catch (err) {
        console.error('GET /api/api-keys/usage error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
