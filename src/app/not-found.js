export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#080d1a] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#080d1a] via-[#0a0d2e] to-[#080d1a]" />
            <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-blue-600/8 blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-purple-600/8 blur-[80px] pointer-events-none" />
            <div
                className="absolute inset-0 opacity-[0.025]"
                style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.2) 1px, transparent 1px)',
                    backgroundSize: '32px 32px'
                }}
            />

            {/* Content */}
            <div className="relative z-10 w-full max-w-lg text-center">

                {/* 404 Number */}
                <div className="mb-6 relative">
                    <div className="text-[10rem] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-500 select-none">
                        404
                    </div>
                    {/* Glow under number */}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-blue-600/10 to-transparent blur-xl pointer-events-none" />
                </div>

                {/* Glass card */}
                <div className="bg-white/4 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl mb-8">
                    {/* Status indicator */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest mb-5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        Page Not Found
                    </div>

                    <h1 className="text-2xl font-black text-white mb-3">
                        Lost in{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                            the Void
                        </span>
                    </h1>

                    <p className="text-gray-400 text-sm leading-relaxed mb-6">
                        The page you&apos;re looking for doesn&apos;t exist, was moved, or was deleted. Double-check the URL or navigate back to safety.
                    </p>

                    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />

                    {/* Quick links */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {[
                            { label: 'Dashboard', href: '/', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
                            { label: 'Airdrops', href: '/airdrops', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 21v-6m0 0l-3 3m3-3l3 3" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5.5 11C5.5 7.41 8.41 4.5 12 4.5S18.5 7.41 18.5 11" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 11a9 9 0 0118 0" /></svg> },
                            { label: 'Gmail Center', href: '/gmail-center', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
                            { label: 'Mail Control', href: '/mail-control', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
                        ].map((link, i) => (
                            <a
                                key={i}
                                href={link.href}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white/4 hover:bg-white/8 border border-white/8 hover:border-blue-500/30 rounded-xl text-sm text-gray-300 hover:text-white font-medium transition-all group"
                            >
                                <span className="text-gray-500 group-hover:text-blue-400 transition-colors">{link.icon}</span>
                                {link.label}
                            </a>
                        ))}
                    </div>

                    {/* Main CTA */}
                    <a
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-semibold text-sm shadow-xl shadow-blue-700/25 transition-all active:scale-95 border border-white/10 w-full justify-center"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Go Back Home
                    </a>
                </div>

                <p className="text-gray-600 text-xs">
                    Error 404 · <span className="text-gray-500">Devora Platform</span>
                </p>
            </div>
        </div>
    );
}
