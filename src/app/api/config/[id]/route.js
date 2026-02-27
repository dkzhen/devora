import { trackApiHit } from '@/lib/monitoring';
import prisma from '@/lib/db';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { encrypt } from '@/lib/encryption';

async function getAuthenticatedUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return null;

    try {
        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secretKey);
        return await prisma.user.findUnique({ where: { id: payload.sub } });
    } catch (e) {
        return null;
    }
}

// PUT (update) an existing config
export async function PUT(request, context) {
    trackApiHit(request);
    try {
        const { id } = await context.params;
        const user = await getAuthenticatedUser();
        if (!user || user.role !== 'ULTRA') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { key, value, description } = body;

        if (!key || !value) {
            return NextResponse.json({ error: 'Key and Value are required' }, { status: 400 });
        }

        // Make sure changing key doesn't clash with existing
        const existing = await prisma.globalConfig.findFirst({
            where: { key, NOT: { id } }
        });
        if (existing) {
            return NextResponse.json({ error: 'Another configuration variable with this key already exists' }, { status: 400 });
        }

        const config = await prisma.globalConfig.update({
            where: { id },
            data: { key, value: encrypt(value), description }
        });

        return NextResponse.json({ success: true, config });
    } catch (error) {
        console.error('API Config PUT Error:', error);
        return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
    }
}

// DELETE a config
export async function DELETE(request, context) {
    trackApiHit(request);
    try {
        const { id } = await context.params;
        const user = await getAuthenticatedUser();
        if (!user || user.role !== 'ULTRA') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await prisma.globalConfig.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('API Config DELETE Error:', error);
        return NextResponse.json({ error: 'Failed to delete config' }, { status: 500 });
    }
}
