'use client';

import { TrendingUp, Target, CheckCircle2, Clock, DollarSign, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const THEME = {
    bg: 'from-[#0f0a15] to-[#0a060e]',
    border: 'border-purple-500/20',
    glow: 'shadow-[0_0_20px_rgba(168,85,247,0.08)]',
    accentLine: 'via-purple-500/60',
    bracketStrong: 'border-purple-500/50',
    bracketWeak: 'border-purple-500/15',
    headerIcon: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
    headerBorder: 'border-purple-500/10',
    subtext: 'text-purple-400/70',
    linkBtn: 'border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.15)]',
    footerBorder: 'border-purple-500/10',
};

export default function AirdropStatisticsCard({ data = [] }) {
    // Calculate statistics
    const totalProjects = data.length;
    const activeProjects = data.filter(a => a.status === 'New' || a.status === 'Potential').length;
    const confirmedProjects = data.filter(a => a.status === 'Confirmed').length;
    const completedTasks = data.reduce((sum, a) => sum + (a.tasks?.length || 0), 0);
    
    // Calculate average raised
    const projectsWithRaise = data.filter(a => a.raise && a.raise !== '$0');
    const avgRaised = projectsWithRaise.length > 0 
        ? projectsWithRaise.reduce((sum, a) => {
            const value = a.raise.replace(/[^0-9.MBK]/gi, '').toUpperCase();
            const num = parseFloat(value.replace(/[^0-9.]/g, ''));
            if (value.includes('B')) return sum + (num * 1000);
            if (value.includes('K')) return sum + (num / 1000);
            return sum + num;
        }, 0) / projectsWithRaise.length
        : 0;
    
    const formattedAvgRaised = avgRaised >= 1000 
        ? `$${(avgRaised / 1000).toFixed(1)}B` 
        : avgRaised > 0 
            ? `$${avgRaised.toFixed(1)}M` 
            : '$0';

    // Calculate completion rate (projects with confirmed status)
    const completionRate = totalProjects > 0 
        ? Math.round((confirmedProjects / totalProjects) * 100) 
        : 0;

    // Get most active category
    const categoryCount = {};
    data.forEach(a => {
        if (a.tasks && a.tasks.length > 0) {
            a.tasks.forEach(t => {
                const cat = t.category.toLowerCase();
                categoryCount[cat] = (categoryCount[cat] || 0) + 1;
            });
        }
    });
    const mostActiveCategory = Object.keys(categoryCount).length > 0
        ? Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0][0]
        : 'N/A';

    const stats = [
        {
            icon: Target,
            label: 'Active Projects',
            value: activeProjects,
            total: totalProjects,
            color: 'text-purple-400',
            bgColor: 'bg-purple-500/10',
            borderColor: 'border-purple-500/20',
        },
        {
            icon: CheckCircle2,
            label: 'Confirmed Drops',
            value: confirmedProjects,
            percentage: completionRate,
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-500/10',
            borderColor: 'border-emerald-500/20',
        },
        {
            icon: Clock,
            label: 'Total Tasks',
            value: completedTasks,
            subtext: 'Across all projects',
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10',
            borderColor: 'border-blue-500/20',
        },
        {
            icon: DollarSign,
            label: 'Avg. Raised',
            value: formattedAvgRaised,
            subtext: projectsWithRaise.length > 0 ? `${projectsWithRaise.length} projects` : 'No data',
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
                        <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-white tracking-widest uppercase">Airdrop Analytics</h3>
                        <p className={`text-[10px] font-bold ${THEME.subtext} uppercase tracking-widest mt-0.5`}>Performance Metrics</p>
                    </div>
                </div>
                <Link href="/airdrops" className={`p-1.5 rounded-md border ${THEME.linkBtn}`} title="View All">
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
                                {stat.total && (
                                    <span className="text-xs text-slate-600 font-medium">
                                        / {stat.total}
                                    </span>
                                )}
                                {stat.percentage !== undefined && (
                                    <span className="text-xs text-slate-600 font-medium">
                                        ({stat.percentage}%)
                                    </span>
                                )}
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

            {/* Most Active Category */}
            <div className="relative z-10 mt-4 pt-4 border-t border-purple-500/10">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Most Active Category
                        </p>
                        <p className="text-sm font-black text-purple-400 uppercase">
                            {mostActiveCategory}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Total Projects
                        </p>
                        <p className="text-sm font-black text-white">
                            {totalProjects}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
