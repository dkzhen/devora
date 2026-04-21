import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { trackApiHit } from '@/lib/monitoring';

export async function GET(req) {
    try {
        await trackApiHit(req);
        const apps = await prisma.app.findMany({
            include: {
                versions: {
                    orderBy: { releaseDate: 'desc' },
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const formattedApps = apps.map(app => ({
            id: app.id,
            name: app.name,
            developer: app.developer,
            category: app.category,
            description: app.description,
            iconStatic: app.iconStatic,
            downloadCount: app.downloadCount,
            viewCount: app.viewCount,
            versions: app.versions.map(v => ({
                id: v.id,
                version: v.version,
                androidVersion: v.androidVersion,
                releaseDate: v.releaseDate,
                features: v.features,
                apkUrl: v.apkUrl,
                imageUrl: v.imageUrl,
                fileSize: v.fileSize ? v.fileSize.toString() : null
            }))
        }));

        return NextResponse.json({ success: true, apps: formattedApps });
    } catch (error) {
        console.error('Error fetching apps:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
