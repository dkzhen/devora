import { trackApiHit } from '@/lib/monitoring';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { verifyTurnstile } from '@/lib/turnstile';

export async function POST(request) {
    trackApiHit(request);
    try {
        const { email, password, turnstileToken } = await request.json();

        // 1. Verify Turnstile (Captcha)
        const turnstileResult = await verifyTurnstile(turnstileToken);
        if (!turnstileResult.success) {
            return NextResponse.json({ error: turnstileResult.error || 'Captcha verification failed' }, { status: 400 });
        }

        // 2. Find User
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Check if user is OAuth-only (no password)
        if (!user.password) {
            return NextResponse.json({ error: 'Please sign in with Google' }, { status: 401 });
        }

        // 3. Verify Password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // 4. Generate JWT
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const token = await new SignJWT({ 
            sub: user.id, 
            email: user.email, 
            name: user.name,
            role: user.role // Include role in JWT payload
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('24h')
            .sign(secret);

        // 5. Create Response with Cookie
        const response = NextResponse.json({
            success: true,
            user: { email: user.email, name: user.name, role: user.role },
            token // Sending token in body for localStorage if needed
        });

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
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
