import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import prisma from '@/lib/db';

async function verifyAuth(request) {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return null;

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        // Map payload sub to id since JWT stores the user's ID in the 'sub' field
        return {
            ...payload,
            id: payload.sub || payload.id
        };
    } catch (error) {
        return null;
    }
}

export async function GET(request) {
    const user = await verifyAuth(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { httpClientData: true },
        });

        if (!dbUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ data: dbUser.httpClientData || {} });
    } catch (error) {
        console.error('Error fetching http client data:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request) {
    const user = await verifyAuth(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { collections, history, environments, activeEnvId } = body;

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                httpClientData: {
                    collections: collections || [],
                    history: history || [],
                    environments: environments || [],
                    activeEnvId: activeEnvId || null,
                }
            },
            select: { httpClientData: true },
        });

        return NextResponse.json({ data: updatedUser.httpClientData });
    } catch (error) {
        console.error('Error updating http client data:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
