import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

const DEFAULT_FEATURES = [
    { feature: 'settings', label: 'Account Settings', message: 'Account Settings is currently undergoing maintenance.' },
    { feature: 'airdrops', label: 'Airdrops', message: 'The Airdrops section is currently under maintenance. Please check back soon.' },
    { feature: 'gmail-center', label: 'Gmail Center', message: 'Gmail Center is temporarily unavailable while we make improvements.' },
    { feature: 'mail-control', label: 'Mail Control', message: 'Mail Control is undergoing scheduled maintenance.' },
    { feature: 'endpoints', label: 'API Endpoints', message: 'The API Endpoints dashboard is currently under maintenance.' },
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
