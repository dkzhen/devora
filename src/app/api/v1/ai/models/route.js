import { NextResponse } from 'next/server';
import { trackApiHit } from '@/lib/monitoring';
import prisma from '@/lib/db';

// CORS headers for cross-origin requests
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
};

// Handle OPTIONS preflight request
export async function OPTIONS(req) {
    return NextResponse.json({}, { 
        status: 200,
        headers: corsHeaders
    });
}

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
            context_length: model.contextLength || 128000,
            // Pricing placeholder (can be extended in schema later)
            pricing: {
                prompt: "0",
                completion: "0"
            }
        }));

        return NextResponse.json({
            object: "list",
            data: formattedModels
        }, { headers: corsHeaders });

    } catch (error) {
        console.error('Models List Error:', error);
        return NextResponse.json({ 
            error: { 
                message: 'Internal server error while fetching models.', 
                type: 'server_error', 
                code: 500 
            } 
        }, { status: 500, headers: corsHeaders });
    }
}
