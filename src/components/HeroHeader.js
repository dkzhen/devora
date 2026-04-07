"use client";

import Link from "next/link";

export function HeroHeader({ breadcrumbs, title, badge, description, colorTheme = "red", className = "", actionContent }) {
    // Theme color maps with specific dark backgrounds and neon accents
    const themes = {
        red: {
            bgGlow: "bg-red-600/10",
            bgBase: "from-[#1a0a0a] via-[#0d0505] to-[#050202]",
            accentLine: "via-red-500/40",
            leftStrip: "from-red-500/60 via-red-500/15",
            breadcrumbIcon: "text-red-500/40",
            breadcrumbText: "text-red-400/60 hover:text-red-300",
            breadcrumbCurrent: "text-red-200/80",
            titleGradient: "from-red-400 via-rose-400 to-pink-500"
        },
        blue: {
            bgGlow: "bg-blue-600/10",
            bgBase: "from-[#0a0e1a] via-[#05070f] to-[#020305]",
            accentLine: "via-blue-500/40",
            leftStrip: "from-blue-500/60 via-blue-500/15",
            breadcrumbIcon: "text-blue-500/40",
            breadcrumbText: "text-blue-400/60 hover:text-blue-300",
            breadcrumbCurrent: "text-blue-200/80",
            titleGradient: "from-blue-400 via-cyan-400 to-indigo-500"
        },
        emerald: {
            bgGlow: "bg-emerald-600/10",
            bgBase: "from-[#071310] via-[#030806] to-[#010302]",
            accentLine: "via-emerald-500/40",
            leftStrip: "from-emerald-500/60 via-emerald-500/15",
            breadcrumbIcon: "text-emerald-500/40",
            breadcrumbText: "text-emerald-400/60 hover:text-emerald-300",
            breadcrumbCurrent: "text-emerald-200/80",
            titleGradient: "from-emerald-400 via-teal-400 to-green-500"
        },
        purple: {
            bgGlow: "bg-purple-600/10",
            bgBase: "from-[#110a17] via-[#08050e] to-[#030105]",
            accentLine: "via-purple-500/40",
            leftStrip: "from-purple-500/60 via-purple-500/15",
            breadcrumbIcon: "text-purple-500/40",
            breadcrumbText: "text-purple-400/60 hover:text-purple-300",
            breadcrumbCurrent: "text-purple-200/80",
            titleGradient: "from-purple-400 via-fuchsia-400 to-pink-500"
        },
        orange: {
            bgGlow: "bg-orange-600/10",
            bgBase: "from-[#170e0a] via-[#0d0705] to-[#050201]",
            accentLine: "via-orange-500/40",
            leftStrip: "from-orange-500/60 via-orange-500/15",
            breadcrumbIcon: "text-orange-500/40",
            breadcrumbText: "text-orange-400/60 hover:text-orange-300",
            breadcrumbCurrent: "text-orange-200/80",
            titleGradient: "from-orange-400 via-amber-400 to-yellow-500"
        },
        dawn: {
            bgGlow: "bg-[#FEBD8B]/10",
            bgBase: "from-[#1A082E] via-[#120621] to-[#0a0312]",
            accentLine: "via-[#749F8B]/40",
            leftStrip: "from-[#FEBD8B]/60 via-[#FEBD8B]/15",
            breadcrumbIcon: "text-[#749F8B]/40",
            breadcrumbText: "text-[#749F8B]/60 hover:text-[#FEBD8B]",
            breadcrumbCurrent: "text-[#FDF2D9]/80",
            titleGradient: "from-[#FEBD8B] via-[#749F8B] to-[#FDF2D9]"
        },
        sunset: {
            bgGlow: "bg-[#F25278]/10",
            bgBase: "from-[#0a0312] via-[#2D3482] to-[#0a0312]",
            accentLine: "via-[#F25278]/40",
            leftStrip: "from-[#F25278]/60 via-[#F25278]/15",
            breadcrumbIcon: "text-[#F25278]/40",
            breadcrumbText: "text-[#F25278]/60 hover:text-[#FEA47F]",
            breadcrumbCurrent: "text-[#FEA47F]/80",
            titleGradient: "from-[#F25278] via-[#FEA47F] to-[#E2F784]"
        },
        nebula: {
            bgGlow: "bg-[#708993]/10",
            bgBase: "from-[#0a0e1a] via-[#19183B]/20 to-[#020305]",
            accentLine: "via-[#A1C2BD]/40",
            leftStrip: "from-[#708993]/60 via-[#708993]/15",
            breadcrumbIcon: "text-[#708993]/40",
            breadcrumbText: "text-[#708993]/60 hover:text-[#A1C2BD]",
            breadcrumbCurrent: "text-[#E7F2EF]/80",
            titleGradient: "from-[#708993] via-[#A1C2BD] to-[#E7F2EF]"
        },
        cyberpunk: {
            bgGlow: "bg-[#76D2DB]/20",
            bgBase: "from-[#36064D] via-[#DA4848]/20 to-transparent",
            accentLine: "via-[#DA4848]/60",
            leftStrip: "from-[#76D2DB] via-[#DA4848]/40",
            breadcrumbIcon: "text-[#76D2DB]/40",
            breadcrumbText: "text-[#76D2DB]/60 hover:text-[#F7F6E5]",
            breadcrumbCurrent: "text-[#F7F6E5]/80",
            titleGradient: "from-[#76D2DB] via-[#F7F6E5] to-[#DA4848]"
        },
        herosms: {
            bgGlow: "bg-[#4C8CE4]/10",
            bgBase: "from-[#0B0F1A] via-[#406093]/15 to-transparent",
            accentLine: "via-[#91D06C]/40",
            leftStrip: "from-[#4C8CE4] via-[#91D06C]/40",
            breadcrumbIcon: "text-[#4C8CE4]/40",
            breadcrumbText: "text-[#4C8CE4]/60 hover:text-[#FFF799]",
            breadcrumbCurrent: "text-[#FFF799]/80",
            titleGradient: "from-[#4C8CE4] via-[#91D06C] to-[#FFF799]"
        },
        drive: {
            bgGlow: "bg-[#108dc7]/15",
            bgBase: "from-[#0B0F1A] via-[#108dc7]/10 to-[#0B0F1A]",
            accentLine: "via-[#ef8e38]/60",
            leftStrip: "from-[#108dc7] via-[#ef8e38]/40",
            breadcrumbIcon: "text-[#108dc7]/40",
            breadcrumbText: "text-[#108dc7]/60 hover:text-[#ef8e38]",
            breadcrumbCurrent: "text-[#ef8e38]/80",
            titleGradient: "from-[#108dc7] via-[#ef8e38] to-[#108dc7]"
        },
        mail_control: {
            bgGlow: "bg-[#e0165c]/15",
            bgBase: "from-[#0B0F1A] via-[#e0165c]/10 to-[#0B0F1A]",
            accentLine: "via-[#00f0ff]/60",
            leftStrip: "from-[#e0165c] via-[#00f0ff]/40",
            breadcrumbIcon: "text-[#e0165c]/40",
            breadcrumbText: "text-[#e0165c]/60 hover:text-[#00f0ff]",
            breadcrumbCurrent: "text-[#00f0ff]/80",
            titleGradient: "from-[#e0165c] via-[#00f0ff] to-[#e0165c]"
        },
        synthwave: {
            bgGlow: "bg-[#F53896]/15",
            bgBase: "from-[#4A00E0] via-[#F53896]/20 to-transparent",
            accentLine: "via-[#00E5FF]/50",
            leftStrip: "from-[#4A00E0] via-[#00E5FF]/40",
            breadcrumbIcon: "text-[#00E5FF]/50",
            breadcrumbText: "text-[#00E5FF]/70 hover:text-[#F7F6E5]",
            breadcrumbCurrent: "text-[#F7F6E5]/90",
            titleGradient: "from-[#00E5FF] via-[#F53896] to-[#F7F6E5]"
        },
        neon_mail: {
            bgGlow: "bg-[#EA4335]/20",
            bgBase: "from-[#2A0A08] via-[#4A0D0A]/20 to-transparent",
            accentLine: "via-[#FBBC05]/60",
            leftStrip: "from-[#EA4335] via-[#4285F4]/40",
            breadcrumbIcon: "text-[#EA4335]/40",
            breadcrumbText: "text-[#EA4335]/60 hover:text-[#4285F4]",
            breadcrumbCurrent: "text-[#34A853]/80",
            titleGradient: "from-[#EA4335] via-[#4285F4] to-[#FBBC05]"
        },
        unicorn: {
            bgGlow: "bg-[#f0acf7]/20",
            bgBase: "from-[#1a1122] via-[#2a1735]/40 to-transparent",
            accentLine: "via-[#acf7f0]/60",
            leftStrip: "from-[#f0acf7] via-[#acf7f0]/40",
            breadcrumbIcon: "text-[#acf7f0]/40",
            breadcrumbText: "text-[#acf7f0]/60 hover:text-[#f7f0ac]",
            breadcrumbCurrent: "text-[#f7f0ac]/80",
            titleGradient: "from-[#f7f0ac] via-[#acf7f0] to-[#f0acf7]"
        },
        settings: {
            bgGlow: "bg-[#000c40]/20",
            bgBase: "from-[#0B0F1A] via-[#000c40]/30 to-transparent",
            accentLine: "via-[#f0f2f0]/30",
            leftStrip: "from-[#000c40] via-[#f0f2f0]/40",
            breadcrumbIcon: "text-[#f0f2f0]/40",
            breadcrumbText: "text-[#f0f2f0]/60 hover:text-white",
            breadcrumbCurrent: "text-[#f0f2f0]",
            titleGradient: "from-[#f0f2f0] via-gray-300 to-[#4A64A0]"
        },
        upgrade: {
            bgGlow: "bg-[#e59a54]/20",
            bgBase: "from-[#0B0F1A] via-[#e59a54]/20 to-transparent",
            accentLine: "via-[#e59a54]/60",
            leftStrip: "from-[#e59a54] via-[#e59a54]/40",
            breadcrumbIcon: "text-[#e59a54]/40",
            breadcrumbText: "text-[#e59a54]/60 hover:text-white",
            breadcrumbCurrent: "text-[#e59a54]",
            titleGradient: "from-[#e59a54] via-amber-200 to-[#e59a54]"
        },
        devora: {
            bgGlow: "bg-[#f36222]/15",
            bgBase: "from-[#120a05] via-[#0a1408]/80 to-[#02080f]",
            accentLine: "via-[#5cb644]/60",
            leftStrip: "from-[#f36222] via-[#5cb644]/50",
            breadcrumbIcon: "text-[#f36222]/40",
            breadcrumbText: "text-[#f36222]/60 hover:text-[#5cb644]",
            breadcrumbCurrent: "text-[#5cb644]/90",
            titleGradient: "from-[#f36222] via-[#5cb644] to-[#007fc3]"
        },
        whinehouse: {
            bgGlow: "bg-[#794747]/20",
            bgBase: "from-[#111111] via-[#4e2020]/40 to-transparent",
            accentLine: "via-[#b9a0a0]/60",
            leftStrip: "from-[#f7f7f7] via-[#b9a0a0]/40",
            breadcrumbIcon: "text-[#b9a0a0]/40",
            breadcrumbText: "text-[#b9a0a0]/60 hover:text-[#f7f7f7]",
            breadcrumbCurrent: "text-[#f7f7f7]/80",
            titleGradient: "from-[#f7f7f7] via-[#b9a0a0] to-[#794747]"
        },
        web3_projects: {
            bgGlow: "bg-[#ffd89b]/10",
            bgBase: "from-[#0a0f1e] via-[#19547b]/10 to-[#050b1a]",
            accentLine: "via-[#ffd89b]/40",
            leftStrip: "from-[#ffd89b]/60 via-[#19547b]/40",
            breadcrumbIcon: "text-[#ffd89b]/40",
            breadcrumbText: "text-[#ffd89b]/60 hover:text-[#19547b]",
            breadcrumbCurrent: "text-[#19547b]/80",
            titleGradient: "from-[#ffd89b] via-[#19547b] to-[#ffd89b]"
        },
        nara: {
            bgGlow: "bg-green-500/10",
            bgBase: "from-[#051105] via-[#020502] to-[#000000]",
            accentLine: "via-green-500/40",
            leftStrip: "from-green-500/60 via-green-400/15",
            breadcrumbIcon: "text-green-500/40",
            breadcrumbText: "text-green-400/60 hover:text-green-300",
            breadcrumbCurrent: "text-green-200/80",
            titleGradient: "from-green-400 via-emerald-400 to-lime-500"
        }
    };

    const theme = themes[colorTheme] || themes.red;

    return (
        <div className={`relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl min-h-[120px] md:min-h-[160px] flex flex-col justify-center ${className}`}>
            <div className={`absolute inset-0 bg-linear-to-br ${theme.bgBase}`} />

            {/* Inner grid overlay */}
            <div
                className="absolute inset-0 pointer-events-none opacity-50"
                style={{
                    backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
                    backgroundSize: "32px 32px",
                }}
            />
            {/* Glow orbs */}
            <div className={`absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[100px] pointer-events-none ${theme.bgGlow}`} />
            <div className={`absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-[100px] pointer-events-none ${theme.bgGlow}`} />

            {/* Bottom accent line */}
            <div className={`absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent to-transparent pointer-events-none ${theme.accentLine}`} />
            {/* Left accent strip */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 bg-linear-to-b to-transparent pointer-events-none ${theme.leftStrip}`} />

            {/* Corners deco */}
            <span className="absolute top-3 right-3 w-6 h-6 border-t border-r border-white/20 pointer-events-none" />
            <span className="absolute bottom-3 left-3 w-6 h-6 border-b border-l border-white/10 pointer-events-none" />
            <span className="absolute top-3 left-3 w-6 h-6 border-t border-l border-white/20 pointer-events-none" />
            <span className="absolute bottom-3 right-3 w-6 h-6 border-b border-r border-white/10 pointer-events-none" />

            <div className="relative z-10 px-5 md:px-7 py-5 md:py-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    {breadcrumbs && breadcrumbs.length > 0 && (
                        <nav className={`flex text-[9px] font-bold tracking-widest uppercase mb-3 items-center gap-1.5 ${theme.breadcrumbText}`}>
                            {breadcrumbs.map((crumb, idx) => {
                                const isLast = idx === breadcrumbs.length - 1;
                                return (
                                    <div key={idx} className="flex items-center gap-1.5">
                                        {idx > 0 && (
                                            <svg className={`w-3 h-3 ${theme.breadcrumbIcon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                            </svg>
                                        )}
                                        {crumb.href ? (
                                            <Link href={crumb.href} className="hover:opacity-80 transition-opacity flex items-center gap-1">
                                                {crumb.icon && crumb.icon}
                                                {crumb.label}
                                            </Link>
                                        ) : (
                                            <span className={isLast ? theme.breadcrumbCurrent : ""}>
                                                <span className="flex items-center gap-1">{crumb.icon && crumb.icon}{crumb.label}</span>
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </nav>
                    )}

                    <h1 className="text-lg md:text-2xl font-black tracking-tight leading-none flex items-baseline gap-1.5">
                        <span className="text-white">{title}</span>
                        {badge && (
                            <span className={`text-transparent bg-clip-text bg-linear-to-r ${theme.titleGradient}`}>
                                {badge}
                            </span>
                        )}
                    </h1>

                    {description && (
                        <p className="text-gray-400 mt-2 text-[11px] md:text-xs font-medium leading-relaxed max-w-2xl">
                            {description}
                        </p>
                    )}
                </div>
                {actionContent && (
                    <div className="shrink-0 mb-1">
                        {actionContent}
                    </div>
                )}
            </div>
        </div>
    );
}

