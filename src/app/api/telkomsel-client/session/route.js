/**
 * GET  /api/telkomsel-client/session — Returns session status
 * DELETE /api/telkomsel-client/session — Clears session
 */

import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import prisma from '@/lib/db';
import { trackApiHit } from '@/lib/monitoring';

async function getUserId(request) {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return null;
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return payload.sub;
    } catch { return null; }
}

export async function GET(request) {
    trackApiHit(request);
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = await prisma.telSession.findUnique({
        where: { userId },
        select: { phone: true, createdAt: true, updatedAt: true },
    });

    if (!session) {
        return NextResponse.json({ session: null });
    }

    return NextResponse.json({
        session: {
            phone: session.phone,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
        },
    });
}

export async function DELETE(request) {
    trackApiHit(request);
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await prisma.telSession.deleteMany({ where: { userId } });
    return NextResponse.json({ success: true });
}
