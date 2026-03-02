'use client';

import Link from 'next/link';

export default function LockedFeatureScreen({ featureName = "This feature" }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
            <div className="relative mb-8">
                {/* Glow Effects */}
                <div className="absolute inset-0 bg-linear-to-br from-purple-500/20 to-pink-500/20 blur-3xl -z-10" />

                {/* Padlock Icon Container */}
                <div className="w-24 h-24 rounded-3xl bg-[#0f172a]/80 border border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent" />
                    <svg className="w-12 h-12 text-purple-400 group-hover:scale-110 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
            </div>

            <h1 className="text-3xl font-black text-white mb-4 tracking-tight">
                ULTRA Feature <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-pink-400">Locked</span>
            </h1>

            <p className="max-w-md text-gray-400 leading-relaxed mb-10 text-sm">
                {featureName} is reserved for developer accounts. Upgrade your plan to unlock high-level tools.
            </p>

            <Link
                href="/upgrade"
                className="flex items-center gap-2 px-8 py-4 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-purple-500/20 transition-all active:scale-95 border border-white/10"
            >
                Upgrade Plan
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
            </Link>
        </div>
    );
}
