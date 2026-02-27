import { trackApiHit } from '@/lib/monitoring';
import prisma from '@/lib/db';
import { listDriveFiles } from '@/lib/services/drive.service';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

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

// Fetch cached files from database
export async function GET(request) {
    trackApiHit(request);
    try {
        const user = await getAuthenticatedUser();
        if (!user || (user.role !== 'PRO' && user.role !== 'ULTRA')) {
            return NextResponse.json({ error: 'Unauthorized or insufficient role' }, { status: 401 });
        }

        const email = request.nextUrl.searchParams.get('email');
        const query = request.nextUrl.searchParams.get('q') || '';
        const folderId = request.nextUrl.searchParams.get('folderId') || 'root';

        if (!email) {
            return NextResponse.json({ error: 'Missing email parameter' }, { status: 400 });
        }

        const decodedEmail = decodeURIComponent(email);

        // Verify ownership
        const account = await prisma.account.findFirst({
            where: { email: decodedEmail, userId: user.id }
        });

        if (!account) {
            return NextResponse.json({ error: 'Account not found' }, { status: 404 });
        }

        // Search from DB
        const files = await prisma.driveFile.findMany({
            where: {
                accountId: decodedEmail,
                folderId: folderId,
                name: { contains: query }
            },
            orderBy: [
                { folderId: 'asc' }, // just a rough equivalent for 'folder' from drive
                { modifiedTime: 'desc' }
            ]
        });

        return NextResponse.json({ success: true, files });

    } catch (error) {
        console.error('API Drive Files GET Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Force refresh from Google Drive API
export async function POST(request) {
    trackApiHit(request);
    try {
        const user = await getAuthenticatedUser();
        if (!user || (user.role !== 'PRO' && user.role !== 'ULTRA')) {
            return NextResponse.json({ error: 'Unauthorized or insufficient role' }, { status: 401 });
        }

        const email = request.nextUrl.searchParams.get('email');
        const query = request.nextUrl.searchParams.get('q') || '';
        const folderId = request.nextUrl.searchParams.get('folderId') || 'root';

        if (!email) {
            return NextResponse.json({ error: 'Missing email parameter' }, { status: 400 });
        }

        const decodedEmail = decodeURIComponent(email);

        // Fetch user credentials
        let clientId, clientSecret;
        if (user.googleClientId && user.googleClientSecret) {
            const { decrypt } = await import('@/lib/crypto');
            try {
                clientId = user.googleClientId.includes(':') ? decrypt(user.googleClientId) : user.googleClientId;
                clientSecret = user.googleClientSecret.includes(':') ? decrypt(user.googleClientSecret) : user.googleClientSecret;
            } catch (e) {
                console.warn('Credential decryption failed', e);
            }
        }

        // Verify ownership and get refresh token
        const account = await prisma.account.findFirst({
            where: { email: decodedEmail, userId: user.id }
        });

        if (!account || !account.refreshToken) {
            return NextResponse.json({ error: 'Account not found or not linked' }, { status: 404 });
        }

        // Fetch files from Drive
        const googleFiles = await listDriveFiles(account.refreshToken, clientId, clientSecret, query, folderId);

        // If no search query, we sync the entire cache (replace all) for this specific folder
        // If there's a search query, we don't clear the whole DB, we just return the live results.
        if (!query) {
            await prisma.$transaction(async (tx) => {
                await tx.driveFile.deleteMany({
                    where: {
                        accountId: decodedEmail,
                        folderId: folderId,
                    }
                });

                if (googleFiles.length > 0) {
                    await tx.driveFile.createMany({
                        data: googleFiles.map(file => ({
                            id: file.id,
                            name: file.name || 'Untitled',
                            mimeType: file.mimeType || 'unknown',
                            size: file.size || null,
                            iconLink: file.iconLink || null,
                            webViewLink: file.webViewLink || null,
                            modifiedTime: file.modifiedTime ? new Date(file.modifiedTime) : new Date(),
                            accountId: decodedEmail,
                            folderId: folderId
                        }))
                    });
                }
            });
        }

        return NextResponse.json({ success: true, files: googleFiles });

    } catch (error) {
        console.error('API Drive Files POST Error:', error);
        if (error.code === 'INSUFFICIENT_SCOPES' || (error.message && error.message.includes('insufficient authentication scopes'))) {
            return NextResponse.json({ error: 'Insufficient scopes. Please reconnect your account.', needsReconnect: true }, { status: 403 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
