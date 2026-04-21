'use client';

import { Mail, Users, Inbox, TrendingUp, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const THEME = {
    bg: 'from-[#0a0e1a] to-[#07090f]',
    border: 'border-cyan-500/20',
    glow: 'shadow-[0_0_20px_rgba(6,182,212,0.08)]',
    accentLine: 'via-cyan-500/60',
    bracketStrong: 'border-cyan-500/50',
    bracketWeak: 'border-cyan-500/15',
    headerIcon: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
    headerBorder: 'border-cyan-500/10',
    subtext: 'text-cyan-400/70',
    linkBtn: 'border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.15)]',
};

export default function TempMailStatisticsCard({ emailsGenerated = 0, messagesReceived = 0, activeAccounts = 0 }) {
    // Calculate statistics
    const avgMessagesPerEmail = emailsGenerated > 0 
        ? (messagesReceived / emailsGenerated).toFixed(1) 
        : '0.0';
    
    // Calculate engagement rate (emails with at least 1 message)
    const engagementRate = emailsGenerated > 0 && messagesReceived > 0
        ? Math.min(100, Math.round((messagesReceived / emailsGenerated) * 100))
        : 0;

    const stats = [
        {
            icon: Mail,
            label: 'Emails Generated',
            value: emailsGenerated,
            subtext: 'Total addresses created',
            color: 'text-cyan-400',
            bgColor: 'bg-cyan-500/10',
            borderColor: 'border-cyan-500/20',
        },
        {
            icon: Inbox,
            label: 'Messages Received',
            value: messagesReceived,
            subtext: 'Across all inboxes',
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10',
            borderColor: 'border-blue-500/20',
        },
        {
            icon: Users,
            label: 'Active Accounts',
            value: activeAccounts,
            subtext: 'Currently in use',
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-500/10',
            borderColor: 'border-emerald-500/20',
        },
        {
            icon: TrendingUp,
            label: 'Avg. Messages',
            value: avgMessagesPerEmail,
            subtext: 'Per email address',
            color: 'text-purple-400',
            bgColor: 'bg-purple-500/10',
            borderColor: 'border-purple-500/20',
        },
    ];

    return (
        <div className={`relative overflow-hidden rounded-lg bg-linear-to-b ${THEME.bg} border ${THEME.border} p-6 flex flex-col h-full group ${THEME.glow}`}>
            {/* Top neon accent */}
            <div className={`absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent ${THEME.accentLine} to-transparent pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity`} />
            
            {/* Corner brackets */}
            <span className={`absolute top-2 left-2 w-3.5 h-3.5 border-t border-l ${THEME.bracketStrong} pointer-events-none`} />
            <span className={`absolute top-2 right-2 w-3.5 h-3.5 border-t border-r ${THEME.bracketStrong} pointer-events-none`} />
            <span className={`absolute bottom-2 left-2 w-3.5 h-3.5 border-b border-l ${THEME.bracketWeak} pointer-events-none`} />
            <span className={`absolute bottom-2 right-2 w-3.5 h-3.5 border-b border-r ${THEME.bracketWeak} pointer-events-none`} />

            {/* Gloss effect */}
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            {/* Header */}
            <div className={`relative z-10 flex items-center justify-between mb-6 border-b ${THEME.headerBorder} pb-4`}>
                <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-md ${THEME.headerIcon}`}>
                        <Mail className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-white tracking-widest uppercase">Temp Mail Analytics</h3>
                        <p className={`text-[10px] font-bold ${THEME.subtext} uppercase tracking-widest mt-0.5`}>Usage Statistics</p>
                    </div>
                </div>
                <Link href="/temp-mail" className={`p-1.5 rounded-md border ${THEME.linkBtn}`} title="View Temp Mail">
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
                            className={`relative p-4 rounded-lg border ${stat.borderColor} ${stat.bgColor} backdrop-blur-sm group/stat hover:scale-[1.02] transition-transform`}
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

                            {/* Glow effect on hover */}
                            <div className={`absolute inset-0 ${stat.bgColor} opacity-0 group-hover/stat:opacity-50 transition-opacity rounded-lg pointer-events-none`} />
                        </div>
                    );
                })}
            </div>

            {/* Engagement Rate */}
            <div className="relative z-10 mt-4 pt-4 border-t border-cyan-500/10">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Engagement Rate
                        </p>
                        <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                                    style={{ width: `${engagementRate}%` }}
                                />
                            </div>
                            <span className="text-sm font-black text-cyan-400">
                                {engagementRate}%
                            </span>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Provider
                        </p>
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">Mail.tm</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-xs font-bold text-white">MoeMail</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
