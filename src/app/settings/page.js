import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import prisma from '@/lib/db';
import SettingsForm from '@/components/SettingsForm';

import ProfileCard from '@/components/ProfileCard';

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

export default async function SettingsPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) redirect('/login');

    let user;
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);

        user = await prisma.user.findUnique({ where: { id: payload.sub } });

        if (user?.googleClientId && user?.googleClientSecret) {
            const { decrypt } = await import('@/lib/crypto');
            try {
                user.googleClientId = user.googleClientId.includes(':') ? decrypt(user.googleClientId) : user.googleClientId;
                user.googleClientSecret = user.googleClientSecret.includes(':') ? decrypt(user.googleClientSecret) : user.googleClientSecret;
            } catch (e) {
                console.error('Decryption failed', e);
            }
        }
    } catch {
        redirect('/login');
    }

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

    const roleGradient = ROLE_COLORS[user.role] || ROLE_COLORS.MEMBER;
    const roleBadge = ROLE_BADGE[user.role] || ROLE_BADGE.MEMBER;
    const memberSince = new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

    return (
        <div className="space-y-6">
            {/* Hero Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d1b3e] via-[#0a1628] to-[#080d1a] border border-white/8 p-6 md:p-8">
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-blue-600/8 blur-3xl pointer-events-none" />
                <div className="absolute inset-0 opacity-[0.03] rounded-2xl" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

                <div className="relative z-10">
                    <nav className="flex items-center gap-1.5 text-xs text-gray-600 mb-3">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                        <a href="/" className="hover:text-blue-400 transition-colors">Dashboard</a>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        <span className="text-blue-400 font-medium">Settings</span>
                    </nav>
                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-1">
                        Account{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Settings</span>
                    </h1>
                    <p className="text-gray-500 text-sm">Manage your profile, credentials and preferences.</p>
                </div>
            </div>

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
        </div>
    );
}
