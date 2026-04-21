import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import prisma from '@/lib/db';
import { trackApiHit } from '@/lib/monitoring';

export async function DELETE(request) {
    trackApiHit(request);
    try {
        const auth = await verifyAuth(request);
        if (!auth.success) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Only ULTRA users can access this endpoint
        if (auth.user.role !== 'ULTRA') {
            return NextResponse.json({ error: 'Forbidden - ULTRA role required' }, { status: 403 });
        }

        // Delete all API key usage records
        const result = await prisma.apiKeyUsage.deleteMany({});

        return NextResponse.json({ 
            success: true, 
            message: `Cleared ${result.count} usage records`,
            deletedCount: result.count
        });
    } catch (err) {
        console.error('DELETE /api/api-keys/admin/clear-usage error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
