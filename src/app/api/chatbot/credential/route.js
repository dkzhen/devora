import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import prisma from '@/lib/db';
import { encrypt, decrypt } from '@/lib/encryption';
import { trackApiHit } from '@/lib/monitoring';

const getUserId = async () => {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return payload.sub;
    } catch {
        return null;
    }
};

export async function GET(request) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await trackApiHit('/api/chatbot/credential');

        const cred = await prisma.groqCredential.findUnique({
            where: { userId }
        });

        if (!cred) {
            return NextResponse.json({ hasCredential: false });
        }

        const rawKey = decrypt(cred.apiKey);

        // Return usage stats and a masked key, alongside the rawKey for copying
        return NextResponse.json({
            hasCredential: true,
            maskedKey: `gsk_••••••••••••${rawKey.slice(-4)}`,
            rawKey: rawKey,
            usage: {
                promptTokens: cred.promptTokens,
                completionTokens: cred.completionTokens,
                totalTokens: cred.totalTokens
            }
        });
    } catch (error) {
        console.error("GET /api/chatbot/credential error:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await trackApiHit('/api/chatbot/credential');

        const body = await request.json();
        const { apiKey } = body;

        if (!apiKey || !apiKey.startsWith('gsk_')) {
            return NextResponse.json({ error: 'Invalid API Key format. Must start with gsk_' }, { status: 400 });
        }

        // 1. Test the API Key before saving
        const testRes = await fetch('https://api.groq.com/openai/v1/models', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        if (!testRes.ok) {
            const errData = await testRes.json();
            return NextResponse.json({ error: 'Failed to validate API Key: ' + (errData.error?.message || 'Unauthorized') }, { status: 400 });
        }

        // 2. Encrypt the valid key
        const encryptedKey = encrypt(apiKey);

        // 3. Save or update DB
        await prisma.groqCredential.upsert({
            where: { userId },
            update: {
                apiKey: encryptedKey
            },
            create: {
                userId,
                apiKey: encryptedKey
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("POST /api/chatbot/credential error:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await prisma.groqCredential.delete({
            where: { userId }
        }).catch(() => { }); // ignore error if none exists

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/chatbot/credential error:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
