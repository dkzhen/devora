'use client';

import { Users, Zap, MessageSquare, AlertCircle } from 'lucide-react';

const THEME = {
    blue: {
        bg: 'from-[#0a0e1a] to-[#07090f]',
        border: 'border-blue-500/20',
        glow: 'shadow-[0_0_15px_rgba(59,130,246,0.05)]',
        accentLine: 'via-blue-500/50',
        bracketStrong: 'border-blue-500/40',
        bracketWeak: 'border-blue-500/15',
        iconBg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
        text: 'text-blue-400',
        pulseBg: 'bg-blue-500',
        icon: <Users className="w-4 h-4" />
    },
    green: {
        bg: 'from-[#071310] to-[#050a08]',
        border: 'border-emerald-500/20',
        glow: 'shadow-[0_0_15px_rgba(16,185,129,0.05)]',
        accentLine: 'via-emerald-500/50',
        bracketStrong: 'border-emerald-500/40',
        bracketWeak: 'border-emerald-500/15',
        iconBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        text: 'text-emerald-400',
        pulseBg: 'bg-emerald-500',
        icon: <Zap className="w-4 h-4" />
    },
    purple: {
        bg: 'from-[#110a17] to-[#0a060e]',
        border: 'border-purple-500/20',
        glow: 'shadow-[0_0_15px_rgba(168,85,247,0.05)]',
        accentLine: 'via-purple-500/50',
        bracketStrong: 'border-purple-500/40',
        bracketWeak: 'border-purple-500/15',
        iconBg: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
        text: 'text-purple-400',
        pulseBg: 'bg-purple-500',
        icon: <MessageSquare className="w-4 h-4" />
    },
    orange: {
        bg: 'from-[#170e0a] to-[#0e0806]',
        border: 'border-orange-500/20',
        glow: 'shadow-[0_0_15px_rgba(249,115,22,0.05)]',
        accentLine: 'via-orange-500/50',
        bracketStrong: 'border-orange-500/40',
        bracketWeak: 'border-orange-500/15',
        iconBg: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
        text: 'text-orange-400',
        pulseBg: 'bg-orange-500',
        icon: <AlertCircle className="w-4 h-4" />
    }
};

export default function DashboardStatCard({ title, value, color, iconType, subtitle, imageIcon }) {
    const theme = THEME[color] || THEME.blue;
    
    return (
        <div className={`group relative overflow-hidden rounded-lg border bg-linear-to-b ${theme.bg} ${theme.border} p-5 transition-all duration-300 hover:scale-[1.02] ${theme.glow}`}>
            {/* Top neon accent */}
            <div className={`absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent ${theme.accentLine} to-transparent pointer-events-none opacity-50 group-hover:opacity-100 transition-all duration-500`} />
            
            {/* Corner brackets */}
            <span className={`absolute top-2 left-2 w-3.5 h-3.5 border-t border-l ${theme.bracketStrong} pointer-events-none`} />
            <span className={`absolute top-2 right-2 w-3.5 h-3.5 border-t border-r ${theme.bracketStrong} pointer-events-none`} />
            <span className={`absolute bottom-2 left-2 w-3.5 h-3.5 border-b border-l ${theme.bracketWeak} pointer-events-none`} />
            <span className={`absolute bottom-2 right-2 w-3.5 h-3.5 border-b border-r ${theme.bracketWeak} pointer-events-none`} />

            {/* Gloss effect */}
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-3">
                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${theme.text}`}>{title}</span>
                    <div className={`p-1.5 rounded-md border ${theme.iconBg} flex items-center justify-center transition-all duration-300 group-hover:border-white/20 group-hover:bg-white/5`}>
                        {imageIcon ? (
                            <img src={imageIcon} alt={title} className="w-4 h-4 object-contain brightness-0 invert opacity-80 group-hover:opacity-100 transition-opacity" />
                        ) : (
                            <div className="group-hover:scale-110 transition-transform duration-300">
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
                            <div className={`w-1.5 h-1.5 rounded-full ${theme.pulseBg} shadow-[0_0_8px_currentColor] animate-pulse ${theme.text}`} />
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{subtitle || 'Live metrics'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
