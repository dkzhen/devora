import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
    try {
        // Fetch all models from database
        const models = await prisma.aiModel.findMany({
            include: { allowedEmails: true }
        });

        const dataWithStatus = models.map(model => ({
            id: model.id,
            name: model.name,
            owned_by: model.ownedBy,
            created: model.created,
            status: model.status,
            isRestricted: model.isRestricted,
            baseUrl: model.baseUrl,
            allowedEmails: model.allowedEmails.map(a => a.email)
        }));

        return NextResponse.json({ data: dataWithStatus });
    } catch (error) {
        console.error('Fetch Models Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { id, name, ownedBy, created, baseUrl } = body;

        if (!id || !name || !ownedBy) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if model already exists
        const existing = await prisma.aiModel.findUnique({ where: { id } });
        if (existing) {
            return NextResponse.json({ error: 'Model ID already exists' }, { status: 400 });
        }

        const model = await prisma.aiModel.create({
            data: {
                id,
                name,
                ownedBy,
                created: created || Math.floor(Date.now() / 1000),
                status: 'active',
                isRestricted: false,
                baseUrl: baseUrl || null
            }
        });

        return NextResponse.json({ success: true, data: model });
    } catch (error) {
        console.error('Create Model Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const modelId = searchParams.get('id');

        if (!modelId) {
            return NextResponse.json({ error: 'Model ID required' }, { status: 400 });
        }

        await prisma.aiModel.delete({
            where: { id: modelId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete Model Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, name, ownedBy, created, baseUrl } = body;

        if (!id) {
            return NextResponse.json({ error: 'Model ID required' }, { status: 400 });
        }

        const model = await prisma.aiModel.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(ownedBy && { ownedBy }),
                ...(created !== undefined && { created }),
                ...(baseUrl !== undefined && { baseUrl: baseUrl || null })
            }
        });

        return NextResponse.json({ success: true, data: model });
    } catch (error) {
        console.error('Update Model Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
