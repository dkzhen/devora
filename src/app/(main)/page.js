'use client';

import { useState, useEffect } from 'react';
import DashboardStatCard from '@/components/DashboardStatCard';
import AirdropActivity from '@/components/AirdropActivity';
import TokenUsageCard from '@/components/TokenUsageCard';
import GmailActivityCard from '@/components/GmailActivityCard';
import DriveInsightsCard from '@/components/DriveInsightsCard';
import AiUsageMonitoring from '@/components/AiUsageMonitoring';
import { HeroHeader, LoadingState } from '@/components/HeroHeader';

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // Daily theme randomization (same for all 3 cards)
    const cardColors = ['blue', 'indigo', 'green', 'purple', 'orange'];
    const dailyColor = cardColors[new Date().getDate() % cardColors.length];

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

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <HeroHeader

                breadcrumbs={[
                    { label: 'Dashboard', href: '/' },

                ]}
                title="Dashboard"
                badge="Overview"
                description="Get a real-time snapshot of your activity, performance, and automation."
            />

            {loading ? (
                <div className="py-12">
                    <LoadingState message="Initializing monitoring platform..." />
                </div>
            ) : (
                <>
                    {/* Row 1 — Global KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <DashboardStatCard
                            title="Connected Accounts"
                            value={summary.totalAccounts || 0}
                            color={dailyColor}
                            imageIcon="/icons/dashbooard/google.png"
                        />
                        <DashboardStatCard
                            title="Total Request Flow"
                            value={formatNumber(totalRequestFlow)}
                            color={dailyColor}
                            imageIcon="/icons/dashbooard/api.png"

                        />
                        <DashboardStatCard
                            title="Temp Mail Records"
                            value={`${stats?.tempMailStats?.emailsGenerated || 0} / ${stats?.tempMailStats?.messagesReceived || 0}`}
                            color={dailyColor}
                            imageIcon="/icons/dashbooard/email.png"
                            subtitle="Emails / Messages"
                        />
                    </div>

                    {/* Row 2 — Feature Preview Sections */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                        <AirdropActivity data={stats?.topAirdrops || []} total={stats?.totalAirdrops || 0} color="purple" />
                        <TokenUsageCard data={stats?.tokenUsage || []} color="purple" />
                        <GmailActivityCard data={stats?.gmailActivity || []} color="purple" />
                        <DriveInsightsCard data={stats?.driveInsights} />
                    </div>

                    {/* Row 3 — AI Cluster Runtime ( relocated to bottom ) */}
                    <div className="pt-8 border-t border-white/5">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.6)]" />
                            <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em]">AI Cluster Runtime</h2>
                            <div className="h-px flex-1 bg-white/5 ml-4" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AiUsageMonitoring />
                        </div>
                    </div>
                </>
            )}

            {/* System Grid Overlay (Global) */}
            <div className="fixed inset-0 pointer-events-none z-[-1]"
                style={{
                    backgroundImage: 'linear-gradient(rgba(139,92,246,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.02) 1px, transparent 1px)',
                    backgroundSize: '28px 28px'
                }}
            />

        </div>
    );
}
