'use client';

import { useState, useEffect } from 'react';
import DashboardStatCard from '@/components/DashboardStatCard';
import AirdropActivity from '@/components/AirdropActivity';
import AirdropStatisticsCard from '@/components/AirdropStatisticsCard';
import TempMailStatisticsCard from '@/components/TempMailStatisticsCard';
import TempMailActivityCard from '@/components/TempMailActivityCard';
import TempMailProviderChart from '@/components/TempMailProviderChart';
import AppLibraryStatsCard from '@/components/AppLibraryStatsCard';
import AppStorageCard from '@/components/AppStorageCard';
import MostUpdatedAppsCard from '@/components/MostUpdatedAppsCard';
import { HeroHeader, LoadingState } from '@/components/HeroHeader';
import {
    DASHBOARD_ICONS,
    DASHBOARD_SECTIONS,
    GRID_LAYOUTS,
    LOADING_MESSAGES,
    API_ENDPOINTS,
    getKPICardColor,
    getFeatureCardColor,
    formatNumber,
    calculateTotalRequestFlow
} from '@/constants/dashboard.constants';

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [appLibraryStats, setAppLibraryStats] = useState(null);
    const [allAirdrops, setAllAirdrops] = useState([]);
    const [loading, setLoading] = useState(true);

    const kpiColor = getKPICardColor();
    const featureColor = getFeatureCardColor();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [monitoringRes, appLibraryRes, airdropsRes] = await Promise.all([
                    fetch(API_ENDPOINTS.MONITORING),
                    fetch(API_ENDPOINTS.APP_STATISTICS),
                    fetch('/api/airdrops')
                ]);

                if (monitoringRes.ok) {
                    const data = await monitoringRes.json();
                    setStats(data);
                }

                if (appLibraryRes.ok) {
                    const data = await appLibraryRes.json();
                    if (data.success) {
                        setAppLibraryStats(data.statistics);
                    }
                }

                if (airdropsRes.ok) {
                    const airdropsData = await airdropsRes.json();
                    setAllAirdrops(airdropsData);
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
    const totalRequestFlow = calculateTotalRequestFlow(stats?.apiStats);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <HeroHeader
                breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }]}
                title={DASHBOARD_SECTIONS.HERO.title}
                badge={DASHBOARD_SECTIONS.HERO.badge}
                description={DASHBOARD_SECTIONS.HERO.description}
            />

            {loading ? (
                <div className="py-12">
                    <LoadingState message={LOADING_MESSAGES.INITIALIZING} />
                </div>
            ) : (
                <>
                    {/* Row 1 — Global KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DashboardStatCard
                            title="Connected Accounts"
                            value={summary.totalAccounts || 0}
                            color={kpiColor}
                            imageIcon={DASHBOARD_ICONS.ACCOUNTS}
                        />
                        <DashboardStatCard
                            title="Total Request Flow"
                            value={formatNumber(totalRequestFlow)}
                            color={kpiColor}
                            imageIcon={DASHBOARD_ICONS.API}
                        />
                    </div>

                    {/* Row 2 — Temp Mail Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-6 bg-gradient-to-b from-cyan-500 via-cyan-600 to-blue-600 rounded-full" />
                            <h2 className="text-sm font-bold text-white uppercase tracking-wide">
                                Temp Mail Service
                            </h2>
                        </div>
                        
                        {/* First Row: Statistics */}
                        <TempMailStatisticsCard 
                            emailsGenerated={stats?.tempMailStats?.emailsGenerated || 0}
                            messagesReceived={stats?.tempMailStats?.messagesReceived || 0}
                            activeAccounts={stats?.tempMailStats?.activeAccounts || 0}
                        />

                        {/* Second Row: Provider Chart + Recent Activity */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <TempMailProviderChart allEmails={stats?.tempMailStats?.recentEmails || []} />
                            <TempMailActivityCard recentEmails={(stats?.tempMailStats?.recentEmails || []).slice(0, 5)} />
                        </div>
                    </div>

                    {/* Row 3 — Airdrop Projects Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-6 bg-gradient-to-b from-purple-500 via-purple-600 to-purple-700 rounded-full" />
                            <h2 className="text-sm font-bold text-white uppercase tracking-wide">
                                Airdrop Projects
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <AirdropActivity data={stats?.topAirdrops || []} total={stats?.totalAirdrops || 0} color="purple" />
                            <AirdropStatisticsCard data={allAirdrops} />
                        </div>
                    </div>

                    {/* Row 4 — App Library Statistics */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className={`w-1 h-6 bg-gradient-to-b ${DASHBOARD_SECTIONS.APP_LIBRARY.gradient} rounded-full`} />
                            <h2 className="text-sm font-bold text-white uppercase tracking-wide">
                                {DASHBOARD_SECTIONS.APP_LIBRARY.title}
                            </h2>
                        </div>
                        <div className={GRID_LAYOUTS.APP_LIBRARY}>
                            <AppLibraryStatsCard data={appLibraryStats} />
                            <AppStorageCard data={appLibraryStats} />
                            <MostUpdatedAppsCard data={appLibraryStats} />
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
