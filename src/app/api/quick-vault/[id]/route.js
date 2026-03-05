import { trackApiHit } from '@/lib/monitoring';
import prisma from '@/lib/db';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { encrypt } from '@/lib/encryption';

async function getAuthenticatedUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return null;

    try {
        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secretKey);
        return await prisma.user.findUnique({ where: { id: payload.sub } });
    } catch (e) {
        return null;
    }
}

// DELETE a Quick Vault item
export async function DELETE(request, { params }) {
    trackApiHit(request);

    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
        }

        const { id } = await params;

        // Verify the item belongs to the user before deleting
        const item = await prisma.quickVaultItem.findUnique({
            where: { id }
        });

        if (!item) {
            return NextResponse.json({ error: 'Vault item not found' }, { status: 404 });
        }

        if (item.userId !== user.id) {
            return NextResponse.json({ error: 'Forbidden. You do not own this item.' }, { status: 403 });
        }

        await prisma.quickVaultItem.delete({
            where: { id }
        });

        return NextResponse.json({ success: true, message: 'Item deleted' });
    } catch (error) {
        console.error('Quick Vault DELETE Error:', error);
        return NextResponse.json({ error: 'Failed to delete vault item' }, { status: 500 });
    }
}

// PUT (Update) a Quick Vault item
export async function PUT(request, { params }) {
    trackApiHit(request);

    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { category, label, value } = body;

        // Verify ownership
        const item = await prisma.quickVaultItem.findUnique({
            where: { id }
        });

        if (!item) {
            return NextResponse.json({ error: 'Vault item not found' }, { status: 404 });
        }

        if (item.userId !== user.id) {
            return NextResponse.json({ error: 'Forbidden. You do not own this item.' }, { status: 403 });
        }

        const updateData = {};
        if (category) updateData.category = category;
        if (label) updateData.label = label;
        if (value) updateData.value = encrypt(value);

        const updatedItem = await prisma.quickVaultItem.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json({ success: true, item: updatedItem });
    } catch (error) {
        console.error('Quick Vault PUT Error:', error);
        return NextResponse.json({ error: 'Failed to update vault item' }, { status: 500 });
    }
}
