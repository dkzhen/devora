import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import prisma from '@/lib/db';
import { trackApiHit } from '@/lib/monitoring';

export async function DELETE(request, { params }) {
    trackApiHit(request);
    try {
        const auth = await verifyAuth(request);
        if (!auth.success) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;

        // Ensure the key belongs to the requesting user
        const existing = await prisma.apiKey.findFirst({ where: { id, userId: auth.user.id } });
        if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        await prisma.apiKey.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('DELETE /api/api-keys/[id] error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
