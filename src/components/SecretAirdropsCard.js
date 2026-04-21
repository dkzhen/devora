'use client';

import { Lock, Eye, Clock, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import LoadingImage from './LoadingImage';

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
    footerVal: 'text-purple-400',
    footerLive: 'text-purple-500',
    cardBg: 'bg-[#0a0312]/60',
    cardBorder: 'border-purple-500/20',
    cardHover: 'hover:border-purple-500/40 hover:bg-[#0a0312]/80',
};

export default function SecretAirdropsCard({ data = [], total = 0 }) {
    // Filter untuk private dan pending airdrops
    const secretAirdrops = data.filter(airdrop => 
        !airdrop.isPublic || airdrop.publishStatus === 'PENDING'
    ).slice(0, 6); // Limit 6 items

    const privateCount = secretAirdrops.filter(a => !a.isPublic && a.publishStatus !== 'PENDING').length;
    const pendingCount = secretAirdrops.filter(a => a.publishStatus === 'PENDING').length;

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
                        <Lock className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-white tracking-widest uppercase">Secret Airdrops</h3>
                        <p className={`text-[10px] font-bold ${THEME.subtext} uppercase tracking-widest mt-0.5`}>Private & Pending Projects</p>
                    </div>
                </div>
                <Link href="/airdrops?filter=private" className={`p-1.5 rounded-md border ${THEME.linkBtn}`} title="View All">
                    <ExternalLink className="w-4 h-4" />
                </Link>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-[280px] overflow-y-auto custom-scrollbar pr-2">
                {secretAirdrops.length > 0 ? (
                    <div className="space-y-3">
                        {secretAirdrops.map((airdrop, index) => {
                            const isPending = airdrop.publishStatus === 'PENDING';
                            const isPrivate = !airdrop.isPublic && !isPending;

                            return (
                                <Link
                                    key={airdrop.id || index}
                                    href={`/airdrops/${airdrop.id}`}
                                    className={`block p-3 rounded-lg border ${THEME.cardBorder} ${THEME.cardBg} ${THEME.cardHover} transition-all group/card`}
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Icon */}
                                        <div className="w-10 h-10 rounded-lg bg-purple-900/20 border border-purple-500/20 flex items-center justify-center shrink-0 overflow-hidden group-hover/card:border-purple-500/40 transition-colors">
                                            <LoadingImage 
                                                src={airdrop.icon} 
                                                alt={airdrop.name} 
                                                className="w-8 h-8 object-contain" 
                                                fallback="/icons/digital-currency.png"
                                            />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="text-sm font-bold text-white truncate group-hover/card:text-purple-300 transition-colors">
                                                    {airdrop.name}
                                                </h4>
                                                {isPending ? (
                                                    <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 flex items-center gap-1">
                                                        <Clock className="w-2.5 h-2.5" />
                                                        PENDING
                                                    </span>
                                                ) : isPrivate ? (
                                                    <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                                                        <Lock className="w-2.5 h-2.5" />
                                                        PRIVATE
                                                    </span>
                                                ) : null}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <Eye className="w-3 h-3" />
                                                    {airdrop.tasks?.length || 0} tasks
                                                </span>
                                                {airdrop.status && (
                                                    <>
                                                        <span>•</span>
                                                        <span className={`${
                                                            airdrop.status === 'New' ? 'text-purple-400' :
                                                            airdrop.status === 'Confirmed' ? 'text-orange-400' :
                                                            'text-slate-400'
                                                        }`}>
                                                            {airdrop.status}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Arrow */}
                                        <div className="shrink-0 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                        <div className="w-16 h-16 rounded-full bg-purple-500/5 border border-purple-500/20 flex items-center justify-center mb-3">
                            <Lock className="w-8 h-8 opacity-30" />
                        </div>
                        <p className="text-sm font-medium">No secret airdrops</p>
                        <p className="text-xs text-slate-600 mt-1">All projects are public</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className={`relative z-10 mt-4 pt-4 border-t ${THEME.footerBorder} flex items-center justify-between text-[10px] uppercase font-bold tracking-widest ${THEME.subtext} opacity-80`}>
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5">
                        <Lock className="w-3 h-3" />
                        Private: <span className={THEME.footerVal}>{privateCount}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        Pending: <span className="text-yellow-400">{pendingCount}</span>
                    </span>
                </div>
                <span className={THEME.footerLive}>Live</span>
            </div>
        </div>
    );
}
