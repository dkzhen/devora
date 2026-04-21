import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
    try {
        // Get all apps with their versions
        const apps = await prisma.app.findMany({
            include: {
                versions: true
            }
        });

        // Calculate statistics
        const totalApps = apps.length;
        const totalVersions = apps.reduce((sum, app) => sum + app.versions.length, 0);
        const totalDownloads = apps.reduce((sum, app) => sum + (app.downloadCount || 0), 0);
        const totalViews = apps.reduce((sum, app) => sum + (app.viewCount || 0), 0);

        // Calculate engagement rate (downloads / views * 100)
        const engagementRate = totalViews > 0 ? ((totalDownloads / totalViews) * 100).toFixed(1) : 0;

        // Calculate average downloads per version
        const avgDownloadsPerVersion = totalVersions > 0 ? (totalDownloads / totalVersions).toFixed(1) : 0;

        // Calculate total storage used
        const totalStorage = apps.reduce((sum, app) => {
            const appStorage = app.versions.reduce((vSum, version) => {
                return vSum + (version.fileSize ? Number(version.fileSize) : 0);
            }, 0);
            return sum + appStorage;
        }, 0);

        // Get most popular apps (by downloads)
        const mostPopular = apps
            .map(app => ({
                id: app.id,
                name: app.name,
                downloads: app.downloadCount || 0,
                views: app.viewCount || 0,
                versions: app.versions.length,
                // Popularity score: weighted combination of downloads and views
                popularityScore: ((app.downloadCount || 0) * 2) + (app.viewCount || 0)
            }))
            .sort((a, b) => b.popularityScore - a.popularityScore)
            .slice(0, 5);

        // Get most updated apps (by version count)
        const mostUpdated = apps
            .map(app => ({
                id: app.id,
                name: app.name,
                versionCount: app.versions.length,
                downloads: app.downloadCount || 0
            }))
            .sort((a, b) => b.versionCount - a.versionCount)
            .slice(0, 5);

        // Storage breakdown by method (Telegram vs Cloudisk)
        let telegramStorage = 0;
        let cloudiskStorage = 0;

        apps.forEach(app => {
            app.versions.forEach(version => {
                const size = version.fileSize ? Number(version.fileSize) : 0;
                // Check if URL is from Cloudisk (contains http/https) or Telegram (file ID)
                if (version.apkUrl && version.apkUrl.startsWith('http')) {
                    cloudiskStorage += size;
                } else {
                    telegramStorage += size;
                }
            });
        });

        return NextResponse.json({
            success: true,
            statistics: {
                overview: {
                    totalApps,
                    totalVersions,
                    totalDownloads,
                    totalViews,
                    engagementRate: parseFloat(engagementRate),
                    avgDownloadsPerVersion: parseFloat(avgDownloadsPerVersion)
                },
                storage: {
                    total: totalStorage,
                    telegram: telegramStorage,
                    cloudisk: cloudiskStorage,
                    formatted: {
                        total: formatBytes(totalStorage),
                        telegram: formatBytes(telegramStorage),
                        cloudisk: formatBytes(cloudiskStorage)
                    }
                },
                topApps: {
                    mostPopular,
                    mostUpdated
                }
            }
        });

    } catch (error) {
        console.error('App statistics error:', error);
        return NextResponse.json({ 
            success: false,
            error: 'Failed to fetch statistics' 
        }, { status: 500 });
    }
}

// Helper function to format bytes
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
