import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

async function getUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return await prisma.user.findUnique({ where: { id: payload.sub } });
    } catch {
        return null;
    }
}

// PUT - Toggle maintenance for a feature (ULTRA only)
export async function PUT(request, { params }) {
    const user = await getUser();
    if (!user || user.role !== 'ULTRA') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { feature } = await params;
    const body = await request.json();
    const { enabled, message } = body;

    try {
        const config = await prisma.maintenanceConfig.update({
            where: { feature },
            data: {
                ...(typeof enabled === 'boolean' && { enabled }),
                ...(message !== undefined && { message }),
            },
        });
        return NextResponse.json(config);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to update maintenance config' }, { status: 500 });
    }
}
