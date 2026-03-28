import { trackApiHit } from '@/lib/monitoring';
import { NextResponse } from 'next/server';
import { verifyApiKey, recordApiKeyUsage } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(req) {
    const auth = await verifyApiKey(req);
    if (!auth.success) return new NextResponse('Unauthorized', { status: 401 });

    const { searchParams } = new URL(req.url);
    const urlOptions = searchParams.get('url');
    const accountId = searchParams.get('accountId');

    if (!urlOptions || !urlOptions.startsWith('https://api.mail.tm/')) {
        await recordApiKeyUsage(auth.apiKeyId, '/api/v1/temp-mail/image', 'GET', 400);
        return new NextResponse('Invalid URL provided', { status: 400 });
    }

    if (!accountId) {
        await recordApiKeyUsage(auth.apiKeyId, '/api/v1/temp-mail/image', 'GET', 400);
        return new NextResponse('accountId is required', { status: 400 });
    }

    trackApiHit(req);

    try {
        // Verify account ownership
        const account = await prisma.tempMailAccount.findUnique({
            where: { id: accountId, userId: auth.user.id },
            select: { token: true }
        });

        if (!account || !account.token) {
            return new NextResponse('Unauthorized or account not found', { status: 404 });
        }

        const res = await fetch(urlOptions, {
            headers: { 'Authorization': `Bearer ${account.token}` }
        });

        const blob = await res.blob();
        await recordApiKeyUsage(auth.apiKeyId, '/api/v1/temp-mail/image', 'GET', res.status);

        return new NextResponse(blob, {
            status: res.status,
            headers: {
                'Content-Type': res.headers.get('Content-Type') || 'application/octet-stream',
            }
        });
    } catch (error) {
        console.error('v1 Image Proxy Error:', error);
        await recordApiKeyUsage(auth.apiKeyId, '/api/v1/temp-mail/image', 'GET', 500);
        return new NextResponse('Failed to proxy image', { status: 500 });
    }
}
