import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import fs from 'fs';
import path from 'path';

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

function checkPageExists(featurePath) {
    const basePath = path.join(process.cwd(), 'src/app/(main)');
    const possiblePaths = [
        path.join(basePath, featurePath, 'page.js'),
        path.join(basePath, featurePath, 'page.jsx'),
        path.join(basePath, featurePath, 'page.ts'),
        path.join(basePath, featurePath, 'page.tsx'),
    ];

    return possiblePaths.some(p => fs.existsSync(p));
}

// POST - Sync all maintenance configs with actual pages (ULTRA only)
export async function POST(request) {
    const user = await getUser();
    if (!user || user.role !== 'ULTRA') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const configs = await prisma.maintenanceConfig.findMany();
        const results = [];

        for (const config of configs) {
            const exists = checkPageExists(config.feature);
            results.push({
                feature: config.feature,
                label: config.label,
                exists,
                path: `/src/app/(main)/${config.feature}/page.js`
            });
        }

        const missingCount = results.filter(r => !r.exists).length;
        const existingCount = results.filter(r => r.exists).length;

        return NextResponse.json({
            success: true,
            total: results.length,
            existing: existingCount,
            missing: missingCount,
            results
        });
    } catch (error) {
        console.error('Sync error:', error);
        return NextResponse.json({ error: 'Failed to sync configs' }, { status: 500 });
    }
}
