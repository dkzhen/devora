import { trackApiHit } from '@/lib/monitoring';
import { NextResponse } from 'next/server';
import { verifyApiKey, recordApiKeyUsage } from '@/lib/auth';
import prisma from '@/lib/db';

const API_BASE = 'https://api.mail.tm';

export async function GET(req, { params }) {
    const auth = await verifyApiKey(req);
    if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });

    const { id } = await params;
    trackApiHit(req);

    try {
        const account = await prisma.tempMailAccount.findUnique({
            where: { id: id, userId: auth.user.id },
            select: { id: true, address: true, createdAt: true, password: true, token: true }
        });

        if (!account) {
            return new Response(JSON.stringify({ error: 'Account not found or unauthorized' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Encoding': 'identity' }
            });
        }

        return new Response(JSON.stringify(account), {
            status: 200,
            headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Encoding': 'identity' }
        });
    } catch (error) {
        console.error('v1 Account Detail Error:', error);
        await recordApiKeyUsage(auth.apiKeyId, `/api/v1/temp-mail/accounts/${id}`, 'GET', 500);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Encoding': 'identity' }
        });
    }
}

export async function DELETE(req, { params }) {
    const auth = await verifyApiKey(req);
    if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });

    const { id } = await params;
    trackApiHit(req);

    try {
        const account = await prisma.tempMailAccount.findUnique({
            where: { id: id, userId: auth.user.id },
            select: { token: true }
        });

        if (!account) {
            return new Response(JSON.stringify({ error: 'Account not found or unauthorized' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Encoding': 'identity' }
            });
        }

        // 1. Delete from Mail.tm
        try {
            await fetch(`${API_BASE}/accounts/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${account.token}`,
                    'Accept': 'application/ld+json'
                }
            });
        } catch (e) { console.error("Mail.tm delete fail:", e); }

        // 2. Delete from DB
        await prisma.tempMailAccount.delete({ where: { id: id } });

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Encoding': 'identity' }
        });
    } catch (error) {
        console.error('v1 Account Delete Error:', error);
        await recordApiKeyUsage(auth.apiKeyId, `/api/v1/temp-mail/accounts/${id}`, 'DELETE', 500);
        return new Response(JSON.stringify({ error: 'Failed to delete account' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Encoding': 'identity' }
        });
    }
}
