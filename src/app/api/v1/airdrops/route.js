
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyApiKey, recordApiKeyUsage } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - List all airdrops for the authenticated user
export async function GET(request) {
    const auth = await verifyApiKey(request);
    
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { user, apiKeyId } = auth;
    
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const projectType = searchParams.get('projectType');
        const isPublic = searchParams.get('isPublic');
        
        const where = {
            OR: [
                { userId: user.id },
                { isPublic: true, publishStatus: 'APPROVED' }
            ]
        };

        if (status) where.status = status;
        if (projectType) where.projectType = projectType;
        if (isPublic !== null) where.isPublic = isPublic === 'true';

        const airdrops = await prisma.airdrop.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { tasks: true }
                }
            }
        });

        recordApiKeyUsage(apiKeyId, '/api/v1/airdrops', 'GET', 200);
        return NextResponse.json(airdrops, { status: 200 });
    } catch (error) {
        console.error('API v1 Get Airdrops Error:', error);
        recordApiKeyUsage(apiKeyId, '/api/v1/airdrops', 'GET', 500);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    const auth = await verifyApiKey(request);
    
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { user, apiKeyId } = auth;
    
    try {
        const body = await request.json();
        const {
            name, icon, description, raise, score, symbol,
            rewardDate, rewardType, status, cost, time, taskType, stage,
            projectType, links
        } = body;

        if (!name) {
            recordApiKeyUsage(apiKeyId, '/api/v1/airdrops', 'POST', 400);
            return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
        }

        // Logic check: Limit "New" status projects to max 5
        let currentStatus = status || 'New';
        if (currentStatus === 'New') {
            const newProjects = await prisma.airdrop.findMany({
                where: { status: 'New' },
                orderBy: { createdAt: 'desc' },
                select: { id: true }
            });

            if (newProjects.length >= 5) {
                const projectsToUpdate = newProjects.slice(4);
                if (projectsToUpdate.length > 0) {
                    await prisma.airdrop.updateMany({
                        where: { id: { in: projectsToUpdate.map(p => p.id) } },
                        data: { status: 'Potential', statusDate: new Date() }
                    });
                }
            }
        }

        const airdrop = await prisma.airdrop.create({
            data: {
                name,
                icon: icon || null,
                description,
                raise,
                score,
                symbol,
                rewardDate,
                rewardType,
                status: currentStatus,
                cost,
                time,
                taskType,
                stage,
                projectType,
                links: links ? JSON.stringify(links) : null,
                userId: user.id,
                isPublic: user.role === 'ULTRA' && body.isPublic === true ? true : false,
                publishStatus: user.role === 'ULTRA' && body.isPublic === true ? 'APPROVED' : 'NONE',
                statusDate: new Date()
            }
        });

        recordApiKeyUsage(apiKeyId, '/api/v1/airdrops', 'POST', 201);
        return NextResponse.json(airdrop, { status: 201 });
    } catch (error) {
        console.error('API v1 Create Airdrop Error:', error);
        recordApiKeyUsage(apiKeyId, '/api/v1/airdrops', 'POST', 500);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT - Update airdrop by ID
export async function PUT(request) {
    const auth = await verifyApiKey(request);
    
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { user, apiKeyId } = auth;
    
    try {
        const body = await request.json();
        const { id, ...updateData } = body;

        if (!id) {
            recordApiKeyUsage(apiKeyId, '/api/v1/airdrops', 'PUT', 400);
            return NextResponse.json({ error: 'Airdrop ID is required' }, { status: 400 });
        }

        const airdrop = await prisma.airdrop.findUnique({ where: { id } });
        
        if (!airdrop) {
            recordApiKeyUsage(apiKeyId, '/api/v1/airdrops', 'PUT', 404);
            return NextResponse.json({ error: 'Airdrop not found' }, { status: 404 });
        }

        // Permission check: User must own the project or be ULTRA
        if (user.role !== 'ULTRA' && airdrop.userId !== user.id) {
            recordApiKeyUsage(apiKeyId, '/api/v1/airdrops', 'PUT', 403);
            return NextResponse.json({ error: 'Unauthorized. You can only update your own projects.' }, { status: 403 });
        }

        // Prepare update data
        const dataToUpdate = {};
        const allowedFields = ['name', 'icon', 'description', 'raise', 'score', 'symbol', 'rewardDate', 'rewardType', 'status', 'cost', 'time', 'taskType', 'stage', 'projectType', 'links'];
        
        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                dataToUpdate[field] = field === 'links' && typeof updateData[field] === 'object' 
                    ? JSON.stringify(updateData[field]) 
                    : updateData[field];
            }
        });

        // Handle isPublic and publishStatus (ULTRA only)
        if (user.role === 'ULTRA') {
            if (updateData.isPublic !== undefined) {
                dataToUpdate.isPublic = updateData.isPublic;
                dataToUpdate.publishStatus = updateData.isPublic ? 'APPROVED' : 'NONE';
            }
            if (updateData.publishStatus !== undefined) {
                dataToUpdate.publishStatus = updateData.publishStatus;
            }
        }

        // Update status date if status changed
        if (dataToUpdate.status && dataToUpdate.status !== airdrop.status) {
            dataToUpdate.statusDate = new Date();
        }

        const updatedAirdrop = await prisma.airdrop.update({
            where: { id },
            data: dataToUpdate
        });

        recordApiKeyUsage(apiKeyId, '/api/v1/airdrops', 'PUT', 200);
        return NextResponse.json(updatedAirdrop, { status: 200 });
    } catch (error) {
        console.error('API v1 Update Airdrop Error:', error);
        recordApiKeyUsage(apiKeyId, '/api/v1/airdrops', 'PUT', 500);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE - Delete airdrop by ID
export async function DELETE(request) {
    const auth = await verifyApiKey(request);
    
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { user, apiKeyId } = auth;
    
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            recordApiKeyUsage(apiKeyId, '/api/v1/airdrops', 'DELETE', 400);
            return NextResponse.json({ error: 'Airdrop ID is required' }, { status: 400 });
        }

        const airdrop = await prisma.airdrop.findUnique({ where: { id } });
        
        if (!airdrop) {
            recordApiKeyUsage(apiKeyId, '/api/v1/airdrops', 'DELETE', 404);
            return NextResponse.json({ error: 'Airdrop not found' }, { status: 404 });
        }

        // Permission check: User must own the project or be ULTRA
        if (user.role !== 'ULTRA' && airdrop.userId !== user.id) {
            recordApiKeyUsage(apiKeyId, '/api/v1/airdrops', 'DELETE', 403);
            return NextResponse.json({ error: 'Unauthorized. You can only delete your own projects.' }, { status: 403 });
        }

        // Delete all related tasks first
        await prisma.airdropTask.deleteMany({
            where: { airdropId: id }
        });

        // Delete the airdrop
        await prisma.airdrop.delete({
            where: { id }
        });

        recordApiKeyUsage(apiKeyId, '/api/v1/airdrops', 'DELETE', 200);
        return NextResponse.json({ message: 'Airdrop deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('API v1 Delete Airdrop Error:', error);
        recordApiKeyUsage(apiKeyId, '/api/v1/airdrops', 'DELETE', 500);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
