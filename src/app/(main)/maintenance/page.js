'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Wrench, Zap, Rocket } from 'lucide-react';

function MaintenanceContent() {
    const searchParams = useSearchParams();
    const feature = searchParams.get('feature') || 'this feature';
    const message = searchParams.get('message') || 'We\'re performing some scheduled maintenance. We\'ll be back online shortly.';

    // Format slug to Title Case (e.g., "drive-center" -> "Drive Center")
    const formatFeatureName = (slug) => {
        return slug
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const featureLabel = formatFeatureName(feature);

    return (
        <div className="min-h-screen bg-[#080d1a] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 bg-linear-to-br from-[#080d1a] via-[#0d1b3e] to-[#080d1a]" />
            <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
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
                            <div className="w-24 h-24 rounded-3xl bg-linear-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center shadow-xl shadow-amber-500/10">
                                <svg className="w-12 h-12 text-amber-400 animate-spin" style={{ animationDuration: '8s' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            {/* Glow ring */}
                            <div className="absolute inset-0 rounded-3xl bg-amber-400/10 animate-ping" style={{ animationDuration: '3s' }} />
                        </div>
                    </div>

                    {/* Status badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-widest mb-6">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        Under Maintenance
                    </div>

                    {/* Feature label */}
                    <h1 className="text-3xl font-black text-white mb-2">
                        <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-300 via-orange-300 to-amber-400">
                            {featureLabel}
                        </span>
                    </h1>
                    <p className="text-sm font-semibold text-slate-400 mb-6 uppercase tracking-widest">
                        Temporarily Unavailable
                    </p>

                    {/* Divider */}
                    <div className="h-px bg-linear-to-r from-transparent via-white/10 to-transparent mb-6" />

                    {/* Message */}
                    <p className="text-slate-400 text-sm leading-relaxed mb-8">
                        {decodeURIComponent(message)}
                    </p>

                    {/* Info blocks */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-8">
                        {[
                            { icon: <Wrench className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-amber-400/80" />, label: 'Status', sub: 'In Progress' },
                            { icon: <Zap className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-blue-400/80" />, label: 'Service', sub: 'Upgrading' },
                            { icon: <Rocket className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-purple-400/80" />, label: 'ETA', sub: 'Coming Soon' },
                        ].map((item, i) => (
                            <div key={i} className="bg-white/3 border border-white/8 rounded-xl sm:rounded-2xl p-2 sm:p-3 text-center overflow-hidden">
                                <div className="flex justify-center mb-1">{item.icon}</div>
                                <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider sm:tracking-widest truncate">{item.label}</div>
                                <div className="text-[10px] sm:text-xs font-semibold text-white mt-0.5 truncate">{item.sub}</div>
                            </div>
                        ))}
                    </div>

                    {/* Back button */}
                    <a
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-semibold text-sm shadow-xl shadow-blue-700/25 transition-all active:scale-95 border border-white/10"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Back to Dashboard
                    </a>
                </div>

                {/* Footer note */}
                <p className="text-center text-slate-600 text-xs mt-6">
                    This feature was disabled by an administrator · <span className="text-slate-500">Devora</span>
                </p>
            </div>
        </div>
    );
}

export default function MaintenancePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#080d1a] flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
            </div>
        }>
            <MaintenanceContent />
        </Suspense>
    );
}
