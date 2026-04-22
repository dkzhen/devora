import { NextResponse } from 'next/server';
import { trackApiHit } from '@/lib/monitoring';
import prisma from '@/lib/db';

export async function GET(req) {
    // 1. Track hit in global stats (no auth required)
    trackApiHit(req, '/api/v1/ai/models');

    try {
        // 2. Fetch active models from database
        const models = await prisma.aiModel.findMany({
            where: {
                status: 'active',
                isRestricted: false
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // 3. Filter out private models (email-prefixed)
        const publicModels = models.filter(model => {
            if (model.id.includes('/')) {
                const prefix = model.id.split('/')[0];
                const isEmail = prefix.includes('@');
                return !isEmail; // Exclude email-prefixed models
            }
            return true;
        });

        // 4. Format response similar to OpenRouter/other providers
        const formattedModels = publicModels.map(model => ({
            id: model.id,
            name: model.name,
            created: model.created || Math.floor(new Date(model.createdAt).getTime() / 1000),
            object: "model",
            owned_by: model.ownedBy,
            // Context length placeholder (can be extended in schema later)
            context_length: 128000,
            // Pricing placeholder (can be extended in schema later)
            pricing: {
                prompt: "0",
                completion: "0"
            }
        }));

        return NextResponse.json({
            object: "list",
            data: formattedModels
        });

    } catch (error) {
        console.error('Models List Error:', error);
        return NextResponse.json({ 
            error: { 
                message: 'Internal server error while fetching models.', 
                type: 'server_error', 
                code: 500 
            } 
        }, { status: 500 });
    }
}
