'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { DUMMY_APPS } from '../page';

export default function AppDetailPage() {
    const params = useParams();
    const router = useRouter();
    const appId = params.id;
    const [toast, setToast] = useState(null);
    const [highlightedVersion, setHighlightedVersion] = useState(null);

    const app = DUMMY_APPS.find(a => a.id === appId);

    useEffect(() => {
        // If there's a hash in the URL (e.g., #v1.0.0), automatically highlight and scroll to it
        const hash = window.location.hash;
        if (hash) {
            const versionId = hash.substring(1); // remove '#'
            setHighlightedVersion(versionId);
            setTimeout(() => {
                const el = document.getElementById(versionId);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 300);
        }
    }, [appId]);

    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(null), 3000);
    };

    const handleCopyMainLink = () => {
        // Copy the base app link without any hash
        const url = new URL(window.location.href);
        url.hash = '';
        navigator.clipboard.writeText(url.toString());
        showToast('App main link copied!');
    };

    const handleCopyVersionLink = (version) => {
        // Copy the link specifically attaching the version hash
        const url = new URL(window.location.href);
        url.hash = version;
        navigator.clipboard.writeText(url.toString());
        setHighlightedVersion(version);
        showToast(`Specific link for ${version} copied!`);
    };

    const handleDownload = (version) => {
        showToast(`Downloading ${app?.name} ${version}...`);
    };

    if (!app) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <svg className="w-16 h-16 text-gray-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <h1 className="text-2xl font-bold text-white mb-2">App Not Found</h1>
                <p className="text-gray-500 mb-6">The application you are looking for does not exist or has been removed.</p>
                <button
                    onClick={() => router.push('/app-library')}
                    className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                    Return to Library
                </button>
            </div>
        );
    }

    return (
        <div className="w-full space-y-8 pb-12">
            {toast && (
                <div className="fixed bottom-4 right-4 z-100 px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium animate-fade-in-up bg-emerald-500 border border-emerald-400/50">
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {toast}
                    </div>
                </div>
            )}

            {/* Breadcrumb Navigation */}
            <nav className="flex items-center text-xs md:text-sm font-medium text-gray-500 mb-2 overflow-x-auto whitespace-nowrap hide-scrollbar">
                <button
                    onClick={() => router.push('/app-library')}
                    className="flex items-center gap-1.5 hover:text-white transition-colors group"
                >
                    <svg className="w-4 h-4 opacity-70 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                    <span>App Library</span>
                </button>
                <svg className="w-3.5 h-3.5 mx-2 md:mx-3 text-gray-700 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                <div className="text-gray-300 font-semibold flex items-center gap-2">
                    <span className="w-5 h-5 rounded flex items-center justify-center bg-gray-800 text-[10px] shadow-sm border border-gray-700">
                        {app.icon}
                    </span>
                    {app.name}
                </div>
            </nav>

            {/* Consistent Hero Header */}
            <div className="relative overflow-hidden rounded-3xl mb-6 border border-white/10 shadow-xl">
                <div className="absolute inset-0 bg-linear-to-br from-gray-900 via-[#0d1b3e] to-gray-900" />
                <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-16 -left-8 w-56 h-56 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.2) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

                <div className="relative z-10 p-6 md:p-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
                    <div className="w-24 h-24 md:w-36 md:h-36 rounded-3xl bg-linear-to-br from-gray-800 to-gray-900 border border-white/10 flex items-center justify-center text-5xl md:text-7xl shadow-[inset_0_-4px_10px_rgba(0,0,0,0.5)] shrink-0 relative">
                        {app.icon}
                        <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-linear-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center border-[3px] border-[#0a0f1e] shadow-lg">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                        </div>
                    </div>

                    <div className="flex-1 w-full">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
                            <div>
                                <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2 text-transparent bg-clip-text bg-linear-to-r from-white to-gray-300">{app.name}</h1>
                                <div className="text-gray-400 text-sm flex flex-wrap items-center gap-3">
                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-lg border border-white/5 shadow-inner">
                                        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        <span className="font-semibold text-gray-300">{app.developer}</span>
                                    </span>
                                    <span className="text-purple-300 font-bold bg-purple-500/10 px-3 py-1 rounded-lg border border-purple-500/20 shadow-inner">{app.category}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-2 md:pt-0">
                                <button
                                    onClick={handleCopyMainLink}
                                    className="flex items-center justify-center gap-2 px-4 py-3 md:py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-sm font-semibold transition-colors border border-white/10 w-full md:w-auto hover:text-white"
                                >
                                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                                    Share App
                                </button>
                                <button
                                    onClick={() => handleDownload(app.versions[0].version)}
                                    className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-700/30 transition-all active:scale-95 border border-white/10"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    Get Latest ({app.versions[0].version})
                                </button>
                            </div>
                        </div>

                        <p className="text-gray-300 leading-relaxed max-w-3xl text-sm md:text-base mt-5 font-medium border-t border-white/5 pt-5">
                            {app.description}
                        </p>
                    </div>
                </div>
            </div>

            {/* Version History Section */}
            <div className="space-y-6 w-full pl-2 md:pl-0">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/30 shadow-inner">
                            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </span>
                        Version History & Downloads
                    </h2>
                </div>

                <div className="relative border-l-2 border-indigo-500/20 ml-5 space-y-12 pb-8">
                    {app.versions.map((vid, idx) => {
                        const isHighlighted = highlightedVersion === vid.version;

                        return (
                            <div
                                key={idx}
                                id={vid.version}
                                className={`relative pl-8 md:pl-12 transition-all duration-700 ${isHighlighted ? 'scale-[1.02]' : ''}`}
                            >
                                {/* Timeline Pulse Node */}
                                {idx === 0 ? (
                                    <div className="absolute -left-[11px] top-6 w-5 h-5 bg-linear-to-r from-blue-500 to-indigo-500 rounded-full border-4 border-[#0a0f1e] shadow-[0_0_15px_rgba(99,102,241,0.6)]">
                                        <div className="absolute inset-0 rounded-full bg-indigo-400 animate-ping opacity-75"></div>
                                    </div>
                                ) : (
                                    <div className={`absolute -left-[9px] top-6 w-4 h-4 rounded-full border-4 border-[#0a0f1e] ${isHighlighted ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-gray-600'}`} />
                                )}

                                {/* Glow behind highlighted card */}
                                {isHighlighted && (
                                    <div className="absolute inset-0 -top-4 -bottom-4 -left-4 -right-4 bg-emerald-500/5 blur-2xl rounded-3xl pointer-events-none" />
                                )}

                                <div className={`relative bg-gray-900/60 p-6 md:p-8 rounded-3xl border transition-all duration-500 shadow-xl ${isHighlighted ? 'border-emerald-500/50 shadow-emerald-500/10 bg-gray-900/90 ring-1 ring-emerald-500/20' : 'border-white/5 hover:border-white/20'}`}>

                                    {/* Version Header row */}
                                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
                                        <div className="flex flex-wrap items-center gap-3 border-b border-white/5 pb-4 xl:border-b-0 xl:pb-0">
                                            <span className="text-3xl font-black text-white px-1">{vid.version}</span>
                                            {idx === 0 && <span className="text-xs font-bold uppercase tracking-wider text-white bg-linear-to-r from-indigo-500 to-blue-500 px-3 py-1 rounded-md shadow-lg shadow-blue-500/30">Latest Validated</span>}
                                            {isHighlighted && <span className="text-xs font-bold uppercase tracking-wider text-emerald-100 bg-emerald-600 px-3 py-1 rounded-md shadow-lg shadow-emerald-500/30">Shared Link Opened</span>}
                                            <span className="text-sm font-medium text-gray-400 flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-md border border-white/5 ml-auto xl:ml-2">
                                                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                {new Date(vid.releaseDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </span>
                                        </div>

                                        {/* Actions per Version */}
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleCopyVersionLink(vid.version)}
                                                className={`flex-1 xl:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors border shadow-sm ${isHighlighted ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700/50 hover:text-white'}`}
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                                {isHighlighted ? 'Link Copied!' : 'Share Version'}
                                            </button>
                                            <button
                                                onClick={() => handleDownload(vid.version)}
                                                className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-xl text-sm font-bold transition-all border border-blue-500/20 hover:border-blue-500/40 hover:text-blue-300"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                Download {vid.version}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-[#0a0f1e]/80 p-5 rounded-2xl border border-white/5 shadow-inner">
                                        <h4 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                            Release Notes
                                        </h4>
                                        <ul className="space-y-3 text-sm text-gray-300">
                                            {vid.features.map((feat, i) => (
                                                <li key={i} className="flex items-start gap-3 bg-white/5 hover:bg-white/10 p-3.5 rounded-xl border border-white/5 transition-colors">
                                                    <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                                                    <span className="leading-snug text-gray-200">{feat}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
