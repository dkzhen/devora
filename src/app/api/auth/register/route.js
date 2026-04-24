import { trackApiHit } from '@/lib/monitoring';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { verifyTurnstile } from '@/lib/turnstile';

export async function POST(request) {
    trackApiHit(request);
    try {
        const { name, email, password, turnstileToken } = await request.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
        }

        // 0. Verify Turnstile (Captcha)
        const turnstileResult = await verifyTurnstile(turnstileToken);
        if (!turnstileResult.success) {
            return NextResponse.json({ error: turnstileResult.error || 'Captcha verification failed' }, { status: 400 });
        }

        // 1. Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        // 2. Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Create User
        const user = await prisma.user.create({
            data: {
                email,
                name: name || null,
                password: hashedPassword,
                role: 'MEMBER' // Default role as requested
            }
        });

        // 4. Return success response (user will need to login manually)
        return NextResponse.json({
            success: true,
            user: { email: user.email, name: user.name, role: user.role }
        }, { status: 201 });

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
