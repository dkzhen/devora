import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyApiKey, recordApiKeyUsage } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST - Mark task as completed/uncompleted
export async function POST(request, { params }) {
    const auth = await verifyApiKey(request);
    
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { id, taskId } = await params;
    const { user, apiKeyId } = auth;
    
    try {
        const body = await request.json();
        const { completed } = body;

        if (typeof completed !== 'boolean') {
            recordApiKeyUsage(apiKeyId, `/api/v1/airdrops/${id}/tasks/${taskId}/complete`, 'POST', 400);
            return NextResponse.json({ error: 'completed field must be a boolean' }, { status: 400 });
        }

        // Verify task exists and belongs to the airdrop
        const task = await prisma.airdropTask.findUnique({
            where: { id: taskId },
            include: { airdrop: true }
        });

        if (!task || task.airdropId !== id) {
            recordApiKeyUsage(apiKeyId, `/api/v1/airdrops/${id}/tasks/${taskId}/complete`, 'POST', 404);
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        // Check if user has access to this airdrop
        const hasAccess = user.role === 'ULTRA' || 
                         task.airdrop.userId === user.id || 
                         (task.airdrop.isPublic && task.airdrop.publishStatus === 'APPROVED');

        if (!hasAccess) {
            recordApiKeyUsage(apiKeyId, `/api/v1/airdrops/${id}/tasks/${taskId}/complete`, 'POST', 403);
            return NextResponse.json({ error: 'Unauthorized. You do not have access to this project.' }, { status: 403 });
        }

        // Upsert task progress
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

        recordApiKeyUsage(apiKeyId, `/api/v1/airdrops/${id}/tasks/${taskId}/complete`, 'POST', 200);
        return NextResponse.json({
            taskId: progress.taskId,
            completed: progress.completed,
            completedAt: progress.completedAt,
            message: completed ? 'Task marked as completed' : 'Task marked as incomplete'
        }, { status: 200 });
    } catch (error) {
        console.error('API v1 Complete Task Error:', error);
        recordApiKeyUsage(apiKeyId, `/api/v1/airdrops/${id}/tasks/${taskId}/complete`, 'POST', 500);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// GET - Get task completion status for current user
export async function GET(request, { params }) {
    const auth = await verifyApiKey(request);
    
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { id, taskId } = await params;
    const { user, apiKeyId } = auth;
    
    try {
        // Verify task exists and belongs to the airdrop
        const task = await prisma.airdropTask.findUnique({
            where: { id: taskId },
            include: { airdrop: true }
        });

        if (!task || task.airdropId !== id) {
            recordApiKeyUsage(apiKeyId, `/api/v1/airdrops/${id}/tasks/${taskId}/complete`, 'GET', 404);
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        // Check if user has access to this airdrop
        const hasAccess = user.role === 'ULTRA' || 
                         task.airdrop.userId === user.id || 
                         (task.airdrop.isPublic && task.airdrop.publishStatus === 'APPROVED');

        if (!hasAccess) {
            recordApiKeyUsage(apiKeyId, `/api/v1/airdrops/${id}/tasks/${taskId}/complete`, 'GET', 403);
            return NextResponse.json({ error: 'Unauthorized. You do not have access to this project.' }, { status: 403 });
        }

        // Get task progress
        const progress = await prisma.userAirdropTask.findUnique({
            where: {
                userId_taskId: {
                    userId: user.id,
                    taskId: taskId
                }
            }
        });

        recordApiKeyUsage(apiKeyId, `/api/v1/airdrops/${id}/tasks/${taskId}/complete`, 'GET', 200);
        return NextResponse.json({
            taskId: taskId,
            completed: progress?.completed || false,
            completedAt: progress?.completedAt || null
        }, { status: 200 });
    } catch (error) {
        console.error('API v1 Get Task Completion Error:', error);
        recordApiKeyUsage(apiKeyId, `/api/v1/airdrops/${id}/tasks/${taskId}/complete`, 'GET', 500);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
