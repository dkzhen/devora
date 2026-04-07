import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
    try {
        const aiProxyBase = process.env.AI_PROXY_URL || 'http://localhost:8317';
        const res = await fetch(`${aiProxyBase}/v1/models`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:148.0) Gecko/20100101 Firefox/148.0',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Authorization': 'Bearer Bandulan113',
                'Cookie': 'webui_auth=e779b1ea2cd3df69a15cfd9885d001feb07641291aeed5d7e38d26a6a83bc262',
                'Pragma': 'no-cache',
                'Cache-Control': 'no-cache',
            },
            cache: 'no-store',
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch models from VPS: ${res.status}`);
        }

        const data = await res.json();
        const externalModels = data.data || [];

        // Fetch persisted statuses and access info from DB
        const localModels = await prisma.aiModel.findMany({
            include: { allowedEmails: true }
        });
        
        const configMap = Object.fromEntries(localModels.map(m => [m.id, {
            status: m.status,
            isRestricted: m.isRestricted,
            allowedEmails: m.allowedEmails.map(a => a.email)
        }]));

        // Merge external models with local config
        const dataWithStatus = externalModels.map(model => ({
            ...model,
            status: configMap[model.id]?.status || 'active',
            isRestricted: configMap[model.id]?.isRestricted || false,
            allowedEmails: configMap[model.id]?.allowedEmails || []
        }));

        return NextResponse.json({ data: dataWithStatus });
    } catch (error) {
        console.error('Fetch Models Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
