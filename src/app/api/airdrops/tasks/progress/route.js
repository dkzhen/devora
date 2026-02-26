import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { cookies } from 'next/headers';
import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function getUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;
    try {
        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jose.jwtVerify(token, secret);
        return await prisma.user.findUnique({ where: { id: payload.sub } });
    } catch (e) { return null; }
}

export async function GET(request) {
    try {
        const user = await getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Get optional airdropId from query to filter progress
        const { searchParams } = new URL(request.url);
        const airdropId = searchParams.get('airdropId');

        const whereClause = { userId: user.id };
        if (airdropId) {
            whereClause.task = { airdropId };
        }

        const progress = await prisma.userAirdropTask.findMany({
            where: whereClause
        });

        return NextResponse.json(progress);
    } catch (error) {
        console.error('Error fetching progress:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const user = await getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role === 'MEMBER') {
            return NextResponse.json({ error: 'PRO or ULTRA plan required' }, { status: 403 });
        }

        const body = await request.json();
        const { taskId, completed } = body;

        if (!taskId) {
            return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
        }

        const progress = await prisma.userAirdropTask.upsert({
            where: {
                userId_taskId: {
                    userId: user.id,
                    taskId: taskId
                }
            },
            update: {
                completed,
                completedAt: completed ? new Date() : null
            },
            create: {
                userId: user.id,
                taskId: taskId,
                completed,
                completedAt: completed ? new Date() : null
            }
        });

        return NextResponse.json(progress);
    } catch (error) {
        console.error('Error updating progress:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
