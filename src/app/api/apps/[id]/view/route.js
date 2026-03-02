import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { trackApiHit } from '@/lib/monitoring';

// POST /api/apps/[id]/view — increment viewCount
export async function POST(request, { params }) {
    try {
        const { id } = await params;
        await trackApiHit(request, `/api/apps/:id/view`);
        await prisma.app.update({
            where: { id },
            data: { viewCount: { increment: 1 } }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('View count error:', error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
