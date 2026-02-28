import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

const DEFAULT_FEATURES = [
    { feature: 'airdrops', label: 'Airdrops', message: 'The Airdrops section is currently under maintenance. Please check back soon.' },
    { feature: 'gmail-center', label: 'Gmail Center', message: 'Gmail Center is temporarily unavailable while we make improvements.' },
    { feature: 'mail-control', label: 'Mail Control', message: 'Mail Control is undergoing scheduled maintenance.' },
    { feature: 'drive-center', label: 'Drive Center', message: 'Drive Center is currently undergoing maintenance.' },
    { feature: 'chatbot', label: 'AI Chatbot', message: 'The AI Chatbot is currently receiving upgrades. Please check back later.' },
];

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
        // Seed defaults if not present
        for (const f of DEFAULT_FEATURES) {
            await prisma.maintenanceConfig.upsert({
                where: { feature: f.feature },
                update: {},
                create: { feature: f.feature, label: f.label, enabled: false, message: f.message },
            });
        }

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
        const { feature, label } = body;

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
