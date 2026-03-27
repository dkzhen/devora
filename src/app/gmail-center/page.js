'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AccountList from "@/components/AccountList";
import StatCard from "@/components/StatCard";
import { HeroHeader, LoadingState } from "@/components/HeroHeader";

function EmailListContent() {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState(null);
    const searchParams = useSearchParams();
    const router = useRouter();

    const loadAccounts = async () => {
        try {
            const res = await fetch('/api/accounts');
            if (res.ok) {
                const data = await res.json();
                setAccounts(data);
            }
        } catch (error) {
            console.error('Failed to load accounts', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Check role first
        const checkRole = async () => {
            try {
                const res = await fetch('/api/auth/me', { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    // Check maintenance (skip for ULTRA admins)
                    if (data.user?.role !== 'ULTRA') {
                        const mRes = await fetch('/api/maintenance', { cache: 'no-store' });
                        if (mRes.ok) {
                            const configs = await mRes.json();
                            const cfg = configs.find(c => c.feature === 'gmail-center');
                            if (cfg?.enabled) {
                                router.push(`/maintenance?feature=gmail-center&message=${encodeURIComponent(cfg.message || '')}`);
                                return;
                            }
                        }
                    }
                    if (data.user?.role === 'MEMBER') {
                        router.push('/upgrade');
                        return;
                    }
                    loadAccounts();
                } else {
                    // Not logged in
                    router.push('/login');
                }
            } catch (error) {
                console.error('Role check failed', error);
            }
        };

        checkRole();

        // Check for auth params
        const success = searchParams.get('success');
        const error = searchParams.get('error');
        const email = searchParams.get('email');

        if (success === 'true') {
            setNotification({
                type: 'success',
                message: email ? `Successfully connected account: ${decodeURIComponent(email)}` : 'Account connected successfully'
            });
            // Clean up URL
            router.replace('/gmail-center');
        } else if (error) {
            setNotification({
                type: 'error',
                message: error === 'auth_failed' ? 'Authentication failed. Please try again.' : `Error: ${error}`
            });
            router.replace('/gmail-center');
        }

        if (success || error) {
            const timer = setTimeout(() => setNotification(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [searchParams, router]);

    const formatNumber = (num) => {
        if (num >= 1000000000) {
            return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
        }
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        }
        return num.toString();
    };

    const stats = {
        totalAccounts: accounts.length,
        activeSessions: accounts.filter(a => a.status === 'active').length,
        totalMessages: accounts.reduce((acc, curr) => acc + (parseInt(curr.totalMessages) || 0), 0),
        totalThreads: accounts.reduce((acc, curr) => acc + (parseInt(curr.totalThreads) || 0), 0),
        issues: accounts.filter(a => a.status === 'invalid').length
    };

    return (
        <div className="space-y-6 relative">
            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border transition-all ${notification.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-emerald-900/30'
                    : 'bg-red-500/10 border-red-500/30 text-red-400 shadow-red-900/20'
                    }`}>
                    {notification.type === 'success' ? (
                        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    ) : (
                        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    )}
                    <div>
                        <h4 className="font-bold text-sm">{notification.type === 'success' ? 'Success' : 'Error'}</h4>
                        <p className="text-sm opacity-80">{notification.message}</p>
                    </div>
                    <button onClick={() => setNotification(null)} className="ml-2 hover:bg-white/10 rounded-lg p-1 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            )}

            {/* ── Page Header ── */}
            <HeroHeader
                colorTheme="unicorn"
                title="Gmail"
                badge="Center"
                description="Manage your connected Gmail accounts securely in a high-performance workspace."
                breadcrumbs={[
                    { label: 'Dashboard', href: '/' },
                    { label: 'Gmail Center' }
                ]}
            />

            {loading ? (
                <div className="py-24">
                    <LoadingState message="Connecting to Gmail servers..." colorTheme="unicorn" />
                </div>
            ) : (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        <StatCard
                            title="Total Accounts"
                            value={formatNumber(stats.totalAccounts)}
                            color="unicorn_cyan"
                            flat={true}
                            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                        />
                        <StatCard
                            title="Active Sessions"
                            value={formatNumber(stats.activeSessions)}
                            color="unicorn_yellow"
                            flat={true}
                            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        />
                        <StatCard
                            title="Total Messages"
                            value={formatNumber(stats.totalMessages)}
                            color="unicorn_pink"
                            flat={true}
                            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                        />
                        <StatCard
                            title="Total Threads"
                            value={formatNumber(stats.totalThreads)}
                            color="unicorn_cyan"
                            flat={true}
                            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
                        />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 mt-2 mb-4">
                        <h2 className=" text-md md:text-lg font-black tracking-widest text-[#f0acf7] uppercase flex items-center gap-2">
                            <svg className="w-5 h-5 text-[#acf7f0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            Connected Accounts
                        </h2>
                        <a
                            href="/auth/google"
                            className="shrink-0 flex items-center gap-2 px-4 py-2 bg-black/40 hover:bg-[#acf7f0]/10 text-[#acf7f0] rounded-none text-xs font-black uppercase tracking-widest transition-all active:scale-95 border-2 border-[#acf7f0]/50 hover:border-[#f0acf7]"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                            <span>Add Account</span>
                        </a>
                    </div>

                    {/* Account List */}
                    <AccountList
                        accounts={accounts}
                        loading={loading}
                        onRefresh={loadAccounts}
                        setAccounts={setAccounts}
                        setNotification={setNotification}
                        flat={true}
                    />
                </>
            )}
        </div>
    );
}

export default function EmailList() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
            <EmailListContent />
        </Suspense>
    );
}
