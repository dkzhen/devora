/**
 * GET /api/telkomsel-client/profile
 * Fetches profile + balance + loyalty info from Telkomsel API.
 * Mirrors Go's GetFullProfile.
 */

import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import prisma from '@/lib/db';
import { decrypt } from '@/lib/encryption';
import { doGet } from '@/lib/telkomsel-client';
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
        // Fetch profile
        const profileResp = await doGet('/api/attributes/getprofile', session);
        if (profileResp.status !== '00000') {
            if (profileResp.status === '00008' || profileResp.message?.toLowerCase().includes('unauthorized')) {
                return NextResponse.json({ error: 'SESSION_EXPIRED' }, { status: 401 });
            }
            throw new Error(profileResp.message || 'Profile API error');
        }

        const pd = profileResp.data;
        const firstName = pd?.ciam?.givenName || pd?.name?.firstName || '';
        const lastName = pd?.ciam?.sn || pd?.name?.surrName || '';
        const name = [firstName, lastName].filter(Boolean).join(' ') || 'Unknown';
        const email = pd?.email?.email || '';
        const accountStatus = pd?.ciam?.accountStatus || pd?.ciam?.status || 'Unknown';

        // Fetch balance
        let balance = '0', expiryDate = '';
        try {
            const balResp = await doGet('/api/subscriber/profile-balance', session);
            if (balResp.status === '00000') {
                balance = balResp.data?.balance || '0';
                expiryDate = balResp.data?.expiry_date || '';
            }
        } catch (e) { console.error('Balance err:', e.message); }

        // Fetch loyalty
        let loyaltyPoints = '', loyaltyTier = '';
        try {
            const loyResp = await doGet('/api/subscriber/loyalty-info', session);
            if (loyResp.status === '00000') {
                loyaltyPoints = loyResp.data?.profiles?.loyalty_points || '';
                loyaltyTier = loyResp.data?.profiles?.loyalty_points_category || '';
            }
        } catch { }

        return NextResponse.json({
            name,
            email,
            phone: session.webMsisdn,
            accountStatus,
            balance,
            expiryDate,
            loyaltyPoints,
            loyaltyTier,
        });

    } catch (err) {
        console.error('[Telkomsel Client Profile]', err);
        if (err.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'SESSION_EXPIRED' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Failed to fetch profile: ' + err.message }, { status: 500 });
    }
}
