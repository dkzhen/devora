import { getOAuth2Client } from '@/lib/services/gmail.service';
import prisma from '@/lib/db';
import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || (host && host.includes('localhost') ? 'http' : 'https');

    const baseUrl = host ? `${protocol}://${host}` : (process.env.NODE_ENV === 'production'
        ? process.env.BASE_URL_PROD
        : process.env.BASE_URL_DEV);

    if (error) {
        return NextResponse.redirect(new URL('/?error=' + error, baseUrl || request.url));
    }

    if (!code) {
        return NextResponse.redirect(new URL('/?error=no_code', baseUrl || request.url));
    }

    try {
        // Fetch user credentials if logged in
        let clientId, clientSecret, userId;
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (token) {
            try {
                const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
                const { payload } = await jwtVerify(token, secretKey);
                userId = payload.sub; // Capture userId
                const user = await prisma.user.findUnique({ where: { id: payload.sub } });

                if (user && user.googleClientId && user.googleClientSecret) {
                    const { decrypt } = await import('@/lib/crypto');
                    clientId = user.googleClientId.includes(':') ? decrypt(user.googleClientId) : user.googleClientId;
                    clientSecret = user.googleClientSecret.includes(':') ? decrypt(user.googleClientSecret) : user.googleClientSecret;
                }
            } catch (err) {
                console.warn('Failed to fetch user credentials in callback:', err.message);
            }
        }

        const oauth2Client = getOAuth2Client(clientId, clientSecret);
        let tokens;
        let retries = 3;
        while (retries > 0) {
            try {
                const response = await oauth2Client.getToken(code);
                tokens = response.tokens;
                break;
            } catch (e) {
                retries--;
                console.warn(`getToken failed, retries left: ${retries}`, e.message);
                if (retries === 0) throw e;
                await new Promise(res => setTimeout(res, 1000));
            }
        }
        oauth2Client.setCredentials(tokens);

        // Get user profile
        const oauth2 = google.oauth2({
            auth: oauth2Client,
            version: 'v2'
        });

        const { data: userInfo } = await oauth2.userinfo.get();

        const accountData = {
            email: userInfo.email,
            name: userInfo.name,
            refreshToken: tokens.refresh_token
        };

        // If we don't have a refresh token (user previously authorized), we might not be able to do checks offline
        // unless we force prompt (which we did in generateAuthUrl)
        if (!tokens.refresh_token) {
            console.warn('No refresh token received for', userInfo.email);
            // In a real app, you might want to force re-auth here or just proceed
        }

        // ...
        // Upsert account in database
        if (!userId) {
            console.error('No user ID found in session for account linking');
            return NextResponse.redirect(new URL('/login?error=session_expired', baseUrl || request.url));
        }

        await prisma.account.upsert({
            where: { email: userInfo.email },
            update: {
                name: userInfo.name,
                refreshToken: tokens.refresh_token ? tokens.refresh_token : undefined,
                status: 'active',
                lastCheck: new Date(),
                userId: userId // Ensure ownership update (though usually ownership doesn't change)
            },
            create: {
                email: userInfo.email,
                name: userInfo.name,
                refreshToken: tokens.refresh_token || '',
                status: 'active',
                totalMessages: 0,
                totalThreads: 0,
                lastCheck: new Date(),
                userId: userId
            }
        });

        return NextResponse.redirect(new URL('/email-list?success=true&email=' + encodeURIComponent(userInfo.email), baseUrl || request.url));

    } catch (err) {
        console.error('Auth callback error:', err);
        return NextResponse.redirect(new URL('/email-list?error=auth_failed', baseUrl || request.url));
    }
}
