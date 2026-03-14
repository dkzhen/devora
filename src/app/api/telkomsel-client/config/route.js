/**
 * POST /api/telkomsel-client/config  — Save manual token config
 * GET  /api/telkomsel-client/config  — Check if config exists (returns masked status)
 */

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
    } catch { return null; }
}

export async function POST(request) {
    trackApiHit(request);
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { xDevice, authorization, accessAuth, webMsisdn, hash, transactionId } = await request.json();

    const missing = [];
    if (!xDevice) missing.push('x-device');
    if (!authorization) missing.push('Authorization');
    if (!accessAuth) missing.push('AccessAuthorization');
    if (!webMsisdn) missing.push('web-msisdn');
    if (!hash) missing.push('HASH');
    if (!transactionId) missing.push('TRANSACTIONID');

    if (missing.length > 0) {
        return NextResponse.json({ error: `Missing fields: ${missing.join(', ')}` }, { status: 400 });
    }

    await prisma.telSession.upsert({
        where: { userId },
        update: {
            xDevice: encrypt(xDevice.trim()),
            authorization: encrypt(authorization.replace(/^Bearer\s+/i, '').trim()),
            accessAuth: encrypt(accessAuth.replace(/^Bearer\s+/i, '').trim()),
            webMsisdn: webMsisdn.trim(),
            hash: encrypt(hash.trim()),
            transactionId: transactionId.trim(),
        },
        create: {
            userId,
            xDevice: encrypt(xDevice.trim()),
            authorization: encrypt(authorization.replace(/^Bearer\s+/i, '').trim()),
            accessAuth: encrypt(accessAuth.replace(/^Bearer\s+/i, '').trim()),
            webMsisdn: webMsisdn.trim(),
            hash: encrypt(hash.trim()),
            transactionId: transactionId.trim(),
        },
    });

    return NextResponse.json({ success: true });
}

export async function GET(request) {
    trackApiHit(request);
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const row = await prisma.telSession.findUnique({
        where: { userId },
        select: { webMsisdn: true, transactionId: true, createdAt: true, updatedAt: true },
    });

    if (!row) return NextResponse.json({ config: null });

    return NextResponse.json({
        config: {
            webMsisdn: row.webMsisdn,
            transactionId: row.transactionId,
            savedAt: row.updatedAt,
        },
    });
}
