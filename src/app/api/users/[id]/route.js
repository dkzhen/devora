import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

async function checkUltraAuth(request) {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return null;

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);

        const user = await prisma.user.findUnique({
            where: { id: payload.sub },
            select: { id: true, role: true }
        });

        if (!user || user.role !== 'ULTRA') return null;
        return user;
    } catch {
        return null;
    }
}

export async function PATCH(request, { params }) {
    try {
        const authUser = await checkUltraAuth(request);
        if (!authUser) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const userId = params.id;
        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const body = await request.json();
        const { role, name, password } = body; // You can also update name/password later if needed, but mainly for role

        const updateData = {};
        if (role) updateData.role = role;
        if (name) updateData.name = name;
        if (password) {
            const bcrypt = (await import('bcryptjs')).default;
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            }
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Update User Error:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const authUser = await checkUltraAuth(request);
        if (!authUser) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const userId = params.id;
        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Prevent deleting oneself
        if (userId === authUser.id) {
            return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
        }

        await prisma.user.delete({
            where: { id: userId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete User Error:', error);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}
