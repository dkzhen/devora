'use client';

import { ExternalLink, Zap } from 'lucide-react';
import Link from 'next/link';

const THEME = {
    bg: 'from-[#0a0e1a] to-[#07090f]',
    border: 'border-amber-500/20',
    glow: 'shadow-[0_0_15px_rgba(245,158,11,0.05)]',
    accentLine: 'via-amber-500/50',
    bracketStrong: 'border-amber-500/40',
    bracketWeak: 'border-amber-500/15',
    headerIcon: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    headerBorder: 'border-amber-500/10',
    subtext: 'text-amber-400/60',
    linkBtn: 'border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)]',
    footerBorder: 'border-amber-500/10',
    statBg: 'bg-amber-500/5',
    statBorder: 'border-amber-500/20',
    statText: 'text-amber-400'
};

export default function AiTokenUsageCard({ data = {} }) {
    const { totalTokens = 0, promptTokens = 0, completionTokens = 0, totalRequests = 0, modelBreakdown = [] } = data;
    
    // Get max requests for scaling
    const maxRequests = Math.max(...modelBreakdown.map(m => m.requests), 1);

    return (
        <div className={`relative overflow-hidden rounded-lg bg-linear-to-b ${THEME.bg} border ${THEME.border} p-6 flex flex-col h-full group ${THEME.glow}`}>
            {/* Top neon accent */}
            <div className={`absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent ${THEME.accentLine} to-transparent pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity`} />

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
                        <Zap className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-white tracking-widest uppercase">AI Token Usage</h3>
                        <p className={`text-[10px] font-bold ${THEME.subtext} uppercase tracking-widest mt-0.5`}>Global Statistics</p>
                    </div>
                </div>
                <Link href="/api-key" className={`p-1.5 rounded-md border ${THEME.linkBtn}`}>
                    <ExternalLink className="w-4 h-4" />
                </Link>
            </div>

            {/* Main Stats */}
            <div className="flex-1 flex flex-col gap-4 relative z-10">
                {/* Total Tokens - Large Display */}
                <div className={`${THEME.statBg} border ${THEME.statBorder} rounded-lg p-4 text-center`}>
                    <div className="text-4xl font-black text-white mb-1">
                        {totalTokens.toLocaleString()}
                    </div>
                    <div className={`text-[10px] font-bold ${THEME.subtext} uppercase tracking-widest`}>
                        Total Tokens Spent
                    </div>
                </div>

                {/* Breakdown Grid */}
                <div className="grid grid-cols-3 gap-2">
                    <div className={`${THEME.statBg} border ${THEME.statBorder} rounded-lg p-3 text-center`}>
                        <div className={`text-[9px] font-bold ${THEME.subtext} uppercase tracking-wider mb-1`}>
                            Requests
                        </div>
                        <div className={`text-lg font-black ${THEME.statText}`}>
                            {totalRequests.toLocaleString()}
                        </div>
                    </div>
                    <div className={`${THEME.statBg} border ${THEME.statBorder} rounded-lg p-3 text-center`}>
                        <div className={`text-[9px] font-bold ${THEME.subtext} uppercase tracking-wider mb-1`}>
                            Input
                        </div>
                        <div className={`text-lg font-black ${THEME.statText}`}>
                            {promptTokens.toLocaleString()}
                        </div>
                    </div>
                    <div className={`${THEME.statBg} border ${THEME.statBorder} rounded-lg p-3 text-center`}>
                        <div className={`text-[9px] font-bold ${THEME.subtext} uppercase tracking-wider mb-1`}>
                            Output
                        </div>
                        <div className={`text-lg font-black ${THEME.statText}`}>
                            {completionTokens.toLocaleString()}
                        </div>
                    </div>
                </div>

                {/* Model Breakdown Chart */}
                {modelBreakdown.length > 0 && (
                    <div className={`border-t ${THEME.footerBorder} pt-4`}>
                        <h4 className={`text-[9px] font-bold ${THEME.subtext} uppercase tracking-wider mb-3`}>
                            Requests per Model
                        </h4>
                        <div className="space-y-2">
                            {modelBreakdown.slice(0, 5).map((item, idx) => (
                                <div key={item.model} className="flex items-center gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-mono text-white truncate">
                                                {item.model}
                                            </span>
                                            <span className={`text-[10px] font-black ${THEME.statText} ml-2`}>
                                                {item.requests}
                                            </span>
                                        </div>
                                        <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full bg-linear-to-r from-amber-500 to-amber-600 rounded-full transition-all`}
                                                style={{ width: `${(item.requests / maxRequests) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Average per request */}
                {totalRequests > 0 && (
                    <div className={`border-t ${THEME.footerBorder} pt-3 ${modelBreakdown.length === 0 ? 'mt-auto' : ''}`}>
                        <div className="flex items-center justify-between text-xs">
                            <span className={`font-bold ${THEME.subtext} uppercase tracking-wider`}>
                                Avg per Request
                            </span>
                            <span className="font-black text-white">
                                {Math.round(totalTokens / totalRequests).toLocaleString()} tokens
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
