import { trackApiHit } from '@/lib/monitoring';
import prisma from '@/lib/db';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { encrypt, decrypt } from '@/lib/encryption';

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

// GET all config variables
export async function GET(request) {
    trackApiHit(request);
    try {
        const user = await getAuthenticatedUser();
        if (!user || user.role !== 'ULTRA') {
            return NextResponse.json({ error: 'Unauthorized. Only ULTRA users can access global configuration.' }, { status: 401 });
        }

        const configs = await prisma.globalConfig.findMany({
            orderBy: { createdAt: 'desc' }
        });

        const decryptedConfigs = configs.map(config => ({
            ...config,
            value: decrypt(config.value)
        }));

        return NextResponse.json({ success: true, configs: decryptedConfigs });
    } catch (error) {
        console.error('API Config GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
    }
}

// POST a new config variable
export async function POST(request) {
    trackApiHit(request);
    try {
        const user = await getAuthenticatedUser();
        if (!user || user.role !== 'ULTRA') {
            return NextResponse.json({ error: 'Unauthorized. Only ULTRA users can configure global variables.' }, { status: 401 });
        }

        const body = await request.json();
        const { key, value, description } = body;

        if (!key || !value) {
            return NextResponse.json({ error: 'Key and Value are required' }, { status: 400 });
        }

        // Check if key already exists
        const existing = await prisma.globalConfig.findUnique({ where: { key } });
        if (existing) {
            return NextResponse.json({ error: 'A configuration variable with this key already exists' }, { status: 400 });
        }

        const config = await prisma.globalConfig.create({
            data: { key, value: encrypt(value), description }
        });

        return NextResponse.json({ success: true, config });
    } catch (error) {
        console.error('API Config POST Error:', error);
        return NextResponse.json({ error: 'Failed to create config' }, { status: 500 });
    }
}
