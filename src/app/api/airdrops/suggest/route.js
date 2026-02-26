import { trackApiHit } from '@/lib/monitoring';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(request) {
    trackApiHit(request);
    try {
        const body = await request.json();
        const { name, link, description, sender } = body;

        if (!name || !link) {
            return NextResponse.json({ error: 'Name and link are required' }, { status: 400 });
        }

        const suggestion = await prisma.suggestedProject.create({
            data: {
                name,
                link,
                description,
                sender: sender || 'Anonymous',
            }
        });

        return NextResponse.json(suggestion, { status: 201 });
    } catch (error) {
        console.error('Error suggesting project:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(request) {
    trackApiHit(request);
    try {
        const suggestions = await prisma.suggestedProject.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(suggestions);
    } catch (error) {
        console.error('Failed to fetch suggestions:', error);
        return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 });
    }
}
