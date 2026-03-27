import { trackApiHit } from '@/lib/monitoring';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import prisma from '@/lib/db';
import { cookies } from 'next/headers';

const API_BASE = 'https://api.mail.tm';

export async function POST(req) {
    trackApiHit(req);
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
                // Determine userId from auth_token cookie
                let userId = null;
                const cookieStore = await cookies();
                const token = cookieStore.get('auth_token')?.value;
                if (token) {
                    try {
                        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
                        const { payload } = await jwtVerify(token, secret);
                        userId = payload.sub;
                    } catch (e) {
                        console.error("JWT verification failed in Temp Mail accounts API", e);
                    }
                }

                await prisma.tempMailAccount.create({
                    data: {
                        id: data.id,
                        address: data.address,
                        password: password,
                        userId: userId
                    }
                });

                // Increment generated emails count
                await prisma.tempMailStats.upsert({
                    where: { id: 1 },
                    update: { emailsGenerated: { increment: 1 } },
                    create: { id: 1, emailsGenerated: 1 }
                });
            } catch (dbErr) {
                console.error('Failed to save temp mail account or update stats in DB', dbErr);
            }
        }

        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error('Accounts API Error:', error);
        return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }
}

export async function DELETE(req) {
    trackApiHit(req);
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        let authHeader = req.headers.get('authorization');

        if (!id) {
            return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
        }

        // 1. Try to authorize via user session if no mail.tm token provided
        if (!authHeader) {
            const cookieStore = await cookies();
            const sessionToken = cookieStore.get('auth_token')?.value;
            if (sessionToken) {
                try {
                    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
                    const { payload } = await jwtVerify(sessionToken, secret);
                    const userId = payload.sub;

                    // Verify ownership
                    const account = await prisma.tempMailAccount.findUnique({
                        where: { id: id, userId: userId },
                        select: { token: true }
                    });

                    if (account) {
                        authHeader = `Bearer ${account.token}`;
                    }
                } catch (e) {
                    console.error("User auth failed in DELETE account", e);
                }
            }
        }

        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
