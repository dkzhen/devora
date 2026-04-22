import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import prisma from '@/lib/db';
import modelCache from '@/lib/model-cache';

export async function POST(req) {
    const auth = await verifyAuth(req);
    
    // Only ULTRA can change model status
    if (!auth.success || auth.user.role !== 'ULTRA') {
        return NextResponse.json({ error: 'Unauthorized. ULTRA access required.' }, { status: 403 });
    }

    try {
        const { modelId, status, isRestricted, allowedEmails } = await req.json();

        if (!modelId) {
            return NextResponse.json({ error: 'Invalid model ID' }, { status: 400 });
        }

        // 1. Update Model Status and Restriction Flag
        const updateData = {};
        if (status) updateData.status = status;
        if (typeof isRestricted === 'boolean') updateData.isRestricted = isRestricted;

        const model = await prisma.aiModel.upsert({
            where: { id: modelId },
            update: updateData,
            create: { 
                id: modelId, 
                status: status || 'active',
                isRestricted: isRestricted || false 
            }
        });

        // 2. Sync Whitelisted Emails (if provided)
        if (Array.isArray(allowedEmails)) {
            // Transactional update for safety
            await prisma.$transaction([
                prisma.aiModelAccess.deleteMany({ where: { modelId } }),
                ...(allowedEmails.length > 0 ? [
                    prisma.aiModelAccess.createMany({
                        data: Array.from(new Set(allowedEmails)) // Unique emails only
                            .map(email => ({
                                modelId,
                                email: email.trim().toLowerCase()
                            }))
                    })
                ] : [])
            ]);
        }

        // Invalidate cache after status/access update
        modelCache.invalidate(modelId);

        return NextResponse.json({ success: true, model });
    } catch (error) {
        console.error('Status/Access Update Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
