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
        return await prisma.user.findUnique({
            where: { id: payload.sub },
            select: { id: true, role: true }
        });
    } catch (e) { return null; }
}

export async function DELETE(request, { params }) {
    trackApiHit(request);
    try {
        const { id } = await params;
        const user = await getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
        }

        const airdrop = await prisma.airdrop.findUnique({ where: { id } });
        if (!airdrop) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        if (user.role === 'ULTRA') {
            if (!airdrop.isPublic && airdrop.publishStatus !== 'PENDING' && airdrop.userId !== user.id) {
                return NextResponse.json({ error: 'Not found' }, { status: 404 }); // Hide completely from ULTRA
            }
        } else if (airdrop.userId !== user.id) {
            return NextResponse.json({ error: 'Unauthorized. You can only delete your own projects.' }, { status: 403 });
        }

        // Delete the airdrop (cascade deletes tasks and progress automatically)
        await prisma.airdrop.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Failed to delete airdrop:', error);
        return NextResponse.json({ error: 'Failed to delete airdrop' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    trackApiHit(request);
    try {
        const { id } = await params;
        const user = await getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
        }

        const airdrop = await prisma.airdrop.findUnique({ where: { id } });
        if (!airdrop) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        if (user.role === 'ULTRA') {
            if (!airdrop.isPublic && airdrop.publishStatus !== 'PENDING' && airdrop.userId !== user.id) {
                return NextResponse.json({ error: 'Not found' }, { status: 404 }); // Hide completely from ULTRA
            }
        } else if (airdrop.userId !== user.id) {
            return NextResponse.json({ error: 'Unauthorized. You can only update your own projects.' }, { status: 403 });
        }

        const body = await request.json();
        const {
            name, icon, description, raise, score, symbol,
            rewardDate, rewardType, status, cost, time, taskType, stage,
            projectType, links, publishStatus
        } = body;

        let newIsPublic = airdrop.isPublic;
        let newPublishStatus = airdrop.publishStatus;

        if (user.role === 'ULTRA') {
            if (body.isPublic !== undefined) {
                newIsPublic = body.isPublic;
                if (publishStatus === undefined) {
                    newPublishStatus = newIsPublic ? 'APPROVED' : 'NONE';
                }
            }

            // Handle publish specific actions from ULTRA
            if (publishStatus !== undefined) {
                if (publishStatus === 'APPROVED') {
                    newIsPublic = true;
                    newPublishStatus = 'APPROVED';
                } else if (publishStatus === 'REJECTED') {
                    newIsPublic = false;
                    newPublishStatus = 'NONE'; // Reset so they can request again
                } else if (publishStatus === 'PENDING') {
                    newPublishStatus = 'PENDING';
                }
            }
        } else if (airdrop.userId === user.id) {
            // Owner can request publish
            if (publishStatus === 'PENDING' && !airdrop.isPublic) {
                newPublishStatus = 'PENDING';
            }
        }

        // Logic check: Limit "New" status projects to max 5
        let currentStatus = status;
        if (currentStatus === 'New') {
            // Find all 'New' projects EXCLUDING the one we are currently editing
            const newProjects = await prisma.airdrop.findMany({
                where: {
                    status: 'New',
                    id: { not: id }
                },
                orderBy: { createdAt: 'desc' },
                select: { id: true }
            });

            // If there are already 5 or more OTHER 'New' projects, the oldest ones will be changed to 'Potential'
            if (newProjects.length >= 5) {
                const projectsToUpdate = newProjects.slice(4); // Keep the 4 newest, plus the 1 we are updating = 5

                if (projectsToUpdate.length > 0) {
                    await prisma.airdrop.updateMany({
                        where: { id: { in: projectsToUpdate.map(p => p.id) } },
                        data: { status: 'Potential', statusDate: new Date() }
                    });
                }
            }
        }

        const updatedAirdrop = await prisma.airdrop.update({
            where: { id },
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
                links,
                isPublic: newIsPublic,
                publishStatus: newPublishStatus,
                updatedAt: new Date(),
                // Only update status date if status changed, handled roughly outside, but for now we let it be or update it
                ...(status && { statusDate: new Date() })
            }
        });

        return NextResponse.json(updatedAirdrop);
    } catch (error) {
        console.error('Failed to update airdrop:', error);
        return NextResponse.json({ error: 'Failed to update airdrop' }, { status: 500 });
    }
}
