"use client";

import Link from "next/link";

export function HeroHeader({ breadcrumbs, title, badge, description, className = "", actionContent }) {
    // Universal Soft Cyber Theme
    const theme = {
        bgGlow: "bg-purple-400/10",
        bgBase: "from-[#0c0e1a] via-[#080a14] to-[#04050a]",
        accentLine: "via-purple-500/30",
        leftStrip: "from-purple-500/50 via-purple-500/10",
        breadcrumbIcon: "text-indigo-400/40",
        breadcrumbText: "text-slate-400 hover:text-slate-200",
        breadcrumbCurrent: "text-slate-100",
        titleGradient: "from-purple-300 via-indigo-300 to-indigo-400"
    };

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
                        <p className="text-slate-300 mt-2 text-[11px] md:text-xs font-medium leading-relaxed max-w-2xl">
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

export function LoadingState({ message = "Loading..." }) {
    return (
        <div className="flex items-center justify-center py-20 gap-3 text-slate-500">
            <div className="w-4 h-4 border border-purple-500/60 shadow-[0_0_10px_#a855f7] rounded-sm animate-pulse" />
            <span className="text-[10px] font-mono tracking-[0.2em] uppercase">
                {message}
            </span>
        </div>
    );
}
