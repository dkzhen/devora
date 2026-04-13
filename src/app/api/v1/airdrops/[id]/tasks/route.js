
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyApiKey, recordApiKeyUsage } from '@/lib/auth';

export const dynamic = 'force-dynamic';

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

        const task = await prisma.airdropTask.create({
            data: {
                airdropId: id,
                userId: user.id,
                title,
                description,
                category,
                deadline: deadline ? new Date(deadline) : null,
                status: status || 'Open',
                steps: Array.isArray(steps) ? JSON.stringify(steps.map(s => ({
                    text: s.text,
                    image: s.image || null,
                    link: s.link || null,
                    isPrivate: !!s.isPrivate
                }))) : '[]'
            }
        });

        recordApiKeyUsage(apiKeyId, `/api/v1/airdrops/${id}/tasks`, 'POST', 201);
        return NextResponse.json(task, { status: 201 });
    } catch (error) {
        console.error('API v1 Create Task Error:', error);
        recordApiKeyUsage(apiKeyId, `/api/v1/airdrops/${id}/tasks`, 'POST', 500);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
