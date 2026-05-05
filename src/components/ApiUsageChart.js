'use client';

import { BarChart3, ExternalLink } from 'lucide-react';
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

export default function ApiUsageChart({ recentHits = [] }) {
    // Process real data or use sample
    const processData = () => {
        if (recentHits && recentHits.length > 0) {
            // Group by hour
            const hourlyData = {};
            recentHits.forEach(hit => {
                const date = new Date(hit.createdAt);
                const hour = date.getHours();
                const timeKey = `${hour.toString().padStart(2, '0')}:00`;
                
                if (!hourlyData[timeKey]) {
                    hourlyData[timeKey] = { hour: timeKey, requests: 0, tokens: 0 };
                }
                hourlyData[timeKey].requests += 1;
                hourlyData[timeKey].tokens += Math.round(((hit.promptTokens || 0) + (hit.completionTokens || 0)) / 1000); // Convert to K
            });

            const result = Object.values(hourlyData).sort((a, b) => {
                const aHour = parseInt(a.hour.split(':')[0]);
                const bHour = parseInt(b.hour.split(':')[0]);
                return aHour - bHour;
            });

            if (result.length > 0) return result;
        }

        // Fallback to sample data
        return [
            { hour: '00:00', requests: 45, tokens: 125 },
            { hour: '04:00', requests: 32, tokens: 89 },
            { hour: '08:00', requests: 89, tokens: 280 },
            { hour: '12:00', requests: 125, tokens: 420 },
            { hour: '16:00', requests: 98, tokens: 350 },
            { hour: '20:00', requests: 67, tokens: 210 },
        ];
    };

    const chartData = processData();
    const isRealData = recentHits && recentHits.length > 0;
    const maxRequests = Math.max(...chartData.map(d => d.requests));
    const maxTokens = Math.max(...chartData.map(d => d.tokens));

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
                        <BarChart3 className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-white tracking-widest uppercase">API Usage Trends</h3>
                        <p className={`text-[10px] font-bold ${THEME.subtext} uppercase tracking-widest mt-0.5`}>Last 24 Hours</p>
                    </div>
                </div>
                <Link href="/api-key" className={`p-1.5 rounded-md border ${THEME.linkBtn}`} title="View Details">
                    <ExternalLink className="w-4 h-4" />
                </Link>
            </div>

            {/* Chart Area - Custom HTML/CSS Bars */}
            <div className="flex-1 flex items-end gap-4 px-4 min-h-[280px]">
                {chartData.map((data, index) => {
                    const requestHeight = (data.requests / maxRequests) * 100;
                    const tokenHeight = (data.tokens / maxTokens) * 100;
                    
                    return (
                        <div key={index} className="flex-1 flex flex-col items-center gap-2">
                            {/* Bars Container */}
                            <div className="w-full flex gap-1 items-end h-48">
                                {/* Requests Bar */}
                                <div 
                                    className="flex-1 bg-emerald-500 rounded-t relative group cursor-pointer"
                                    style={{ height: `${requestHeight}%` }}
                                    title={`${data.requests} requests`}
                                >
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-900 text-emerald-400 text-[10px] px-2 py-1 rounded whitespace-nowrap">
                                        {data.requests}
                                    </div>
                                </div>
                                
                                {/* Tokens Bar */}
                                <div 
                                    className="flex-1 bg-blue-500 rounded-t relative group cursor-pointer"
                                    style={{ height: `${tokenHeight}%` }}
                                    title={`${data.tokens}K tokens`}
                                >
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-900 text-blue-400 text-[10px] px-2 py-1 rounded whitespace-nowrap">
                                        {data.tokens}K
                                    </div>
                                </div>
                            </div>
                            
                            {/* Time Label */}
                            <span className="text-[10px] text-slate-500 font-mono">{data.hour}</span>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className={`relative z-10 mt-6 pt-4 border-t ${THEME.headerBorder} flex items-center justify-between text-[10px] uppercase font-bold tracking-widest ${THEME.subtext} opacity-80`}>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                        <span className="text-emerald-400">Requests</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-blue-500" />
                        <span className="text-blue-400">Tokens (K)</span>
                    </div>
                </div>
                <span className="text-emerald-500">{isRealData ? 'Real-time Data' : 'Sample Data'}</span>
            </div>
        </div>
    );
}
