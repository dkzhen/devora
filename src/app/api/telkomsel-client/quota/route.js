/**
 * POST /api/telkomsel-client/quota
 * Fetches quota/bonus info from Telkomsel API.
 * Mirrors Go's CheckQuota.
 */

import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import prisma from '@/lib/db';
import { decrypt } from '@/lib/encryption';
import { doPost } from '@/lib/telkomsel-client';
import { trackApiHit } from '@/lib/monitoring';

async function getUserId(request) {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return null;
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return payload.sub;
    } catch { return null; }
}

export async function GET(request) {
    trackApiHit(request);
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const row = await prisma.telSession.findUnique({ where: { userId } });
    if (!row) {
        return NextResponse.json({ error: 'Not logged in to MyTelkomsel' }, { status: 401 });
    }

    const session = {
        xDevice: decrypt(row.xDevice),
        authorization: decrypt(row.authorization),
        accessAuth: decrypt(row.accessAuth),
        webMsisdn: row.webMsisdn,
        hash: decrypt(row.hash),
        transactionId: row.transactionId,
    };

    try {
        const resp = await doPost('/api/subscriber/v5/bonuses', session, {
            isPrepaid: true,
            location: '',
            roaming: false,
        });

        if (resp.status !== '00000') {
            if (resp.message?.toLowerCase().includes('unauthorized')) {
                return NextResponse.json({ error: 'SESSION_EXPIRED' }, { status: 401 });
            }
            throw new Error(resp.message || 'Quota API error');
        }

        // Transform to clean format — mirrors Go's QuotaInfo struct
        const groups = (resp.data?.userBonuses || []).map(bonus => ({
            class: bonus.class || '',
            total: bonus.totalText || '',
            totalRecord: bonus.totalRecord || 0,
            items: (bonus.bonusList || []).map(item => ({
                name: item.name || item.bucketdescription || '',
                remaining: item.remainingquota || '',
                expiry: item.expirydate || '',
            })),
        }));

        return NextResponse.json({ groups });

    } catch (err) {
        console.error('[Telkomsel Client Quota]', err);
        if (err.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'SESSION_EXPIRED' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Failed to fetch quota: ' + err.message }, { status: 500 });
    }
}
