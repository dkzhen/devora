import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/encryption';
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

// Next.js App Router specific configuration to allow large file uploads
export const maxDuration = 60; // Max timeout for Vercel/similar hostings

export async function POST(req) {
    try {
        await trackApiHit(req);
        const user = await getAuthenticatedUser();
        if (!user || user.role !== 'ULTRA') {
            return NextResponse.json({ error: 'Requires ULTRA role' }, { status: 401 });
        }

        const formData = await req.formData();
        const appId = formData.get('appId');
        const appName = formData.get('appName'); // for caption
        const version = formData.get('version');
        const features = formData.get('features');
        const androidVersion = formData.get('androidVersion') || '';
        const apkFileId = formData.get('apkFileId');

        if (!appId || !version || !apkFileId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if app exists
        const existingApp = await prisma.app.findUnique({
            where: { id: appId },
            include: { versions: { orderBy: { releaseDate: 'desc' }, take: 1 } }
        });

        if (!existingApp) {
            return NextResponse.json({ error: 'App not found' }, { status: 404 });
        }

        // Retrieve the latest version's imageUrl to inherit if any
        let existingImageUrl = null;
        if (existingApp.versions && existingApp.versions.length > 0) {
            existingImageUrl = existingApp.versions[0].imageUrl;
        }

        // Save to Database
        const newVersionRecord = await prisma.appVersion.create({
            data: {
                appId: appId,
                version: version,
                androidVersion: androidVersion || null,
                apkUrl: apkFileId,
                imageUrl: existingImageUrl,
                features: features || null
            }
        });

        // Update the app's updatedAt stamp
        await prisma.app.update({
            where: { id: appId },
            data: { updatedAt: new Date() }
        });

        return NextResponse.json({
            success: true,
            message: 'Version added successfully!',
            version: newVersionRecord
        });

    } catch (error) {
        console.error('Add version upload handler error details:', error);
        return NextResponse.json({ error: 'Internal server error processing upload: ' + error.message }, { status: 500 });
    }
}
