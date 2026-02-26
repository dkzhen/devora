import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { jwtVerify } from 'jose';

// Standardized Prisma Import & Error Fix
export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        const token = request.cookies.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');
        const { payload } = await jwtVerify(token, secret);

        // Fetch fresh user data from DB to check role
        const user = await prisma.user.findUnique({
            where: { id: payload.sub },
            select: { role: true }
        });

        if (!user || user.role !== 'ULTRA') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Delete the suggestion
        await prisma.suggestedProject.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Suggestion deleted successfully' });
    } catch (error) {
        console.error('Failed to delete suggestion:', error);
        return NextResponse.json({ error: 'Failed to delete suggestion' }, { status: 500 });
    }
}
