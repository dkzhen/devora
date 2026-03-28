import { trackApiHit } from '@/lib/monitoring';
import { NextResponse } from 'next/server';
import { verifyApiKey, recordApiKeyUsage } from '@/lib/auth';
import { randomBytes } from 'crypto';
import prisma from '@/lib/db';

const API_BASE = 'https://api.mail.tm';

export async function POST(req) {
    // 1. Verify API Key
    const auth = await verifyApiKey(req);
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { user, apiKeyId } = auth;

    // 2. Track hit in global stats (optional, but requested to follow original logic)
    trackApiHit(req);

    try {
        let { address, password } = await req.json().catch(() => ({}));

        // Auto-generate if missing
        if (!address) {
            const domainRes = await fetch(`${API_BASE}/domains?page=1`);
            const domainData = await domainRes.json();
            const domains = Array.isArray(domainData) ? domainData : (domainData['hydra:member'] || []);
            if (domains.length === 0) throw new Error('No domains available');
            const domain = domains[0].domain;
            const randomPrefix = randomBytes(4).toString('hex');
            address = `devora_${randomPrefix}@${domain}`;
        }

        if (!password) {
            password = randomBytes(8).toString('hex');
        }

        const res = await fetch(`${API_BASE}/accounts`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Accept-Encoding': 'identity'
            },
            body: JSON.stringify({ address, password })
        });

        const data = await res.json();
        if (res.ok) {
            // Get token immediately
            const tokenRes = await fetch(`${API_BASE}/token`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Accept-Encoding': 'identity'
                },
                body: JSON.stringify({ address, password })
            });
            const tokenData = await tokenRes.json();
            const token = tokenData.token;

            // Save to DB
            const account = await prisma.tempMailAccount.create({
                data: {
                    id: data.id,
                    address: address,
                    password: password,
                    token: token,
                    userId: auth.user.id
                }
            });

            // Increment generated emails count
            try {
                await prisma.tempMailStats.upsert({
                    where: { id: 1 },
                    update: { emailsGenerated: { increment: 1 } },
                    create: { id: 1, emailsGenerated: 1 }
                });
            } catch (statsErr) { console.error("v1 Stats update err:", statsErr); }

            await recordApiKeyUsage(auth.apiKeyId, '/api/v1/temp-mail/accounts', 'POST', 201);
            return new Response(JSON.stringify({
                success: true,
                account: {
                    id: account.id,
                    address: account.address,
                    password: account.password,
                    createdAt: account.createdAt,
                    token: account.token
                }
            }), {
                status: 201,
                headers: { 
                    'Content-Type': 'application/json; charset=utf-8',
                    'Content-Encoding': 'identity'
                }
            });
        }

        await recordApiKeyUsage(auth.apiKeyId, '/api/v1/temp-mail/accounts', 'POST', res.status);
        return new Response(JSON.stringify(data), {
            status: res.status,
            headers: { 
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Encoding': 'identity'
            }
        });
    } catch (error) {
        console.error('v1 Accounts API Error:', error);
        await recordApiKeyUsage(apiKeyId, '/api/v1/temp-mail/accounts', 'POST', 500);
        return new Response(JSON.stringify({ error: 'Failed to create account' }), {
            status: 500,
            headers: { 
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Encoding': 'identity'
            }
        });
    }
}

export async function GET(req) {
    const auth = await verifyApiKey(req);
    if (!auth.success) {
        return new Response(JSON.stringify({ error: auth.error }), {
            status: 401,
            headers: { 
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Encoding': 'identity'
            }
        });
    }

    trackApiHit(req);

    try {
        const accounts = await prisma.tempMailAccount.findMany({
            where: { userId: auth.user.id },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                address: true,
                createdAt: true
            }
        });

        await recordApiKeyUsage(auth.apiKeyId, '/api/v1/temp-mail/accounts', 'GET', 200);
        return new Response(JSON.stringify({ accounts }), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Encoding': 'identity'
            }
        });
    } catch (error) {
        console.error('v1 Accounts List Error:', error);
        await recordApiKeyUsage(auth.apiKeyId, '/api/v1/temp-mail/accounts', 'GET', 500);
        return new Response(JSON.stringify({ error: 'Failed to list accounts' }), {
            status: 500,
            headers: { 
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Encoding': 'identity'
            }
        });
    }
}
