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
        // Initialize all 24 hours with zero data
        const allHours = Array.from({ length: 24 }, (_, i) => ({
            hour: `${i.toString().padStart(2, '0')}:00`,
            requests: 0,
            tokens: 0
        }));

        if (recentHits && recentHits.length > 0) {
            // Group by hour
            recentHits.forEach(hit => {
                const date = new Date(hit.createdAt);
                const hour = date.getHours();
                
                allHours[hour].requests += 1;
                allHours[hour].tokens += Math.round(((hit.promptTokens || 0) + (hit.completionTokens || 0)) / 1000); // Convert to K
            });

            return allHours;
        }

        // Fallback to sample data with all 24 hours
        return allHours.map((h, i) => {
            // Add some sample data to specific hours
            if (i === 0) return { ...h, requests: 45, tokens: 125 };
            if (i === 4) return { ...h, requests: 32, tokens: 89 };
            if (i === 8) return { ...h, requests: 89, tokens: 280 };
            if (i === 12) return { ...h, requests: 125, tokens: 420 };
            if (i === 16) return { ...h, requests: 98, tokens: 350 };
            if (i === 20) return { ...h, requests: 67, tokens: 210 };
            return h;
        });
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
            <div className="flex-1 flex items-end gap-0.5 px-4 min-h-[280px] overflow-x-auto">
                {chartData.map((data, index) => {
                    const requestHeight = maxRequests > 0 ? (data.requests / maxRequests) * 100 : 0;
                    const tokenHeight = maxTokens > 0 ? (data.tokens / maxTokens) * 100 : 0;
                    const showLabel = index % 4 === 0; // Show label every 4 hours
                    
                    return (
                        <div key={index} className="flex-1 min-w-[20px] flex flex-col items-center gap-2">
                            {/* Bars Container */}
                            <div className="w-full flex gap-0.5 items-end h-48">
                                {/* Requests Bar */}
                                <div 
                                    className="flex-1 bg-emerald-500 rounded-t relative group cursor-pointer transition-all hover:bg-emerald-400"
                                    style={{ height: `${Math.max(requestHeight, 2)}%`, minHeight: data.requests > 0 ? '4px' : '0' }}
                                    title={`${data.hour} - ${data.requests} requests`}
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-900 text-emerald-400 text-[10px] px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none">
                                        {data.hour}<br/>{data.requests} req
                                    </div>
                                </div>
                                
                                {/* Tokens Bar */}
                                <div 
                                    className="flex-1 bg-blue-500 rounded-t relative group cursor-pointer transition-all hover:bg-blue-400"
                                    style={{ height: `${Math.max(tokenHeight, 2)}%`, minHeight: data.tokens > 0 ? '4px' : '0' }}
                                    title={`${data.hour} - ${data.tokens}K tokens`}
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-900 text-blue-400 text-[10px] px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none">
                                        {data.hour}<br/>{data.tokens}K tok
                                    </div>
                                </div>
                            </div>
                            
                            {/* Time Label - Show every 4 hours */}
                            {showLabel && (
                                <span className="text-[9px] text-slate-500 font-mono">{data.hour}</span>
                            )}
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
