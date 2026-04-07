import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        
        await prisma.naraWallet.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete wallet failed:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PATCH(request, { params }) {
    try {
        const { id } = await params;
        const { alias } = await request.json();
        
        const updatedWallet = await prisma.naraWallet.update({
            where: { id },
            data: { alias }
        });

        return NextResponse.json({ success: true, wallet: updatedWallet });
    } catch (error) {
        console.error('Update wallet failed:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
