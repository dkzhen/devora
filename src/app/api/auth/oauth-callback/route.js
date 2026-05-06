import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { SignJWT } from 'jose';
import prisma from '@/lib/db';

export async function GET(request) {
    try {
        // Use BASE_URL based on environment
        const baseUrl = process.env.NODE_ENV === 'production' 
            ? process.env.BASE_URL_PROD 
            : process.env.BASE_URL_DEV;
        
        const session = await getServerSession();
        
        if (!session || !session.user) {
            return NextResponse.redirect(new URL('/login?error=oauth_failed', baseUrl));
        }

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.redirect(new URL('/login?error=user_not_found', baseUrl));
        }

        // Generate JWT token
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const token = await new SignJWT({
            sub: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('24h')
            .sign(secret);

        // Redirect to dashboard with token
        const response = NextResponse.redirect(new URL('/dashboard', baseUrl));
        
        response.cookies.set({
            name: 'auth_token',
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 // 24 hours
        });

        return response;
    } catch (error) {
        console.error('OAuth callback error:', error);
        const baseUrl = process.env.NODE_ENV === 'production' 
            ? process.env.BASE_URL_PROD 
            : process.env.BASE_URL_DEV;
        return NextResponse.redirect(new URL('/login?error=callback_failed', baseUrl));
    }
}
