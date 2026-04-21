'use client';

import Link from 'next/link';

export default function MostUpdatedAppsCard({ data }) {
    if (!data) {
        return (
            <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6 animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-slate-700 rounded w-3/4"></div>
            </div>
        );
    }

    const { topApps } = data;
    const mostUpdated = topApps.mostUpdated || [];

    return (
        <div className="rounded-2xl border border-[#FEBD8B]/20 bg-gradient-to-br from-slate-800/50 to-slate-900/50 overflow-hidden shadow-lg">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FEBD8B]/50 to-transparent" />
            
            <div className="p-6 space-y-5">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FEBD8B]/10 border border-[#FEBD8B]/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#FEBD8B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">Most Updated</h3>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Frequent Releases</p>
                    </div>
                </div>

                {/* Apps List */}
                <div className="space-y-2">
                    {mostUpdated.length > 0 ? (
                        mostUpdated.map((app, index) => (
                            <Link key={app.id} href={`/app-library/${app.id}`}>
                                <div className="group bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 hover:bg-slate-800/70 hover:border-[#FEBD8B]/30 transition-all cursor-pointer">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#FEBD8B]/10 border border-[#FEBD8B]/20 shrink-0">
                                                <span className="text-xs font-bold text-[#FEBD8B]">#{index + 1}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-bold text-white truncate group-hover:text-[#FEBD8B] transition-colors">
                                                    {app.name}
                                                </div>
                                                <div className="text-[10px] text-slate-500 mt-0.5">
                                                    {app.downloads.toLocaleString()} downloads
                                                </div>
                                            </div>
                                        </div>
                                        <div className="ml-3 px-2.5 py-1 bg-[#FEBD8B]/10 border border-[#FEBD8B]/20 rounded-lg">
                                            <div className="text-xs font-black text-[#FEBD8B]">{app.versionCount}</div>
                                            <div className="text-[8px] text-slate-500 uppercase tracking-wider">versions</div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="text-center py-8 text-slate-500 text-xs">
                            No apps available
                        </div>
                    )}
                </div>

                {/* Footer */}
                {mostUpdated.length > 0 && (
                    <div className="pt-3 border-t border-slate-700/50">
                        <Link href="/app-library">
                            <button className="w-full text-[10px] font-bold text-[#FEBD8B] hover:text-white transition-colors uppercase tracking-wider text-center py-2">
                                View All Apps →
                            </button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
