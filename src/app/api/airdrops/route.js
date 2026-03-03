
import { trackApiHit } from '@/lib/monitoring';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

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
    trackApiHit(request);
    try {
        const user = await getUser();
        let whereClause = {};

        if (!user) {
            whereClause = { isPublic: true };
        } else if (user.role === 'ULTRA') {
            whereClause = {
                OR: [
                    { isPublic: true },
                    { userId: user.id },
                    { publishStatus: 'PENDING' }
                ]
            };
        } else {
            whereClause = {
                OR: [
                    { isPublic: true },
                    { userId: user.id }
                ]
            };
        }

        const airdrops = await prisma.airdrop.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: {
                tasks: {
                    select: { category: true }
                }
            }
        });
        return NextResponse.json(airdrops);
    } catch (error) {
        console.error('Failed to fetch airdrops:', error);
        return NextResponse.json({ error: 'Failed to fetch airdrops' }, { status: 500 });
    }
}

export async function POST(request) {
    trackApiHit(request);
    try {
        const user = await getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized. You must be logged in to add projects.' }, { status: 401 });
        }

        const body = await request.json();
        const {
            name, icon, description, raise, score, symbol,
            rewardDate, rewardType, status, cost, time, taskType, stage,
            projectType, links
        } = body;

        if (!name) {
            return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
        }

        // Logic check: Limit "New" status projects to max 5
        let currentStatus = status;
        if (currentStatus === 'New') {
            const newProjects = await prisma.airdrop.findMany({
                where: { status: 'New' },
                orderBy: { createdAt: 'desc' },
                select: { id: true }
            });

            // If we already have 5 or more 'New' projects, the oldest ones will be changed to 'Potential'
            if (newProjects.length >= 5) {
                const projectsToUpdate = newProjects.slice(4); // Keep the 4 newest, plus the 1 we are creating = 5

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
                icon,
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
                links,
                userId: user.id,
                isPublic: user.role === 'ULTRA' && body.isPublic === true ? true : false,
                publishStatus: user.role === 'ULTRA' && body.isPublic === true ? 'APPROVED' : 'NONE',
                statusDate: new Date()
            }
        });

        return NextResponse.json(airdrop, { status: 201 });
    } catch (error) {
        console.error('Error creating airdrop:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
