import { trackApiHit } from '@/lib/monitoring';
import prisma from '@/lib/db';
import { downloadDriveFile } from '@/lib/services/drive.service';
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

export async function GET(request) {
    trackApiHit(request);
    try {
        const user = await getAuthenticatedUser();
        if (!user || (user.role !== 'PRO' && user.role !== 'ULTRA')) {
            return new Response('Unauthorized', { status: 401 });
        }

        const email = request.nextUrl.searchParams.get('email');
        const fileId = request.nextUrl.searchParams.get('fileId');

        if (!email || !fileId) {
            return new Response('Missing parameters', { status: 400 });
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
            return new Response('Account not found', { status: 404 });
        }

        // Download from Drive
        const { stream, filename, mimeType } = await downloadDriveFile(
            account.refreshToken,
            clientId,
            clientSecret,
            fileId
        );

        // Convert the Node.js Readable stream into a Web ReadableStream
        // Next.js Response expects a Web Stream or an async iterator
        const webStream = new ReadableStream({
            start(controller) {
                stream.on('data', chunk => controller.enqueue(chunk));
                stream.on('end', () => controller.close());
                stream.on('error', err => controller.error(err));
            }
        });

        return new Response(webStream, {
            headers: {
                'Content-Type': mimeType || 'application/octet-stream',
                'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
            }
        });

    } catch (error) {
        console.error('API Drive Download Error:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}
