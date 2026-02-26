import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import prisma from '@/lib/db';
import SettingsForm from '@/components/SettingsForm';

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

            {/* Profile Card */}
            <section className="relative overflow-hidden rounded-2xl bg-[#0f172a] border border-white/8 p-6">
                <div className="flex items-start gap-5 mb-6">
                    {/* Avatar */}
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${roleGradient} flex items-center justify-center text-white font-black text-lg shadow-lg shrink-0`}>
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h2 className="text-xl font-black text-white">{user.name}</h2>
                            <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-lg border ${roleBadge}`}>
                                {user.role}
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm mt-0.5">{user.email}</p>
                        <p className="text-gray-700 text-xs mt-1">Member since {memberSince}</p>
                    </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                        { label: 'Full Name', value: user.name, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
                        { label: 'Email Address', value: user.email, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
                        { label: 'Member Since', value: memberSince, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
                    ].map((item) => (
                        <div key={item.label} className="p-4 rounded-xl bg-white/3 border border-white/5">
                            <div className="flex items-center gap-2 text-gray-600 mb-2">
                                {item.icon}
                                <span className="text-[10px] uppercase tracking-widest font-bold">{item.label}</span>
                            </div>
                            <div className="text-sm font-semibold text-white truncate">{item.value}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* API Configuration */}
            <SettingsForm
                initialData={user}
                callbackUrlDev={process.env.CALLBACK_URL_DEV}
                callbackUrlProd={process.env.CALLBACK_URL_PROD}
            />
        </div>
    );
}
