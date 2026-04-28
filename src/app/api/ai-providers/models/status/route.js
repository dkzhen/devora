import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import prisma from '@/lib/db';
import modelCache from '@/lib/model-cache';

export async function POST(req) {
    try {
        // Read auth token from cookies using Next.js headers (App Router compatible)
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized. No auth token found.' }, { status: 403 });
        }

        let userRole;
        try {
            const secret = new TextEncoder().encode(process.env.JWT_SECRET);
            const { payload } = await jwtVerify(token, secret);
            userRole = payload.role;
        } catch {
            return NextResponse.json({ error: 'Unauthorized. Invalid token.' }, { status: 403 });
        }

        // Only ULTRA can change model status
        if (userRole !== 'ULTRA') {
            return NextResponse.json({ error: 'Unauthorized. ULTRA access required.' }, { status: 403 });
        }

        const { modelId, status, isRestricted, allowedEmails } = await req.json();
        const normalizedAllowedEmails = Array.isArray(allowedEmails)
            ? Array.from(new Set(allowedEmails
                .map(email => email.trim().toLowerCase())
                .filter(Boolean)))
            : null;

        if (!modelId) {
            return NextResponse.json({ error: 'Invalid model ID' }, { status: 400 });
        }

        // 1. Update Model Status and Restriction Flag
        const updateData = {};
        if (status) updateData.status = status;
        if (typeof isRestricted === 'boolean') updateData.isRestricted = isRestricted;
        if (normalizedAllowedEmails) updateData.isRestricted = normalizedAllowedEmails.length > 0;

        const model = await prisma.aiModel.update({
            where: { id: modelId },
            data: updateData
        });

        // 2. Sync Whitelisted Emails (if provided)
        if (normalizedAllowedEmails) {
            // Transactional update for safety
            await prisma.$transaction([
                prisma.aiModelAccess.deleteMany({ where: { modelId } }),
                ...(normalizedAllowedEmails.length > 0 ? [
                    prisma.aiModelAccess.createMany({
                        data: normalizedAllowedEmails.map(email => ({
                            modelId,
                            email
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
