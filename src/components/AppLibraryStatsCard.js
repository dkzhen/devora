'use client';

import Link from 'next/link';

export default function AppLibraryStatsCard({ data }) {
    if (!data) {
        return (
            <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6 animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-slate-700 rounded w-3/4"></div>
            </div>
        );
    }

    const { overview, storage, topApps } = data;

    return (
        <div className="rounded-2xl border border-[#FEBD8B]/20 bg-gradient-to-br from-slate-800/50 to-slate-900/50 overflow-hidden shadow-lg">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FEBD8B]/50 to-transparent" />
            
            <div className="p-6 space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#FEBD8B]/10 border border-[#FEBD8B]/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-[#FEBD8B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white">App Library</h3>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Distribution Hub</p>
                        </div>
                    </div>
                    <Link href="/app-library">
                        <button className="text-[10px] font-bold text-[#FEBD8B] hover:text-[#749F8B] transition-colors uppercase tracking-wider">
                            View All →
                        </button>
                    </Link>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Total Apps</div>
                        <div className="text-2xl font-black text-white">{overview.totalApps}</div>
                        <div className="text-[9px] text-slate-600 mt-1">{overview.totalVersions} versions</div>
                    </div>
                    
                    <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Engagement</div>
                        <div className="text-2xl font-black text-[#749F8B]">{overview.engagementRate}%</div>
                        <div className="text-[9px] text-slate-600 mt-1">view to download</div>
                    </div>
                </div>

                {/* Downloads & Views */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Total Downloads</span>
                        <span className="font-bold text-white">{overview.totalDownloads.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Total Views</span>
                        <span className="font-bold text-white">{overview.totalViews.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Avg DL per Version</span>
                        <span className="font-bold text-[#FEBD8B]">{overview.avgDownloadsPerVersion}</span>
                    </div>
                </div>

                {/* Storage Info */}
                <div className="pt-3 border-t border-slate-700/50">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Storage Used</span>
                        <span className="text-xs font-bold text-white">{storage.formatted.total}</span>
                    </div>
                    <div className="flex gap-2 text-[9px]">
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-[#749F8B]"></div>
                            <span className="text-slate-500">Telegram: {storage.formatted.telegram}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-[#FEBD8B]"></div>
                            <span className="text-slate-500">Cloudisk: {storage.formatted.cloudisk}</span>
                        </div>
                    </div>
                </div>

                {/* Top App */}
                {topApps.mostPopular && topApps.mostPopular.length > 0 && (
                    <div className="pt-3 border-t border-slate-700/50">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">Most Popular</div>
                        <Link href={`/app-library/${topApps.mostPopular[0].id}`}>
                            <div className="bg-[#FEBD8B]/5 border border-[#FEBD8B]/20 rounded-lg p-2.5 hover:bg-[#FEBD8B]/10 transition-colors cursor-pointer">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-bold text-white truncate">{topApps.mostPopular[0].name}</div>
                                        <div className="text-[9px] text-slate-400 mt-0.5">
                                            {topApps.mostPopular[0].downloads} downloads • {topApps.mostPopular[0].versions} versions
                                        </div>
                                    </div>
                                    <div className="ml-2 px-2 py-1 bg-[#FEBD8B]/20 rounded text-[9px] font-bold text-[#FEBD8B]">
                                        #{1}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
