'use client';

import { Users, Zap, MessageSquare, AlertCircle } from 'lucide-react';

const ICONS = {
    blue: <Users className="w-5 h-5" />,
    green: <Zap className="w-5 h-5" />,
    purple: <MessageSquare className="w-5 h-5" />,
    orange: <AlertCircle className="w-5 h-5" />,
};

const COLORS = {
    blue: 'from-blue-500/20 to-cyan-500/5 text-blue-400 border-blue-500/20 shadow-blue-500/10',
    green: 'from-emerald-500/20 to-teal-500/5 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10',
    purple: 'from-purple-500/20 to-pink-500/5 text-purple-400 border-purple-500/20 shadow-purple-500/10',
    orange: 'from-orange-500/20 to-amber-500/5 text-orange-400 border-orange-500/20 shadow-orange-500/10',
};

export default function DashboardStatCard({ title, value, color, iconType, subtitle }) {
    return (
        <div className={`group relative overflow-hidden rounded-2xl border bg-linear-to-br ${COLORS[color]} p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`}>
            {/* Gloss effect */}
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">{title}</span>
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                        {ICONS[iconType] || ICONS.blue}
                    </div>
                </div>
                <div className="text-3xl font-black tracking-tight text-white mb-1">
                    {value}
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                    <div className="w-1 h-1 rounded-full bg-current animate-pulse" />
                    <span className="text-[10px] font-medium opacity-60">{subtitle || 'Live metrics'}</span>
                </div>
            </div>

            {/* Bottom accent glow */}
            <div className={`absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-current to-transparent opacity-30`} />
        </div>
    );
}
