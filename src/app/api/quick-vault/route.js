import { trackApiHit } from '@/lib/monitoring';
import prisma from '@/lib/db';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { encrypt, decrypt } from '@/lib/encryption';

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

// GET all Quick Vault items for the authenticated user
export async function GET(request) {
    trackApiHit(request);

    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
        }

        const items = await prisma.quickVaultItem.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        });

        // Decrypt the values before sending to the client
        const decryptedItems = items.map(item => ({
            ...item,
            value: decrypt(item.value)
        }));

        return NextResponse.json({ success: true, items: decryptedItems });
    } catch (error) {
        console.error('Quick Vault GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch vault items' }, { status: 500 });
    }
}

// POST a new Quick Vault item
export async function POST(request) {
    trackApiHit(request);

    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
        }

        const body = await request.json();
        const { category, label, value } = body;

        if (!category || !label || !value) {
            return NextResponse.json({ error: 'Category, label, and value are required' }, { status: 400 });
        }

        // Encrypt the value before storing it in the database
        const encryptedValue = encrypt(value);

        const newItem = await prisma.quickVaultItem.create({
            data: {
                userId: user.id,
                category,
                label,
                value: encryptedValue
            }
        });

        // Decrypt immediately for the response so the frontend has the usable text
        return NextResponse.json({
            success: true,
            item: { ...newItem, value: decrypt(newItem.value) }
        });
    } catch (error) {
        console.error('Quick Vault POST Error:', error);
        return NextResponse.json({ error: 'Failed to add item to vault' }, { status: 500 });
    }
}
