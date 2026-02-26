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

export async function DELETE(request, { params }) {
    trackApiHit(request);
    try {
        const { id, taskId } = await params;
        const user = await getUser();
        if (!user || user.role !== 'ULTRA') {
            return NextResponse.json({ error: 'Unauthorized. Only ULTRA admins can delete tasks.' }, { status: 403 });
        }

        // Verify task exists and belongs to airdrop
        const existingTask = await prisma.airdropTask.findUnique({
            where: { id: taskId }
        });

        if (!existingTask || existingTask.airdropId !== id) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        await prisma.airdropTask.delete({
            where: { id: taskId }
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Error deleting task:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    trackApiHit(request);
    try {
        const { id, taskId } = await params;
        const user = await getUser();
        if (!user || user.role !== 'ULTRA') {
            return NextResponse.json({ error: 'Unauthorized. Only ULTRA admins can edit tasks.' }, { status: 403 });
        }

        const body = await request.json();
        const { title, description, category, deadline, status, steps } = body;

        // Verify task exists and belongs to airdrop
        const existingTask = await prisma.airdropTask.findUnique({
            where: { id: taskId }
        });

        if (!existingTask || existingTask.airdropId !== id) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        const updatedTask = await prisma.airdropTask.update({
            where: { id: taskId },
            data: {
                title: title !== undefined ? title : existingTask.title,
                description: description !== undefined ? description : existingTask.description,
                category: category !== undefined ? category : existingTask.category,
                deadline: deadline !== undefined ? (deadline ? new Date(deadline) : null) : existingTask.deadline,
                status: status !== undefined ? status : existingTask.status,
                steps: steps !== undefined ? steps : existingTask.steps
            }
        });

        return NextResponse.json(updatedTask, { status: 200 });
    } catch (error) {
        console.error('Error updating task:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
