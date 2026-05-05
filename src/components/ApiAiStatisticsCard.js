'use client';

import { Activity, Zap, TrendingUp, Clock, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const THEME = {
    bg: 'from-[#0a0e1a] to-[#07090f]',
    border: 'border-emerald-500/20',
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.08)]',
    accentLine: 'via-emerald-500/60',
    bracketStrong: 'border-emerald-500/50',
    bracketWeak: 'border-emerald-500/15',
    headerIcon: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    headerBorder: 'border-emerald-500/10',
    subtext: 'text-emerald-400/70',
    linkBtn: 'border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]',
};

export default function ApiAiStatisticsCard({ 
    totalRequests = 0, 
    totalTokens = 0, 
    activeKeys = 0,
    avgResponseTime = 0 
}) {
    // Format numbers
    const formatNumber = (num) => {
        if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const stats = [
        {
            icon: Activity,
            label: 'Total Requests',
            value: formatNumber(totalRequests),
            subtext: 'API calls made',
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-500/10',
            borderColor: 'border-emerald-500/20',
        },
        {
            icon: Zap,
            label: 'AI Tokens Used',
            value: formatNumber(totalTokens),
            subtext: 'Across all models',
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10',
            borderColor: 'border-blue-500/20',
        },
        {
            icon: TrendingUp,
            label: 'Active API Keys',
            value: activeKeys,
            subtext: 'Currently in use',
            color: 'text-purple-400',
            bgColor: 'bg-purple-500/10',
            borderColor: 'border-purple-500/20',
        },
        {
            icon: Clock,
            label: 'Avg Response',
            value: `${avgResponseTime}ms`,
            subtext: 'API latency',
            color: 'text-cyan-400',
            bgColor: 'bg-cyan-500/10',
            borderColor: 'border-cyan-500/20',
        },
    ];

    return (
        <div className={`relative overflow-hidden rounded-lg bg-linear-to-b ${THEME.bg} border ${THEME.border} p-6 flex flex-col h-full ${THEME.glow}`}>
            {/* Top neon accent */}
            <div className={`absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent ${THEME.accentLine} to-transparent pointer-events-none opacity-60`} />
            
            {/* Corner brackets */}
            <span className={`absolute top-2 left-2 w-3.5 h-3.5 border-t border-l ${THEME.bracketStrong} pointer-events-none`} />
            <span className={`absolute top-2 right-2 w-3.5 h-3.5 border-t border-r ${THEME.bracketStrong} pointer-events-none`} />
            <span className={`absolute bottom-2 left-2 w-3.5 h-3.5 border-b border-l ${THEME.bracketWeak} pointer-events-none`} />
            <span className={`absolute bottom-2 right-2 w-3.5 h-3.5 border-b border-r ${THEME.bracketWeak} pointer-events-none`} />

            {/* Header */}
            <div className={`relative z-10 flex items-center justify-between mb-6 border-b ${THEME.headerBorder} pb-4`}>
                <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-md ${THEME.headerIcon}`}>
                        <Activity className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-white tracking-widest uppercase">API & AI Analytics</h3>
                        <p className={`text-[10px] font-bold ${THEME.subtext} uppercase tracking-widest mt-0.5`}>Usage Statistics</p>
                    </div>
                </div>
                <Link href="/api-key" className={`p-1.5 rounded-md border ${THEME.linkBtn}`} title="View API Keys">
                    <ExternalLink className="w-4 h-4" />
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="flex-1 grid grid-cols-2 gap-4">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={index}
                            className={`relative p-4 rounded-lg border ${stat.borderColor} ${stat.bgColor} backdrop-blur-sm`}
                        >
                            {/* Icon */}
                            <div className={`w-8 h-8 rounded-lg ${stat.bgColor} border ${stat.borderColor} flex items-center justify-center mb-3`}>
                                <Icon className={`w-4 h-4 ${stat.color}`} />
                            </div>

                            {/* Label */}
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                                {stat.label}
                            </p>

                            {/* Value */}
                            <div className="flex items-baseline gap-2">
                                <span className={`text-2xl font-black ${stat.color}`}>
                                    {stat.value}
                                </span>
                            </div>

                            {/* Subtext */}
                            {stat.subtext && (
                                <p className="text-[9px] text-slate-600 mt-1 font-medium">
                                    {stat.subtext}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="relative z-10 mt-4 pt-4 border-t border-emerald-500/10">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            System Status
                        </p>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                            <span className="text-sm font-black text-emerald-400">
                                Operational
                            </span>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Uptime
                        </p>
                        <span className="text-sm font-black text-white">
                            99.9%
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
