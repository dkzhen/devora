import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { encrypt, decrypt } from '@/lib/encryption';

const NARA_API_BASE = 'http://157.173.124.46:5888';
const NARA_BEARER = process.env.NARA_BEARER || 'ws_zhen_9527';

export async function GET(request) {
    try {
        // In a real app, get user from session/auth header
        // For this implementation, we expect a simple user_id in headers or query for demo, 
        // but typically it should come from secure session.
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
        }

        const wallets = await prisma.naraWallet.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ success: true, wallets });
    } catch (error) {
        console.error('Failed to fetch wallets:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch wallets' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { userId, pkArray, alias } = body;

        if (!userId || !pkArray || !Array.isArray(pkArray)) {
            return NextResponse.json({ success: false, error: 'User ID and PK Array are required' }, { status: 400 });
        }

        // Encrypt the PK array (stored as JSON string)
        const encryptedPk = encrypt(JSON.stringify(pkArray));

        // Initial fetch to get address and balance
        let address = null;
        let lastBalance = '0';
        let lastUnit = 'NARA';
        let explorerUrl = null;

        try {
            const apiRes = await fetch(`${NARA_API_BASE}/nara/check-balance`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${NARA_BEARER}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ key: pkArray })
            });
            const apiData = await apiRes.json();
            if (apiData.address) {
                address = apiData.address;
                lastBalance = apiData.balance;
                lastUnit = apiData.unit;
                explorerUrl = apiData.explorer_url;
            }
        } catch (apiError) {
            console.error('Failed initial balance fetch:', apiError);
            // We still save the wallet even if fetch fails
        }

        const wallet = await prisma.naraWallet.create({
            data: {
                userId,
                address,
                encryptedPk,
                alias,
                lastBalance,
                lastUnit,
                explorerUrl
            }
        });

        return NextResponse.json({ success: true, wallet });
    } catch (error) {
        console.error('Failed to create wallet:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
