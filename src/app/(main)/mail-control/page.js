import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import prisma from '@/lib/db';
import RecentMessages from "@/components/RecentMessages";
import { HeroHeader, LoadingState } from "@/components/HeroHeader";

export const dynamic = 'force-dynamic';

async function getAccounts(userId) {
    try {
        return await prisma.account.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    } catch { return []; }
}

async function MailContent({ userId }) {
    const accounts = await getAccounts(userId);
    return <RecentMessages accounts={accounts} />;
}

export default async function MessagesPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) redirect('/login');

    let user, userId;
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        userId = payload.sub;
        user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { role: true } });
    } catch { redirect('/login'); }

    if (!user || user.role === 'MEMBER') redirect('/upgrade');

    // Check maintenance for non-ULTRA users
    if (user.role !== 'ULTRA') {
        const mConfig = await prisma.maintenanceConfig.findUnique({
            where: { feature: 'mail-control' }
        });
        if (mConfig?.enabled) {
            redirect(`/maintenance?feature=mail-control&message=${encodeURIComponent(mConfig.message || '')}`);
        }
    }

    return (
        <div className="space-y-6">
            <HeroHeader
                
                breadcrumbs={[
                    { label: 'DASHBOARD', href: '/' },
                    { label: 'MAIL CONTROL' }
                ]}
                title="Mail"
                badge="Control"
                description="View latest emails from your connected accounts directly through the Gmail API."
                icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v10a2 2 0 002 2z" /></svg>}
            />

            <Suspense fallback={<LoadingState message="Connecting to Mail Server..."  />}>
                <MailContent userId={userId} />
            </Suspense>
        </div>
    );
}
