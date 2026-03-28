import { trackApiHit } from '@/lib/monitoring';
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    trackApiHit(request);
    
    const auth = await verifyAuth(request);
    
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    return NextResponse.json({ user: auth.user });
}

