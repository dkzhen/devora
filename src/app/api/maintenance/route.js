import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

async function getUser(request) {
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

// GET - Fetch all maintenance configs (public)
export async function GET() {
    try {
        const configs = await prisma.maintenanceConfig.findMany({
            orderBy: { feature: 'asc' },
        });
        return NextResponse.json(configs);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch maintenance configs' }, { status: 500 });
    }
}

// POST - Create a new maintenance config (ULTRA only)
export async function POST(request) {
    try {
        const user = await getUser(request);
        if (!user || user.role !== 'ULTRA') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { feature, label, icon, color } = body;

        if (!feature || !label) {
            return NextResponse.json({ error: 'Feature ID and Label are required' }, { status: 400 });
        }

        // Auto-generate template message
        const message = `The ${label} section is currently under maintenance. Please check back soon.`;

        const newConfig = await prisma.maintenanceConfig.create({
            data: {
                feature: feature.toLowerCase().replace(/\s+/g, '-'), // Ensure it's a valid slug
                label,
                enabled: false,
                message,
                icon: icon || '/icons/menu.png',
                color: color || 'slate',
            },
        });

        return NextResponse.json(newConfig, { status: 201 });
    } catch (error) {
        console.error('Failed to create maintenance config:', error);

        // Handle unique constraint violation
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'A feature with this ID already exists' }, { status: 409 });
        }

        return NextResponse.json({ error: 'Failed to create maintenance config' }, { status: 500 });
    }
}
