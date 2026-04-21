'use client';

export default function AppStorageCard({ data }) {
    if (!data) {
        return (
            <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6 animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-slate-700 rounded w-3/4"></div>
            </div>
        );
    }

    const { storage } = data;
    const telegramPercent = storage.total > 0 ? ((storage.telegram / storage.total) * 100).toFixed(1) : 0;
    const cloudiskPercent = storage.total > 0 ? ((storage.cloudisk / storage.total) * 100).toFixed(1) : 0;

    return (
        <div className="rounded-2xl border border-[#749F8B]/20 bg-gradient-to-br from-slate-800/50 to-slate-900/50 overflow-hidden shadow-lg">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#749F8B]/50 to-transparent" />
            
            <div className="p-6 space-y-5">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#749F8B]/10 border border-[#749F8B]/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#749F8B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">Storage Analytics</h3>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Distribution Method</p>
                    </div>
                </div>

                {/* Total Storage */}
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">Total Storage Used</div>
                    <div className="text-3xl font-black text-white mb-1">{storage.formatted.total}</div>
                    <div className="text-[9px] text-slate-600">Across all applications</div>
                </div>

                {/* Storage Breakdown */}
                <div className="space-y-3">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Breakdown by Method</div>
                    
                    {/* Telegram */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#749F8B]"></div>
                                <span className="text-slate-300 font-medium">Telegram</span>
                            </div>
                            <span className="font-bold text-white">{storage.formatted.telegram}</span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-[#749F8B] to-[#749F8B]/70 transition-all duration-500"
                                style={{ width: `${telegramPercent}%` }}
                            />
                        </div>
                        <div className="text-[9px] text-slate-500 text-right">{telegramPercent}%</div>
                    </div>

                    {/* Cloudisk */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#FEBD8B]"></div>
                                <span className="text-slate-300 font-medium">Cloudisk</span>
                            </div>
                            <span className="font-bold text-white">{storage.formatted.cloudisk}</span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-[#FEBD8B] to-[#FEBD8B]/70 transition-all duration-500"
                                style={{ width: `${cloudiskPercent}%` }}
                            />
                        </div>
                        <div className="text-[9px] text-slate-500 text-right">{cloudiskPercent}%</div>
                    </div>
                </div>

                {/* Info */}
                <div className="pt-3 border-t border-slate-700/50">
                    <div className="flex items-start gap-2 text-[10px] text-slate-500">
                        <svg className="w-3 h-3 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Cloudisk has 5GB limit. Telegram is unlimited but requires File IDs.</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
