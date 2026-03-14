import { trackApiHit } from '@/lib/monitoring';
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

export async function GET(request, { params }) {
    trackApiHit(request);
    try {
        const { id } = await params;
        const user = await getUser();
        
        let tasks = await prisma.airdropTask.findMany({
            where: { airdropId: id },
            orderBy: { createdAt: 'asc' }
        });
        
        // Filter out private steps if the user is not the task creator
        tasks = tasks.map(task => {
            const isCreator = user && task.userId === user.id;
            let steps = Array.isArray(task.steps) ? task.steps : [];
            
            steps = steps.filter(step => step.isPrivate !== true || isCreator);
            
            return {
                ...task,
                steps
            };
        });
        
        return NextResponse.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    trackApiHit(request);
    try {
        const { id } = await params;
        const user = await getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
        }

        const airdrop = await prisma.airdrop.findUnique({ where: { id } });
        if (!airdrop) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        if (user.role !== 'ULTRA' && airdrop.userId !== user.id) {
            return NextResponse.json({ error: 'Unauthorized. You can only add tasks to your own projects.' }, { status: 403 });
        }

        const body = await request.json();
        const { title, description, category, deadline, status, steps } = body;

        if (!title || !category) {
            return NextResponse.json({ error: 'Title and category are required' }, { status: 400 });
        }

        const task = await prisma.airdropTask.create({
            data: {
                airdropId: id,
                userId: user.id,
                title,
                description,
                category,
                deadline: deadline ? new Date(deadline) : null,
                status: status || 'Open',
                steps: Array.isArray(steps) ? steps.map(s => ({
                    ...s,
                    image: s.image || null,
                    link: s.link || null,
                    isPrivate: !!s.isPrivate
                })) : []
            }
        });

        return NextResponse.json(task, { status: 201 });
    } catch (error) {
        console.error('Error creating task:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
