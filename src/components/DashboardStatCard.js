'use client';

import { Users, Zap, MessageSquare, AlertCircle } from 'lucide-react';

const THEME = {
    blue: {
        bg: 'from-[#0a0e1a] to-[#07090f]',
        border: 'border-blue-500/15',
        glow: 'shadow-[0_0_20px_rgba(59,130,246,0.04)]',
        accentLine: 'via-blue-500/40',
        bracketStrong: 'border-blue-500/30',
        bracketWeak: 'border-blue-500/10',
        iconBg: 'bg-blue-500/5 border-blue-500/15 text-blue-300',
        text: 'text-blue-300',
        pulseBg: 'bg-blue-400',
        icon: <Users className="w-4 h-4" />
    },
    indigo: {
        bg: 'from-[#080a14] to-[#05070f]',
        border: 'border-indigo-500/15',
        glow: 'shadow-[0_0_20px_rgba(99,102,241,0.04)]',
        accentLine: 'via-indigo-400/40',
        bracketStrong: 'border-indigo-500/30',
        bracketWeak: 'border-indigo-500/10',
        iconBg: 'bg-indigo-500/5 border-indigo-500/15 text-indigo-300',
        text: 'text-indigo-300',
        pulseBg: 'bg-indigo-400',
        icon: <Zap className="w-4 h-4" />
    },
    green: {
        bg: 'from-[#071310] to-[#050a08]',
        border: 'border-emerald-500/15',
        glow: 'shadow-[0_0_20px_rgba(16,185,129,0.04)]',
        accentLine: 'via-emerald-500/40',
        bracketStrong: 'border-emerald-500/30',
        bracketWeak: 'border-emerald-500/10',
        iconBg: 'bg-emerald-500/5 border-emerald-500/15 text-emerald-300',
        text: 'text-emerald-300',
        pulseBg: 'bg-emerald-400',
        icon: <Zap className="w-4 h-4" />
    },
    purple: {
        bg: 'from-[#080a14] to-[#05070f]',
        border: 'border-purple-500/15',
        glow: 'shadow-[0_0_20px_rgba(168,85,247,0.04)]',
        accentLine: 'via-purple-400/40',
        bracketStrong: 'border-purple-500/30',
        bracketWeak: 'border-purple-500/10',
        iconBg: 'bg-purple-500/5 border-purple-500/15 text-purple-300',
        text: 'text-purple-300',
        pulseBg: 'bg-purple-400',
        icon: <MessageSquare className="w-4 h-4" />
    },
    orange: {
        bg: 'from-[#170e0a] to-[#0e0806]',
        border: 'border-orange-500/15',
        glow: 'shadow-[0_0_20px_rgba(249,115,22,0.04)]',
        accentLine: 'via-orange-500/40',
        bracketStrong: 'border-orange-500/30',
        bracketWeak: 'border-orange-500/10',
        iconBg: 'bg-orange-500/5 border-orange-500/15 text-orange-300',
        text: 'text-orange-300',
        pulseBg: 'bg-orange-400',
        icon: <AlertCircle className="w-4 h-4" />
    },
    teal: {
        bg: 'from-[#0a1412] to-[#060a09]',
        border: 'border-[#749F8B]/20',
        glow: 'shadow-[0_0_20px_rgba(116,159,139,0.06)]',
        accentLine: 'via-[#749F8B]/50',
        bracketStrong: 'border-[#749F8B]/40',
        bracketWeak: 'border-[#749F8B]/15',
        iconBg: 'bg-[#749F8B]/10 border-[#749F8B]/20 text-[#749F8B]',
        text: 'text-[#749F8B]',
        pulseBg: 'bg-[#749F8B]',
        icon: <Zap className="w-4 h-4" />
    }
};

export default function DashboardStatCard({ title, value, color, iconType, subtitle, imageIcon }) {
    const theme = THEME[color] || THEME.blue;

    return (
        <div className={`relative overflow-hidden rounded-lg border bg-linear-to-b ${theme.bg} ${theme.border} p-5 ${theme.glow}`}>
            {/* Top neon accent */}
            <div className={`absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent ${theme.accentLine} to-transparent pointer-events-none opacity-50`} />

            {/* Corner brackets */}
            <span className={`absolute top-2 left-2 w-3.5 h-3.5 border-t border-l ${theme.bracketStrong} pointer-events-none`} />
            <span className={`absolute top-2 right-2 w-3.5 h-3.5 border-t border-r ${theme.bracketStrong} pointer-events-none`} />
            <span className={`absolute bottom-2 left-2 w-3.5 h-3.5 border-b border-l ${theme.bracketWeak} pointer-events-none`} />
            <span className={`absolute bottom-2 right-2 w-3.5 h-3.5 border-b border-r ${theme.bracketWeak} pointer-events-none`} />

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-3">
                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${theme.text}`}>{title}</span>
                    <div className={`p-1.5 rounded-md border ${theme.iconBg} flex items-center justify-center`}>
                        {imageIcon ? (
                            <img src={imageIcon} alt={title} className="w-4 h-4 object-contain brightness-0 invert opacity-80" />
                        ) : (
                            <div>
                                {THEME[iconType]?.icon || theme.icon}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 flex items-end">
                    <div className="w-full">
                        <div className="text-3xl font-black tracking-tight text-white mb-2 leading-none">
                            {value}
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                            <div className={`w-1.5 h-1.5 rounded-full ${theme.pulseBg} shadow-[0_0_8px_currentColor] ${theme.text}`} />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{subtitle || 'Live metrics'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
