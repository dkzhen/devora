import { NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';
import prisma from '@/lib/db';
import { cookies } from 'next/headers';
import { trackApiHit } from '@/lib/monitoring';

export async function PUT(request) {
    trackApiHit(request);

    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        let payload;
        try {
            const verified = await jwtVerify(token, secret);
            payload = verified.payload;
        } catch (err) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const userId = payload.sub;
        const body = await request.json();
        const { name, email } = body;

        if (!name || !email) {
            return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
        }

        // Basic email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
        }

        // Check if email is already taken by ANOTHER user
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser && existingUser.id !== userId) {
            return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { name, email },
        });

        // 3. Issue a new JWT token because the email/name in payload might have changed
        const newToken = await new SignJWT({ sub: updatedUser.id, email: updatedUser.email, name: updatedUser.name })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('24h')
            .sign(secret);

        const response = NextResponse.json({ success: true });

        response.cookies.set({
            name: 'auth_token',
            value: newToken,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 // 24 hours
        });

        return response;

    } catch (error) {
        console.error('Profile update error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
