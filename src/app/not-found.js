export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#080d1a] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 bg-linear-to-br from-[#080d1a] via-[#0a0d2e] to-[#080d1a]" />
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
                    <div className="text-[10rem] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-linear-to-br from-blue-400 via-indigo-400 to-purple-500 select-none">
                        404
                    </div>
                    {/* Glow under number */}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-blue-600/10 to-transparent blur-xl pointer-events-none" />
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
                        <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-indigo-400">
                            the Void
                        </span>
                    </h1>

                    <p className="text-gray-400 text-sm leading-relaxed mb-6">
                        The page you&apos;re looking for doesn&apos;t exist, was moved, or was deleted. Double-check the URL or navigate back to safety.
                    </p>


                    {/* Main CTA */}
                    <a
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-semibold text-sm shadow-xl shadow-blue-700/25 transition-all active:scale-95 border border-white/10 w-full justify-center"
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
