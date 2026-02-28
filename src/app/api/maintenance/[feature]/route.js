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
    const { enabled, message, newFeature, label } = body;

    try {
        const updateData = {
            ...(typeof enabled === 'boolean' && { enabled }),
            ...(message !== undefined && { message }),
            ...(label !== undefined && { label }),
        };

        // If the slug is changing, update the primary feature key
        if (newFeature && newFeature !== feature) {
            updateData.feature = newFeature.toLowerCase().replace(/[^a-z0-9-]/g, '');
        }

        const config = await prisma.maintenanceConfig.update({
            where: { feature },
            data: updateData,
        });
        return NextResponse.json(config);
    } catch (error) {
        console.error(error);
        if (error.code === 'P2002' || error.code === 'P2025') {
            return NextResponse.json({ error: 'A feature with this ID already exists or original not found' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Failed to update maintenance config' }, { status: 500 });
    }
}

// DELETE - Remove a maintenance config (ULTRA only)
export async function DELETE(request, { params }) {
    const user = await getUser();
    if (!user || user.role !== 'ULTRA') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { feature } = await params;

    try {
        await prisma.maintenanceConfig.delete({
            where: { feature },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to delete maintenance config' }, { status: 500 });
    }
}
