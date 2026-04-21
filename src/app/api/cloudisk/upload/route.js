import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';
import { trackApiHit } from '@/lib/monitoring';
import { CLOUDISK_UPLOAD_ENDPOINT } from '@/constants/app-library.constants';

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

export const maxDuration = 60;

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
        
        const apkFile = formData.get('apkFile');
        const imageFileId = formData.get('imageFileId');

        if (!appName || !version || !apkFile) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Upload APK to Cloudisk
        const cloudiskFormData = new FormData();
        cloudiskFormData.append('file', apkFile);

        const apkUploadRes = await fetch(CLOUDISK_UPLOAD_ENDPOINT, {
            method: 'POST',
            body: cloudiskFormData
        });

        if (!apkUploadRes.ok) {
            const errorText = await apkUploadRes.text();
            return NextResponse.json({ 
                error: 'Failed to upload APK to Cloudisk: ' + errorText 
            }, { status: 500 });
        }

        const apkData = await apkUploadRes.json();
        const apkUrl = apkData.url; // URL dari Cloudisk
        const fileSize = apkFile.size ? BigInt(apkFile.size) : null;

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
                        apkUrl: apkUrl,
                        imageUrl: imageFileId || null,
                        fileSize: fileSize
                    }
                }
            },
            include: {
                versions: true
            }
        });

        return NextResponse.json({
            success: true,
            message: 'App uploaded to Cloudisk and saved successfully!',
            app: appRecord
        });

    } catch (error) {
        console.error('Cloudisk upload error:', error);
        return NextResponse.json({ 
            error: 'Internal server error: ' + error.message 
        }, { status: 500 });
    }
}
