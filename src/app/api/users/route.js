import { trackApiHit } from '@/lib/monitoring';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

async function checkUltraAuth(request) {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return null;

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);

        const user = await prisma.user.findUnique({
            where: { id: payload.sub },
            select: { id: true, role: true }
        });

        if (!user || user.role !== 'ULTRA') return null;
        return user;
    } catch {
        return null;
    }
}

export async function GET(request) {
    trackApiHit(request);
    try {
        const authUser = await checkUltraAuth(request);
        if (!authUser) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error('Users API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

export async function POST(request) {
    trackApiHit(request);
    try {
        const authUser = await checkUltraAuth(request);
        if (!authUser) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { email, password, name, role } = body;

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: name || undefined,
                role: role || 'MEMBER',
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
        });

        return NextResponse.json(newUser, { status: 201 });
    } catch (error) {
        console.error('Create User Error:', error);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}
