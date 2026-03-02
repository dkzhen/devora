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

// DELETE /api/apps/[id]/versions/[versionId] — delete a specific version
export async function DELETE(request, { params }) {
    try {
        // Must await params first
        const { id, versionId } = await params;
        await trackApiHit(request, `/api/apps/:id/versions/:versionId`);

        const user = await getAuthenticatedUser();
        if (!user || user.role !== 'ULTRA') {
            return NextResponse.json({ error: 'Requires ULTRA role' }, { status: 401 });
        }

        const version = await prisma.appVersion.findFirst({
            where: { id: versionId, appId: id }
        });

        if (!version) {
            return NextResponse.json({ error: 'Version not found' }, { status: 404 });
        }

        await prisma.appVersion.delete({ where: { id: versionId } });

        return NextResponse.json({ success: true, message: 'Version deleted successfully' });
    } catch (error) {
        console.error('Delete version error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
