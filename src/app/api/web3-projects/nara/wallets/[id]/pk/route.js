import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { decrypt } from '@/lib/encryption';

export async function GET(request, { params }) {
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

        return NextResponse.json({ success: true, pkArray });
    } catch (error) {
        console.error('Fetch PK failed:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
