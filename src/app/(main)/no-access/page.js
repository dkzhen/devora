'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ShieldAlert, Lock, Crown } from 'lucide-react';

function NoAccessContent() {
    const searchParams = useSearchParams();
    const feature = searchParams.get('feature') || 'this feature';
    const requiredRole = searchParams.get('role') || 'ULTRA';

    // Format slug to Title Case
    const formatFeatureName = (slug) => {
        return slug
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const featureLabel = formatFeatureName(feature);

    const roleColors = {
        'ULTRA': { bg: 'from-purple-500/20 to-indigo-500/20', border: 'border-purple-500/20', text: 'text-purple-300', glow: 'bg-purple-600/10' },
        'PRO': { bg: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/20', text: 'text-blue-300', glow: 'bg-blue-600/10' },
        'INSIDER': { bg: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-500/20', text: 'text-emerald-300', glow: 'bg-emerald-600/10' },
    };

    const roleColor = roleColors[requiredRole] || roleColors['ULTRA'];

    return (
        <div className="min-h-screen bg-[#080d1a] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 bg-linear-to-br from-[#080d1a] via-[#0d1b3e] to-[#080d1a]" />
            <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-red-600/10 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-orange-600/10 blur-[120px] pointer-events-none" />
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)',
                    backgroundSize: '32px 32px'
                }}
            />

            {/* Card */}
            <div className="relative z-10 w-full max-w-lg">
                <div className="bg-white/4 border border-white/10 rounded-3xl p-10 shadow-2xl backdrop-blur-xl text-center">

                    {/* Animated icon */}
                    <div className="flex justify-center mb-8">
                        <div className="relative">
                            <div className={`w-24 h-24 rounded-3xl bg-linear-to-br ${roleColor.bg} border ${roleColor.border} flex items-center justify-center shadow-xl`}>
                                <ShieldAlert className="w-12 h-12 text-red-400" />
                            </div>
                            {/* Glow ring */}
                            <div className={`absolute inset-0 rounded-3xl ${roleColor.glow} animate-ping`} style={{ animationDuration: '3s' }} />
                        </div>
                    </div>

                    {/* Status badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-bold uppercase tracking-widest mb-6">
                        <Lock className="w-3 h-3" />
                        Access Denied
                    </div>

                    {/* Feature label */}
                    <h1 className="text-3xl font-black text-white mb-2">
                        <span className="text-transparent bg-clip-text bg-linear-to-r from-red-300 via-orange-300 to-red-400">
                            {featureLabel}
                        </span>
                    </h1>
                    <p className="text-sm font-semibold text-slate-400 mb-6 uppercase tracking-widest">
                        Restricted Access
                    </p>

                    {/* Divider */}
                    <div className="h-px bg-linear-to-r from-transparent via-white/10 to-transparent mb-6" />

                    {/* Message */}
                    <p className="text-slate-400 text-sm leading-relaxed mb-4">
                        This feature requires <span className={`font-bold ${roleColor.text}`}>{requiredRole}</span> access level.
                    </p>
                    <p className="text-slate-500 text-xs leading-relaxed mb-8">
                        Please upgrade your account to access this feature.
                    </p>

                    {/* Info blocks */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-8">
                        {[
                            { icon: <Lock className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-red-400/80" />, label: 'Status', sub: 'Locked' },
                            { icon: <Crown className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-purple-400/80" />, label: 'Required', sub: requiredRole },
                            { icon: <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-orange-400/80" />, label: 'Action', sub: 'Upgrade' },
                        ].map((item, i) => (
                            <div key={i} className="bg-white/3 border border-white/8 rounded-xl sm:rounded-2xl p-2 sm:p-3 text-center overflow-hidden">
                                <div className="flex justify-center mb-1">{item.icon}</div>
                                <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider sm:tracking-widest truncate">{item.label}</div>
                                <div className="text-[10px] sm:text-xs font-semibold text-white mt-0.5 truncate">{item.sub}</div>
                            </div>
                        ))}
                    </div>

                    {/* Action button */}
                    <a
                        href="/"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-semibold text-sm shadow-xl shadow-blue-700/25 transition-all active:scale-95 border border-white/10"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Back to Dashboard
                    </a>
                </div>

                {/* Footer note */}
                <p className="text-center text-slate-600 text-xs mt-6">
                    Contact support if you believe this is an error · <span className="text-slate-500">Devora</span>
                </p>
            </div>
        </div>
    );
}

export default function NoAccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#080d1a] flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-red-400/30 border-t-red-400 animate-spin" />
            </div>
        }>
            <NoAccessContent />
        </Suspense>
    );
}
