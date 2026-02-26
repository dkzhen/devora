import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import prisma from '@/lib/db';
import RecentMessages from "@/components/RecentMessages";

export const dynamic = 'force-dynamic';

async function getAccounts(userId) {
    try {
        return await prisma.account.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    } catch { return []; }
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

    const accounts = await getAccounts(userId);

    return (
        <div className="space-y-6">
            {/* ===== HERO HEADER ===== */}
            <div className="relative overflow-hidden rounded-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-[#0d1b3e] to-gray-900" />
                <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.2) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
                <div className="relative z-10 p-5 md:p-8">
                    <nav className="flex text-xs text-blue-300/60 mb-3 items-center gap-2">
                        <a href="/" className="flex items-center gap-1 hover:text-blue-300 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                            Dashboard
                        </a>
                        <svg className="w-3 h-3 text-blue-400/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        <span className="text-blue-200 font-semibold">Mail Control</span>
                    </nav>
                    <h1 className="text-2xl md:text-4xl font-black tracking-tight">
                        <span className="text-white">Mail </span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Control</span>
                    </h1>
                    <p className="text-gray-400 mt-1 text-xs md:text-sm">View latest emails from your connected accounts</p>
                </div>
            </div>

            <RecentMessages accounts={accounts} />
        </div>
    );
}