export function LoadingState({ message = "Loading...", colorTheme = "red" }) {
    const borders = {
        red: "border-red-500/30",
        blue: "border-blue-500/30",
        emerald: "border-emerald-500/30",
        dawn: "border-[#FEBD8B]/30",
        sunset: "border-[#F25278]/30",
        nebula: "border-[#A1C2BD]/30",
        cyberpunk: "border-[#76D2DB]/60 shadow-[0_0_10px_#76D2DB]",
        herosms: "border-[#4C8CE4]/60 shadow-[0_0_10px_#4C8CE4]",
        drive: "border-[#108dc7]/60 shadow-[0_0_10px_#108dc7]",
        mail_control: "border-[#e0165c]/60 shadow-[0_0_10px_#e0165c]",
        synthwave: "border-[#00E5FF]/60 shadow-[0_0_10px_#00E5FF]",
        neon_mail: "border-[#EA4335]/60 shadow-[0_0_10px_#EA4335]",
        unicorn: "border-[#acf7f0]/60 shadow-[0_0_10px_#acf7f0]",
        settings: "border-[#f0f2f0]/60 shadow-[0_0_10px_#f0f2f0]",
        upgrade: "border-[#e59a54]/60 shadow-[0_0_10px_#e59a54]",
        devora: "border-[#5cb644]/60 shadow-[0_0_10px_#5cb644]",
        web3_projects: "border-[#ffd89b]/60 shadow-[0_0_10px_#ffd89b]",
        nara: "border-green-500/60 shadow-[0_0_10px_#22c55e]"
    };
    const borderClass = borders[colorTheme] || borders.red;

    return (
        <div className="flex items-center justify-center py-20 gap-3 text-gray-600">
            <div className={`w-4 h-4 border ${borderClass} rounded-sm animate-pulse`} />
            <span className="text-[10px] font-mono tracking-[0.2em] uppercase">
                {message}
            </span>
        </div>
    );
}
