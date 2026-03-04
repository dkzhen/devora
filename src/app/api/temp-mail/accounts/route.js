import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

const API_BASE = 'https://api.mail.tm';

export async function POST(req) {
    try {
        const body = await req.json();
        const { address, password } = body;

        if (!address || !password) {
            return NextResponse.json({ error: 'Address and password required' }, { status: 400 });
        }

        const res = await fetch(`${API_BASE}/accounts`, {
            method: 'POST',
            headers: {
                'Accept': 'application/ld+json',
                'Content-Type': 'application/ld+json'
            },
            body: JSON.stringify({ address, password })
        });

        const data = await res.json();

        if (res.ok && data.id) {
            try {
                await prisma.tempMailAccount.create({
                    data: {
                        id: data.id,
                        address: data.address,
                        password: password
                    }
                });
            } catch (dbErr) {
                console.error('Failed to save temp mail account to DB', dbErr);
            }
        }

        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error('Accounts API Error:', error);
        return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const authHeader = req.headers.get('authorization');
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!authHeader || !id) {
            return NextResponse.json({ error: 'Unauthorized or missing ID' }, { status: 400 });
        }

        // 1. Delete from Mail.tm (optional but good citizen)
        try {
            await fetch(`${API_BASE}/accounts/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': authHeader,
                    'Accept': 'application/ld+json'
                }
            });
        } catch (e) {
            console.error("Failed to delete from mail.tm", e);
        }

        // 2. Delete from DB (will cascade to TempMailMessage)
        try {
            await prisma.tempMailAccount.delete({
                where: { id: id }
            });
        } catch (e) {
            console.error("Failed to delete from DB", e);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Accounts DELETE API Error:', error);
        return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
    }
}
