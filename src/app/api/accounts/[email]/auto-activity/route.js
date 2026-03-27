import { trackApiHit } from '@/lib/monitoring';
import prisma from '@/lib/db';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

async function getAuthenticatedUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return null;

    try {
        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secretKey);
        return await prisma.user.findUnique({ where: { id: payload.sub } });
    } catch (e) {
        console.error('getAuthenticatedUser error:', e);
        return null;
    }
}

export async function POST(request, { params }) {
    trackApiHit(request);
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const resolvedParams = await params;
        const email = decodeURIComponent(resolvedParams.email);
        const { enabled, targetEmail } = await request.json();

        // Ensure the account belongs to the user
        const account = await prisma.account.findFirst({
            where: { email, userId: user.id }
        });

        if (!account) {
            return NextResponse.json({ error: 'Account not found' }, { status: 404 });
        }

        let nextAutoActivityAt = account.nextAutoActivityAt;

        // Schedule new run if enabled and no activity scheduled
        if (enabled && !nextAutoActivityAt) {
            const daysToAdd = Math.floor(Math.random() * 7) + 1; // 1 to 7 days
            nextAutoActivityAt = new Date();
            nextAutoActivityAt.setDate(nextAutoActivityAt.getDate() + daysToAdd);
        } else if (!enabled) {
            nextAutoActivityAt = null;
        }

        const updated = await prisma.account.update({
            where: { email },
            data: {
                autoActivityEnabled: enabled,
                autoActivityTarget: enabled ? targetEmail : null,
                nextAutoActivityAt
            }
        });

        return NextResponse.json({ success: true, account: updated });
    } catch (error) {
        console.error('API Auto Activity POST Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
