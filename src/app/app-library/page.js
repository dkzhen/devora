'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const DUMMY_APPS = [
    {
        id: 'devora-auth',
        name: 'Devora Authenticator',
        category: 'Security',
        versions: [
            { version: 'v1.2.0', releaseDate: '2026-02-15', features: ['Added Biometric Support', 'Bug fixes'] },
            { version: 'v1.1.0', releaseDate: '2026-01-10', features: ['UI Refresh', 'Faster load times'] },
            { version: 'v1.0.0', releaseDate: '2025-11-20', features: ['Initial Release'] },
        ],
        icon: '🔒',
        description: 'Secure authentication app for devora ecosystems with OTP and push notification support.',
        developer: 'Devora Inc.'
    },
    {
        id: 'devora-scan',
        name: 'Devora Scanner',
        category: 'Utility',
        versions: [
            { version: 'v2.0.1', releaseDate: '2026-02-20', features: ['Fix scanner crash on Android 14'] },
            { version: 'v2.0.0', releaseDate: '2026-02-01', features: ['Major update: Cloud Sync', 'Dark Mode'] }
        ],
        icon: '📄',
        description: 'High-speed document scanner app with OCR capabilities and automatic cloud synchronization.',
        developer: 'Devora Inc.'
    },
    {
        id: 'crypto-tracker',
        name: 'Drop Tracker Mobile',
        category: 'Finance',
        versions: [
            { version: 'v3.5.0', releaseDate: '2026-02-25', features: ['Added Solana ecosystem support', 'Portfolio widgets'] },
            { version: 'v3.4.2', releaseDate: '2026-01-05', features: ['Minor bug fixes'] }
        ],
        icon: '📊',
        description: 'Track your airdrops, DeFi yields, and crypto portfolio in real-time across multiple chains directly from your phone.',
        developer: 'Hunting Group'
    }
];

export default function AppLibraryPage() {
    const [search, setSearch] = useState('');
    const [toast, setToast] = useState(null);
    const router = useRouter();

    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(null), 3000);
    };

    const handleCopyLink = (e, appId) => {
        e.stopPropagation();
        const link = `${window.location.origin}/app-library/${appId}`;
        navigator.clipboard.writeText(link);
        showToast('Link copied to clipboard!');
    };

    const filteredApps = DUMMY_APPS.filter(app =>
        app.name.toLowerCase().includes(search.toLowerCase()) ||
        app.category.toLowerCase().includes(search.toLowerCase()) ||
        app.description.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8">
            {toast && (
                <div className="fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium animate-fade-in-up bg-blue-500">
                    {toast}
                </div>
            )}

            <div className="relative overflow-hidden rounded-2xl mb-6">
                <div className="absolute inset-0 bg-linear-to-br from-gray-900 via-[#0d1b3e] to-gray-900" />
                <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-16 -left-8 w-56 h-56 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.2) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

                <div className="relative z-10 p-5 md:p-8">
                    <nav className="flex text-xs text-blue-300/60 mb-4">
                        <a href="/" className="flex items-center gap-1 hover:text-blue-300 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                            Dashboard
                        </a>
                        <svg className="w-3 h-3 mx-2 text-blue-400/30 self-center" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        <span className="text-blue-200 font-semibold">App Library</span>
                    </nav>

                    <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                        <span className="text-white">App </span>
                        <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 via-indigo-400 to-purple-400">Library</span>
                    </h1>
                    <p className="text-gray-400 mt-2 text-sm max-w-xl">Discover, download, and share applications. Keep up entirely with all our latest app versions.</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input
                    type="text"
                    placeholder="Search apps by name, description, or category..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-900 border border-white/10 hover:border-blue-500/30 rounded-2xl text-sm text-gray-100 placeholder-gray-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all shadow-lg shadow-black/20"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredApps.map((app) => (
                    <div
                        key={app.id}
                        onClick={() => router.push(`/app-library/${app.id}`)}
                        className="group bg-gray-900/50 border border-white/10 hover:border-blue-500/40 rounded-2xl p-5 transition-all cursor-pointer flex flex-col justify-between hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/10"
                    >
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3 w-full">
                                    <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-gray-800 to-gray-900 border border-white/5 flex items-center justify-center text-2xl shadow-inner shrink-0">
                                        {app.icon}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-white font-bold text-base truncate">{app.name}</h3>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs text-blue-400 font-medium bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">{app.category}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => handleCopyLink(e, app.id)}
                                        className="shrink-0 p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-colors"
                                        title="Copy Link"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                    </button>
                                </div>
                            </div>
                            <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed mb-4">
                                {app.description}
                            </p>
                        </div>

                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                                Latest: <span className="font-semibold text-gray-300">{app.versions[0].version}</span>
                            </div>
                            <div className="text-xs font-semibold text-indigo-400 flex items-center gap-1 group-hover:gap-1.5 transition-all">
                                Details
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredApps.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500 border border-dashed border-white/10 rounded-3xl bg-gray-900/20">
                    <svg className="w-12 h-12 mb-4 opacity-50 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    <h3 className="text-lg font-bold text-gray-300">No Apps Found</h3>
                    <p className="text-sm mt-1">Try modifying your search criteria.</p>
                </div>
            )}
        </div>
    );
}
