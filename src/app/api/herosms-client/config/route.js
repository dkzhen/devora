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
    } catch (err) {
        return null;
    }
}

export async function GET(request) {
    trackApiHit(request);
    const userId = await getUserId(request);
    if (!userId) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { heroSmsApiKey: true }
        });

        if (!user || !user.heroSmsApiKey) {
            return NextResponse.json({ apiKey: null, isConfigured: false });
        }

        const decrypted = decrypt(user.heroSmsApiKey);
        // Mask the key: first 4 and last 4 visible
        const masked = decrypted.length > 8 
            ? `${decrypted.substring(0, 4)}••••••••${decrypted.substring(decrypted.length - 4)}`
            : '••••••••';

        return NextResponse.json({ 
            apiKey: masked, 
            isConfigured: true,
            provider: 'Hero SMS',
            site: 'hero-sms.pro'
        });
    } catch (error) {
        console.error('Get HeroSMS Client Config Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request) {
    trackApiHit(request);
    const userId = await getUserId(request);
    if (!userId) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { heroSmsApiKey: null }
        });

        return NextResponse.json({ success: true, message: 'API key destroyed successfully' });
    } catch (error) {
        console.error('Destroy HeroSMS Client Config Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    trackApiHit(request);
    const userId = await getUserId(request);
    if (!userId) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const { apiKey } = await request.json();
        if (!apiKey) {
            return NextResponse.json({ error: 'API key is required' }, { status: 400 });
        }

        const encrypted = encrypt(apiKey);

        await prisma.user.update({
            where: { id: userId },
            data: { heroSmsApiKey: encrypted }
        });

        return NextResponse.json({ success: true, message: 'API key saved successfully' });
    } catch (error) {
        console.error('Save HeroSMS Client Config Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
