
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyApiKey, recordApiKeyUsage } from '@/lib/auth';

export const dynamic = 'force-dynamic';

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
