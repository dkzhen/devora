'use client';

import { useState, useEffect } from 'react';
import DashboardCharts from '@/components/DashboardCharts';
import StatCard from '@/components/StatCard';

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/monitoring');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error('Failed to fetch stats', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const summary = stats?.summary || {};
    const requestsByStatus = stats?.requestsByStatus || [];
    const activeAccounts = requestsByStatus.find(s => s.name === 'Active Accounts')?.value || 0;
    const inactiveAccounts = requestsByStatus.find(s => s.name === 'Inactive Accounts')?.value || 0;

    return (
        <div className="space-y-6">
            {/* Hero Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d1b3e] via-[#0a1628] to-[#080d1a] border border-white/8 p-6 md:p-8">
                {/* Background orbs */}
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full bg-indigo-500/8 blur-3xl pointer-events-none" />
                {/* Grid overlay */}
                <div className="absolute inset-0 opacity-[0.03] rounded-2xl" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        {/* Breadcrumb */}
                        <nav className="flex items-center gap-1.5 text-xs text-gray-600 mb-3">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                            <span className="text-blue-400 font-medium">Dashboard</span>
                        </nav>
                        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-1">
                            Dashboard{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Overview</span>
                        </h1>
                        <p className="text-gray-500 text-sm">Real-time monitoring of your accounts and messages.</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/8 rounded-xl text-xs text-gray-400 shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Last 24 Hours
                    </div>
                </div>
            </div>

            {/* Summary Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Accounts"
                    value={loading ? "—" : summary.totalAccounts || 0}
                    color="blue"
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                />
                <StatCard
                    title="Active Sessions"
                    value={loading ? "—" : activeAccounts}
                    color="green"
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                <StatCard
                    title="Total Messages"
                    value={loading ? "—" : (summary.totalMessages || 0).toLocaleString()}
                    color="purple"
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                />
                <StatCard
                    title="Issues"
                    value={loading ? "—" : inactiveAccounts}
                    color="orange"
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
            </div>

            <DashboardCharts data={stats} />

            {/* System Stats Info — dark themed */}
            <div className="rounded-2xl bg-[#0f172a] border border-white/8 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    </div>
                    <h3 className="text-sm font-bold text-white">Internal System Statistics</h3>
                </div>
                <p className="text-gray-600 text-xs mb-4">Charts above display statistics calculated directly from your local database.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-500">
                    {[
                        'Messages Received (Traffic)',
                        'Total Messages per Connected Account',
                        'Account Status (Active vs Auth Needed)',
                        'Real-time Database Counts',
                    ].map((item) => (
                        <div key={item} className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-blue-500/60 shrink-0" />
                            {item}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
