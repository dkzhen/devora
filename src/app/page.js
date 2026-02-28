'use client';

import { useState, useEffect } from 'react';
import DashboardStatCard from '@/components/DashboardStatCard';
import AirdropActivity from '@/components/AirdropActivity';
import TokenUsageCard from '@/components/TokenUsageCard';
import GmailActivityCard from '@/components/GmailActivityCard';
import DriveInsightsCard from '@/components/DriveInsightsCard';

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

    // Calculate total request flow from apiStats hits
    const endpointStats = stats?.apiStats || [];
    const totalRequestFlow = endpointStats.reduce((sum, item) => sum + (item.hitCount || 0), 0);

    // Formatter for large numbers (K, M, B)
    const formatNumber = (num) => {
        return new Intl.NumberFormat('en-US', {
            notation: 'compact',
            maximumFractionDigits: 1
        }).format(num);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-xs text-gray-500 animate-pulse">Initializing monitoring platform…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Professional Header Section - Sleek Airdrops/App Library Theme */}
            {/* Desktop Header */}
            <div className="hidden md:block relative overflow-hidden rounded-2xl mb-6">
                <div className="absolute inset-0 bg-linear-to-br from-gray-900 via-[#0d1b3e] to-gray-900" />
                <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-16 -left-8 w-56 h-56 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.2) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

                <div className="relative z-10 p-8 flex items-end justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse" />
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">System Monitoring</span>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight">
                            <span className="text-white">Overall </span>
                            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 via-indigo-400 to-cyan-400">Dashboard</span>
                        </h1>
                        <p className="text-gray-400 mt-2 text-sm leading-relaxed max-w-xl">
                            Real-time analytics and management for your accounts, messages, and automation.
                        </p>
                    </div>

                    <div className="flex items-center self-start md:self-auto shrink-0">
                        <div className="flex items-center gap-4 px-5 py-2.5 bg-black/20 border border-white/5 rounded-2xl backdrop-blur-md relative overflow-hidden">
                            <div className="absolute inset-0 bg-blue-500/5 mix-blend-overlay pointer-events-none" />
                            <div className="flex flex-col items-end relative z-10">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Refresh Rate</span>
                                <span className="text-sm font-black text-white">Real-time / 24h</span>
                            </div>
                            <div className="w-px h-8 bg-white/10 relative z-10" />
                            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 relative z-10">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Header */}
            <div className="md:hidden relative overflow-hidden rounded-2xl mb-2">
                <div className="absolute inset-0 bg-linear-to-br from-gray-900 via-[#0d1b3e] to-gray-900" />
                <div className="absolute -top-8 -left-8 w-52 h-52 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-12 right-0 w-44 h-44 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
                <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                <div className="relative z-10 p-5 pt-4">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse" />
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">Monitoring</span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight leading-none">
                            Overall <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-indigo-400">Dashboard</span>
                        </h1>
                        <p className="text-gray-400 text-xs mt-1.5 leading-relaxed">System activity analytics</p>
                    </div>
                </div>
            </div>

            {/* Row 1 — Global KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <DashboardStatCard
                    title="Total Accounts"
                    value={summary.totalAccounts || 0}
                    color="blue"
                    iconType="blue"
                />
                <DashboardStatCard
                    title="Request Flow"
                    value={formatNumber(totalRequestFlow)}
                    color="green"
                    iconType="green"
                />
                <DashboardStatCard
                    title="Total Apps"
                    value="24"
                    color="purple"
                    iconType="purple"
                />
            </div>

            {/* Row 2 — Feature Preview Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                <AirdropActivity data={stats?.topAirdrops || []} />
                <TokenUsageCard data={stats?.tokenUsage || []} />
                <GmailActivityCard data={stats?.gmailActivity || []} />
                <DriveInsightsCard data={stats?.driveInsights} />
            </div>

            {/* System Grid Overlay (Global) */}
            <div className="fixed inset-0 pointer-events-none z-[-1] opacity-[0.02]"
                style={{ backgroundImage: 'linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            />
        </div>
    );
}
