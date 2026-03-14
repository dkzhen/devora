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
        // Usually payload.sub is the user ID
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
        const appName = formData.get('appName');
        const version = formData.get('version');
        const description = formData.get('description');
        const category = formData.get('category') || 'Utility';
        const developer = formData.get('developer') || '';
        const androidVersion = formData.get('androidVersion') || '';

        const apkFileId = formData.get('apkFileId');
        const imageFileId = formData.get('imageFileId');

        if (!appName || !version || !apkFileId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Save to Database
        const appRecord = await prisma.app.create({
            data: {
                name: appName,
                developer: developer || null,
                category: category,
                description: description || '',
                iconStatic: imageFileId || null,
                versions: {
                    create: {
                        version: version,
                        androidVersion: androidVersion || null,
                        apkUrl: apkFileId,
                        imageUrl: imageFileId || null
                    }
                }
            },
            include: {
                versions: true
            }
        });

        return NextResponse.json({
            success: true,
            message: 'App uploaded and saved successfully!',
            app: appRecord
        });

    } catch (error) {
        console.error('Upload handler error details:', error);
        return NextResponse.json({ error: 'Internal server error processing upload: ' + error.message }, { status: 500 });
    }
}
