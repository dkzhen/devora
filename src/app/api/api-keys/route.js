import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import prisma from '@/lib/db';
import { randomBytes } from 'crypto';
import { trackApiHit } from '@/lib/monitoring';

export async function GET(request) {
    trackApiHit(request);
    try {
        const auth = await verifyAuth(request);
        if (!auth.success) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const apiKeys = await prisma.apiKey.findMany({
            where: { userId: auth.user.id },
            orderBy: { createdAt: 'desc' },
            select: { id: true, name: true, key: true, createdAt: true, updatedAt: true },
        });

        return NextResponse.json({ apiKeys });
    } catch (err) {
        console.error('GET /api/api-keys error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    trackApiHit(request);
    try {
        const auth = await verifyAuth(request);
        if (!auth.success) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { name } = await request.json();
        if (!name || !name.trim()) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        // Generate: devora_ + 32 random hex chars
        const rawKey = randomBytes(20).toString('hex');
        const apiKey = `devora_${rawKey}`;

        const created = await prisma.apiKey.create({
            data: {
                userId: auth.user.id,
                name: name.trim(),
                key: apiKey,
            },
        });

        return NextResponse.json({ apiKey: created }, { status: 201 });
    } catch (err) {
        console.error('POST /api/api-keys error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
