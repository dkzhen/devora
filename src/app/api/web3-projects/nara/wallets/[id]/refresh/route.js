import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { decrypt } from '@/lib/encryption';

const NARA_API_BASE = 'http://157.173.124.46:5888';
const NARA_BEARER = process.env.NARA_BEARER || 'ws_zhen_9527';

export async function POST(request, { params }) {
    try {
        const { id } = await params;
        
        const wallet = await prisma.naraWallet.findUnique({
            where: { id }
        });

        if (!wallet) {
            return NextResponse.json({ success: false, error: 'Wallet not found' }, { status: 404 });
        }

        // Decrypt the PK
        const pkRaw = decrypt(wallet.encryptedPk);
        const pkArray = JSON.parse(pkRaw);

        // Fetch new balance
        const apiRes = await fetch(`${NARA_API_BASE}/nara/check-balance`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${NARA_BEARER}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ key: pkArray })
        });
        
        const apiData = await apiRes.json();
        
        if (!apiData.address) {
            return NextResponse.json({ success: false, error: 'API failed to return wallet data' }, { status: 500 });
        }

        // Update database
        const updated = await prisma.naraWallet.update({
            where: { id },
            data: {
                address: apiData.address,
                lastBalance: apiData.balance?.toString(),
                lastUnit: apiData.unit,
                explorerUrl: apiData.explorer_url
            }
        });

        return NextResponse.json({ success: true, wallet: updated });
    } catch (error) {
        console.error('Refresh balance failed:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
