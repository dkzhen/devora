/**
 * GET /api/telkomsel-client/offers
 * Fetches filtered offers from Telkomsel API.
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

async function getDecryptedSession(userId) {
    const row = await prisma.telSession.findUnique({ where: { userId } });
    if (!row) return null;
    return {
        xDevice: decrypt(row.xDevice),
        authorization: decrypt(row.authorization),
        accessAuth: decrypt(row.accessAuth),
        webMsisdn: row.webMsisdn,
        hash: decrypt(row.hash),
        transactionId: row.transactionId,
    };
}

export async function GET(request) {
    trackApiHit(request);
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = await getDecryptedSession(userId);
    if (!session) {
        return NextResponse.json({ error: 'Not logged in to MyTelkomsel' }, { status: 401 });
    }

    try {
        // Fetch filtered offers based on type
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'internet';

        const payload = {
            html: false,
            isGrouping: true,
            filteredby: type === 'voice_sms' ? "boid|ML2_BP_18" : "boid|ML2_BP_11",
            isPrepaid: true,
            groupByFlashDeals: true,
            offersversion: "WEB-V7"
        };

        const resp = await doPost('/api/offers/filtered-offers/v7', session, payload);

        if (resp.status !== '00000') {
            if (resp.message?.toLowerCase().includes('unauthorized')) {
                return NextResponse.json({ error: 'SESSION_EXPIRED' }, { status: 401 });
            }
            throw new Error(resp.message || 'Offers API error');
        }

        // Return the clean data
        return NextResponse.json(resp.data);

    } catch (err) {
        console.error('[Telkomsel Client Offers]', err);
        if (err.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'SESSION_EXPIRED' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Failed to fetch offers: ' + err.message }, { status: 500 });
    }
}
