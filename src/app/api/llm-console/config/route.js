import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import prisma from '@/lib/db';
import { encrypt, decrypt } from '@/lib/encryption';
import { trackApiHit } from '@/lib/monitoring';

export const dynamic = 'force-dynamic';

async function getUserId(request) {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return null;
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return payload.sub;
    } catch {
        return null;
    }
}

export async function GET(request) {
    trackApiHit(request);
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    try {
        const record = await prisma.llmConsole.findUnique({ where: { userId } });
        if (!record) return NextResponse.json({ isConfigured: false });

        const decryptedKey = decrypt(record.apiKey);

        // ?raw=true → return actual key (for copy to clipboard)
        const { searchParams } = new URL(request.url);
        if (searchParams.get('raw') === 'true') {
            return NextResponse.json({ apiKey: decryptedKey });
        }

        const masked = decryptedKey.length > 8
            ? `${decryptedKey.substring(0, 4)}••••••••${decryptedKey.substring(decryptedKey.length - 4)}`
            : '••••••••';

        return NextResponse.json({
            isConfigured: true,
            baseUrl: record.baseUrl,
            model: record.model,
            apiKey: masked,
        });
    } catch (error) {
        console.error('LLM Console GET config error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    trackApiHit(request);
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    try {
        const { baseUrl, model, apiKey } = await request.json();
        if (!baseUrl || !model || !apiKey) {
            return NextResponse.json({ error: 'baseUrl, model, and apiKey are required' }, { status: 400 });
        }

        const encryptedKey = encrypt(apiKey);

        await prisma.llmConsole.upsert({
            where: { userId },
            update: { baseUrl, model, apiKey: encryptedKey },
            create: { userId, baseUrl, model, apiKey: encryptedKey },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('LLM Console POST config error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request) {
    trackApiHit(request);
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    try {
        await prisma.llmConsole.deleteMany({ where: { userId } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('LLM Console DELETE config error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
