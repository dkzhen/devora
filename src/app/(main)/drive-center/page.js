import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import prisma from '@/lib/db';
import DriveExplorer from "@/components/DriveExplorer";
import { HeroHeader, LoadingState } from "@/components/HeroHeader";

export const dynamic = 'force-dynamic';

async function getAccounts(userId) {
    try {
        return await prisma.account.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    } catch { return []; }
}

async function DriveContent({ userId }) {
    const accounts = await getAccounts(userId);
    return <DriveExplorer accounts={accounts} />;
}

export default async function DriveCenterPage() {
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
            where: { feature: 'drive-center' }
        });
        if (mConfig?.enabled) {
            redirect(`/maintenance?feature=drive-center&message=${encodeURIComponent(mConfig.message || '')}`);
        }
    }

    return (
        <div className="space-y-6">
            <HeroHeader
                colorTheme="drive"
                breadcrumbs={[
                    { label: 'DASHBOARD', href: '/' },
                    { label: 'DRIVE CENTER' }
                ]}
                title="Drive"
                badge="Center"
                description="Manage and download files from your connected Google Drive accounts seamlessly via the Drive API."
                icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>}
            />

            <Suspense fallback={<LoadingState message="Accessing Drive API..." colorTheme="drive" />}>
                <DriveContent userId={userId} />
            </Suspense>
        </div>
    );
}
