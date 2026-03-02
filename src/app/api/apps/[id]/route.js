import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';
import { trackApiHit } from '@/lib/monitoring';

async function getAuthenticatedUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;
    try {
        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secretKey);
        const userId = payload.sub || payload.id;
        return await prisma.user.findUnique({ where: { id: userId } });
    } catch (e) {
        return null;
    }
}

// DELETE /api/apps/[id] — delete the entire app + all its versions
export async function DELETE(request, { params }) {
    try {
        // Must await params first
        const { id } = await params;
        await trackApiHit(request, `/api/apps/:id`);

        const user = await getAuthenticatedUser();
        if (!user || user.role !== 'ULTRA') {
            return NextResponse.json({ error: 'Requires ULTRA role' }, { status: 401 });
        }

        const app = await prisma.app.findUnique({ where: { id } });
        if (!app) {
            return NextResponse.json({ error: 'App not found' }, { status: 404 });
        }

        // Cascade delete (AppVersion rows deleted due to onDelete: Cascade)
        await prisma.app.delete({ where: { id } });

        return NextResponse.json({ success: true, message: 'App deleted successfully' });
    } catch (error) {
        console.error('Delete app error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
