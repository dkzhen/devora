
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyApiKey, recordApiKeyUsage } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - List all tasks for a specific airdrop
export async function GET(request, { params }) {
    const auth = await verifyApiKey(request);
    
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { id } = await params;
    const { user, apiKeyId } = auth;
    
    try {
        const airdrop = await prisma.airdrop.findUnique({ where: { id } });
        
        if (!airdrop) {
            recordApiKeyUsage(apiKeyId, `/api/v1/airdrops/${id}/tasks`, 'GET', 404);
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Check if user has access to this airdrop
        const hasAccess = user.role === 'ULTRA' || 
                         airdrop.userId === user.id || 
                         (airdrop.isPublic && airdrop.publishStatus === 'APPROVED');

        if (!hasAccess) {
            recordApiKeyUsage(apiKeyId, `/api/v1/airdrops/${id}/tasks`, 'GET', 403);
            return NextResponse.json({ error: 'Unauthorized. You do not have access to this project.' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const status = searchParams.get('status');

        const where = { airdropId: id };
        if (category) where.category = category;
        if (status) where.status = status;

        const tasks = await prisma.airdropTask.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        // Parse steps JSON for each task
        const tasksWithParsedSteps = tasks.map(task => ({
            ...task,
            steps: task.steps ? JSON.parse(task.steps) : []
        }));

        recordApiKeyUsage(apiKeyId, `/api/v1/airdrops/${id}/tasks`, 'GET', 200);
        return NextResponse.json(tasksWithParsedSteps, { status: 200 });
    } catch (error) {
        console.error('API v1 Get Tasks Error:', error);
        recordApiKeyUsage(apiKeyId, `/api/v1/airdrops/${id}/tasks`, 'GET', 500);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    const auth = await verifyApiKey(request);
    
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { id } = await params;
    const { user, apiKeyId } = auth;
    
    try {
        const airdrop = await prisma.airdrop.findUnique({ where: { id } });
        
        if (!airdrop) {
            recordApiKeyUsage(apiKeyId, `/api/v1/airdrops/${id}/tasks`, 'POST', 404);
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Permission check: User must own the project or be ULTRA
        if (user.role !== 'ULTRA' && airdrop.userId !== user.id) {
            recordApiKeyUsage(apiKeyId, `/api/v1/airdrops/${id}/tasks`, 'POST', 403);
            return NextResponse.json({ error: 'Unauthorized. You can only add tasks to your own projects.' }, { status: 403 });
        }

        const body = await request.json();
        const { title, description, category, deadline, status, steps } = body;

        if (!title || !category) {
            recordApiKeyUsage(apiKeyId, `/api/v1/airdrops/${id}/tasks`, 'POST', 400);
            return NextResponse.json({ error: 'Title and category are required' }, { status: 400 });
        }

        // Validate and process steps
        let processedSteps = [];
        if (Array.isArray(steps) && steps.length > 0) {
            processedSteps = steps
                .filter(s => s.text?.trim() || s.image?.trim() || s.link?.trim()) // Filter out empty steps
                .map(s => ({
                    text: s.text || '',
                    image: s.image || null,
                    link: s.link || null,
                    isPrivate: !!s.isPrivate
                }));
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
                steps: JSON.stringify(processedSteps)
            }
        });

        // Return task with parsed steps
        const taskWithParsedSteps = {
            ...task,
            steps: processedSteps
        };

        recordApiKeyUsage(apiKeyId, `/api/v1/airdrops/${id}/tasks`, 'POST', 201);
        return NextResponse.json(taskWithParsedSteps, { status: 201 });
    } catch (error) {
        console.error('API v1 Create Task Error:', error);
        recordApiKeyUsage(apiKeyId, `/api/v1/airdrops/${id}/tasks`, 'POST', 500);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT - Update a specific task
export async function PUT(request, { params }) {
    const auth = await verifyApiKey(request);
    
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { id } = await params;
    const { user, apiKeyId } = auth;
    
    try {
        const body = await request.json();
        const { taskId, ...updateData } = body;

        if (!taskId) {
            recordApiKeyUsage(apiKeyId, `/api/v1/airdrops/${id}/tasks`, 'PUT', 400);
            return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
        }

        const task = await prisma.airdropTask.findUnique({ 
            where: { id: taskId },
            include: { airdrop: true }
        });
        
        if (!task || task.airdropId !== id) {
            recordApiKeyUsage(apiKeyId, `/api/v1/airdrops/${id}/tasks`, 'PUT', 404);
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        // Permission check: User must own the project or be ULTRA
        if (user.role !== 'ULTRA' && task.airdrop.userId !== user.id) {
            recordApiKeyUsage(apiKeyId, `/api/v1/airdrops/${id}/tasks`, 'PUT', 403);
            return NextResponse.json({ error: 'Unauthorized. You can only update tasks for your own projects.' }, { status: 403 });
        }

        // Prepare update data
        const dataToUpdate = {};
        const allowedFields = ['title', 'description', 'category', 'deadline', 'status'];
        
        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                if (field === 'deadline') {
                    dataToUpdate[field] = updateData[field] ? new Date(updateData[field]) : null;
                } else {
                    dataToUpdate[field] = updateData[field];
                }
            }
        });

        // Handle steps update
        if (updateData.steps !== undefined) {
            let processedSteps = [];
            if (Array.isArray(updateData.steps) && updateData.steps.length > 0) {
                processedSteps = updateData.steps
                    .filter(s => s.text?.trim() || s.image?.trim() || s.link?.trim())
                    .map(s => ({
                        text: s.text || '',
                        image: s.image || null,
                        link: s.link || null,
                        isPrivate: !!s.isPrivate
                    }));
            }
            dataToUpdate.steps = JSON.stringify(processedSteps);
        }

        const updatedTask = await prisma.airdropTask.update({
            where: { id: taskId },
            data: dataToUpdate
        });

        // Return task with parsed steps
        const taskWithParsedSteps = {
            ...updatedTask,
            steps: updatedTask.steps ? JSON.parse(updatedTask.steps) : []
        };

        recordApiKeyUsage(apiKeyId, `/api/v1/airdrops/${id}/tasks`, 'PUT', 200);
        return NextResponse.json(taskWithParsedSteps, { status: 200 });
    } catch (error) {
        console.error('API v1 Update Task Error:', error);
        recordApiKeyUsage(apiKeyId, `/api/v1/airdrops/${id}/tasks`, 'PUT', 500);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE - Delete a specific task
export async function DELETE(request, { params }) {
    const auth = await verifyApiKey(request);
    
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { id } = await params;
    const { user, apiKeyId } = auth;
    
    try {
        const { searchParams } = new URL(request.url);
        const taskId = searchParams.get('taskId');

        if (!taskId) {
            recordApiKeyUsage(apiKeyId, `/api/v1/airdrops/${id}/tasks`, 'DELETE', 400);
            return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
        }

        const task = await prisma.airdropTask.findUnique({ 
            where: { id: taskId },
            include: { airdrop: true }
        });
        
        if (!task || task.airdropId !== id) {
            recordApiKeyUsage(apiKeyId, `/api/v1/airdrops/${id}/tasks`, 'DELETE', 404);
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        // Permission check: User must own the project or be ULTRA
        if (user.role !== 'ULTRA' && task.airdrop.userId !== user.id) {
            recordApiKeyUsage(apiKeyId, `/api/v1/airdrops/${id}/tasks`, 'DELETE', 403);
            return NextResponse.json({ error: 'Unauthorized. You can only delete tasks for your own projects.' }, { status: 403 });
        }

        // Delete task progress records first
        await prisma.taskProgress.deleteMany({
            where: { taskId }
        });

        // Delete the task
        await prisma.airdropTask.delete({
            where: { id: taskId }
        });

        recordApiKeyUsage(apiKeyId, `/api/v1/airdrops/${id}/tasks`, 'DELETE', 200);
        return NextResponse.json({ message: 'Task deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('API v1 Delete Task Error:', error);
        recordApiKeyUsage(apiKeyId, `/api/v1/airdrops/${id}/tasks`, 'DELETE', 500);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
