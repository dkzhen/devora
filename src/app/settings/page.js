import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import prisma from '@/lib/db';
import SettingsForm from '@/components/SettingsForm';
import ProfileCard from '@/components/ProfileCard';
import { HeroHeader, LoadingState } from '@/components/HeroHeader';

export const dynamic = 'force-dynamic';

const ROLE_COLORS = {
    ULTRA: 'from-purple-500 to-pink-500',
    PRO: 'from-blue-500 to-indigo-500',
    MEMBER: 'from-gray-500 to-gray-600',
};
const ROLE_BADGE = {
    ULTRA: 'text-purple-300 bg-purple-500/10 border-purple-500/20',
    PRO: 'text-blue-300 bg-blue-500/10 border-blue-500/20',
    MEMBER: 'text-gray-300 bg-gray-500/10 border-gray-500/20',
};

async function SettingsContent({ userId }) {
    let user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) redirect('/login');
    if (user.role === 'MEMBER') redirect('/');

    if (user.role !== 'ULTRA') {
        const maintenance = await prisma.maintenanceConfig.findUnique({
            where: { feature: 'settings' }
        });
        if (maintenance?.enabled) {
            redirect(`/maintenance?feature=settings&message=${encodeURIComponent(maintenance.message || '')}`);
        }
    }

    if (user?.googleClientId && user?.googleClientSecret) {
        const { decrypt } = await import('@/lib/crypto');
        try {
            user.googleClientId = user.googleClientId.includes(':') ? decrypt(user.googleClientId) : user.googleClientId;
            user.googleClientSecret = user.googleClientSecret.includes(':') ? decrypt(user.googleClientSecret) : user.googleClientSecret;
        } catch (e) {
            console.error('Decryption failed', e);
        }
    }

    const roleGradient = ROLE_COLORS[user.role] || ROLE_COLORS.MEMBER;
    const roleBadge = ROLE_BADGE[user.role] || ROLE_BADGE.MEMBER;
    const memberSince = new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

    return (
        <>
            <ProfileCard
                user={user}
                initials={initials}
                roleBadge={roleBadge}
                roleGradient={roleGradient}
                memberSince={memberSince}
            />

            {/* API Configuration */}
            <SettingsForm
                initialData={user}
                callbackUrlDev={process.env.CALLBACK_URL_DEV}
                callbackUrlProd={process.env.CALLBACK_URL_PROD}
            />
        </>
    );
}

export default async function SettingsPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) redirect('/login');

    let userId;
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        userId = payload.sub;
    } catch {
        redirect('/login');
    }

    return (
        <div className="space-y-6">
            <HeroHeader
                colorTheme="settings"
                breadcrumbs={[
                    { label: 'DASHBOARD', href: '/' },
                    { label: 'SETTINGS' }
                ]}
                title="Account"
                badge="Settings"
                description="Manage your profile, credentials, and preferences."
                icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
            />

            <Suspense fallback={<LoadingState message="Connecting to Settings Server..." colorTheme="settings" />}>
                <SettingsContent userId={userId} />
            </Suspense>
        </div>
    );
}
