'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { ExternalLink, Mail } from 'lucide-react';
import Link from 'next/link';

// Formatter for large numbers (K, M, B)
const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1
    }).format(num);
};

const THEME = {
    emerald: {
        bg: 'from-[#071310] to-[#050a08]',
        border: 'border-emerald-500/20',
        glow: 'shadow-[0_0_15px_rgba(16,185,129,0.05)]',
        accentLine: 'via-emerald-500/50',
        bracketStrong: 'border-emerald-500/40',
        bracketWeak: 'border-emerald-500/15',
        headerIcon: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        headerBorder: 'border-emerald-500/10',
        subtext: 'text-emerald-400/60',
        linkBtn: 'border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]',
        footerBorder: 'border-emerald-500/10',
        footerLive: 'text-emerald-500'
    },
    purple: {
        bg: 'from-[#110a17] to-[#0a060e]',
        border: 'border-purple-500/20',
        glow: 'shadow-[0_0_15px_rgba(168,85,247,0.05)]',
        accentLine: 'via-purple-500/50',
        bracketStrong: 'border-purple-500/40',
        bracketWeak: 'border-purple-500/15',
        headerIcon: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
        headerBorder: 'border-purple-500/10',
        subtext: 'text-purple-400/60',
        linkBtn: 'border-purple-500/20 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.1)]',
        footerBorder: 'border-purple-500/10',
        footerLive: 'text-purple-500'
    }
};

export default function GmailActivityCard({ data = [], color = 'emerald' }) {
    const theme = THEME[color] || THEME.emerald;

    return (
        <div className={`relative overflow-hidden rounded-lg bg-linear-to-b ${theme.bg} border ${theme.border} p-6 flex flex-col h-full group ${theme.glow}`}>
            {/* Top neon accent */}
            <div className={`absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent ${theme.accentLine} to-transparent pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity`} />
            
            {/* Corner brackets */}
            <span className={`absolute top-2 left-2 w-3.5 h-3.5 border-t border-l ${theme.bracketStrong} pointer-events-none`} />
            <span className={`absolute top-2 right-2 w-3.5 h-3.5 border-t border-r ${theme.bracketStrong} pointer-events-none`} />
            <span className={`absolute bottom-2 left-2 w-3.5 h-3.5 border-b border-l ${theme.bracketWeak} pointer-events-none`} />
            <span className={`absolute bottom-2 right-2 w-3.5 h-3.5 border-b border-r ${theme.bracketWeak} pointer-events-none`} />

            {/* Gloss effect */}
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            {/* Header */}
            <div className={`relative z-10 flex items-center justify-between mb-6 border-b ${theme.headerBorder} pb-4`}>
                <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-md ${theme.headerIcon}`}>
                        <img src="/icons/dashbooard/gmail.png" alt="Gmail" className="w-4 h-4 object-contain brightness-0 invert opacity-80 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-white tracking-widest uppercase">Gmail Activity</h3>
                        <p className={`text-[10px] font-bold ${theme.subtext} uppercase tracking-widest mt-0.5`}>Messages vs Threads</p>
                    </div>
                </div>
                <Link href="/gmail-center" className={`p-1.5 rounded-md border ${theme.linkBtn}`} title="View Details">
                    <ExternalLink className="w-4 h-4" />
                </Link>
            </div>

            {/* Chart Area */}
            <div className="flex-1 min-h-[220px]">
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 600, dy: 10 }}
                            />
                            <YAxis
                                hide
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                itemStyle={{ color: '#fff' }}
                                contentStyle={{
                                    backgroundColor: '#0d121f',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                                    fontSize: '12px',
                                    color: '#fff'
                                }}
                            />
                            <Bar
                                dataKey="value"
                                radius={[6, 6, 0, 0]}
                                barSize={48}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                                ))}
                                <LabelList
                                    dataKey="value"
                                    position="top"
                                    formatter={formatNumber}
                                    style={{ fill: '#fff', fontSize: '13px', fontWeight: 'bold' }}
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                        <Mail className="w-10 h-10 mb-3 opacity-20" />
                        <p className="text-sm">No Gmail activity available</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className={`relative z-10 mt-4 pt-4 border-t ${theme.footerBorder} flex items-center justify-between text-[10px] uppercase font-bold tracking-widest ${theme.subtext} opacity-80`}>
                <span>Account Stats</span>
                <span className={theme.footerLive}>Real-time</span>
            </div>
        </div>
    );
}
