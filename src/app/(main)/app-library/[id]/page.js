'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import LoadingImage from '@/components/LoadingImage';

export default function AppDetailPage() {
    const params = useParams();
    const router = useRouter();
    const appId = params.id;
    const [toast, setToast] = useState(null);
    const [highlightedVersion, setHighlightedVersion] = useState(null);
    const [app, setApp] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [isUltra, setIsUltra] = useState(false);

    // Modal state
    const [showAddVersionModal, setShowAddVersionModal] = useState(false);
    const [newVersion, setNewVersion] = useState('');
    const [newAndroidVersion, setNewAndroidVersion] = useState('');
    const [newFeatures, setNewFeatures] = useState('');
    const [apkFileId, setApkFileId] = useState('');
    const [submittingVersion, setSubmittingVersion] = useState(false);

    // Delete state
    const [confirmDeleteApp, setConfirmDeleteApp] = useState(false);
    const [deletingApp, setDeletingApp] = useState(false);
    const [deletingVersionId, setDeletingVersionId] = useState(null);
    const [confirmDeleteVersionId, setConfirmDeleteVersionId] = useState(null);

    // Download Queue
    const [downloads, setDownloads] = useState([]);

    useEffect(() => {
        const fetchAppAndUser = async () => {
            try {
                let userRole = null;
                const storedUser = localStorage.getItem('user_info');
                if (storedUser) {
                    try {
                        const parsedUser = JSON.parse(storedUser);
                        setUser(parsedUser);
                        userRole = parsedUser.role;
                    } catch (e) { console.error(e); }
                }

                if (!userRole) {
                    try {
                        const res = await fetch('/api/auth/me');
                        if (res.ok) {
                            const data = await res.json();
                            if (data.user) {
                                setUser(data.user);
                                userRole = data.user.role;
                            }
                        }
                    } catch (e) { console.error('Auth check error:', e); }
                }

                if (userRole === 'ULTRA') {
                    setIsUltra(true);
                }

                const res = await fetch('/api/apps');
                const data = await res.json();
                if (data.success) {
                    const foundApp = data.apps.find(a => a.id === appId);
                    setApp(foundApp);
                }
            } catch (e) {
                console.error('Failed to fetch apps');
            } finally {
                setLoading(false);
            }
        };
        fetchAppAndUser();
    }, [appId]);

    // Fire view count once app is loaded
    useEffect(() => {
        if (app?.id) {
            fetch(`/api/apps/${app.id}/view`, { method: 'POST' }).catch(() => { });
        }
    }, [app?.id]);

    useEffect(() => {
        const hash = window.location.hash;
        if (hash) {
            const versionId = hash.substring(1);
            setHighlightedVersion(versionId);
            setTimeout(() => {
                const el = document.getElementById(versionId);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        }
    }, [appId]);

    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(null), 3000);
    };

    const handleCopyMainLink = () => {
        const url = new URL(window.location.href);
        url.hash = '';
        navigator.clipboard.writeText(url.toString());
        showToast('App link copied!');
    };

    const handleCopyVersionLink = (version) => {
        const url = new URL(window.location.href);
        url.hash = version;
        navigator.clipboard.writeText(url.toString());
        setHighlightedVersion(version);
        showToast(`Link for ${version} copied!`);
    };

    const handleDownload = async (apkUrl, vidVersion) => {
        if (!apkUrl) { showToast('Download link not available.'); return; }

        const downloadId = Date.now().toString();
        const newDownload = {
            id: downloadId,
            version: vidVersion || 'Latest',
            status: 'loading',
            errorMsg: null,
            timestamp: new Date()
        };

        // Remove any existing error state for this specific version before adding the new one
        setDownloads(prev => {
            const filtered = prev.filter(d => !(d.version === (vidVersion || 'Latest') && d.status === 'error'));
            return [...filtered, newDownload];
        });

        try {
            const res = await fetch(`/api/telegram/download/${apkUrl}`);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                setDownloads(prev => prev.map(d => d.id === downloadId ? { ...d, status: 'error', errorMsg: err.error || `Failed HTTP ${res.status}` } : d));
                return;
            }

            const blob = await res.blob();
            // Custom Filename: Devora-[AppName]-v[Version].apk
            // Removes spaces to keep CamelCase/PascalCase (e.g. Multi Cloner -> MultiCloner)
            const cleanAppName = app.name.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
            const rawVersion = vidVersion.replace(/\s+/g, '').replace(/[^a-zA-Z0-9\.]/g, '');
            const cleanVersion = rawVersion.toLowerCase().startsWith('v') ? rawVersion : `v${rawVersion}`;
            const filename = `Devora-${cleanAppName}-${cleanVersion}.apk`;

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);

            setDownloads(prev => prev.map(d => d.id === downloadId ? { ...d, status: 'success' } : d));

            // Auto-remove success after 3 seconds
            setTimeout(() => {
                setDownloads(prev => prev.filter(d => d.id !== downloadId));
            }, 3000);

        } catch (err) {
            setDownloads(prev => prev.map(d => d.id === downloadId ? { ...d, status: 'error', errorMsg: 'Network connection lost' } : d));
        }
    };

    const handleDeleteApp = async () => {
        setDeletingApp(true);
        try {
            const res = await fetch(`/api/apps/${appId}`, { method: 'DELETE' });
            const data = await res.json();
            if (res.ok && data.success) {
                showToast('App deleted successfully');
                setTimeout(() => router.push('/app-library'), 1000);
            } else {
                showToast(data.error || 'Failed to delete app.');
                setConfirmDeleteApp(false);
            }
        } catch {
            showToast('Network error during delete.');
            setConfirmDeleteApp(false);
        } finally {
            setDeletingApp(false);
        }
    };

    const handleDeleteVersion = async (versionId) => {
        setDeletingVersionId(versionId);
        try {
            const res = await fetch(`/api/apps/${appId}/versions/${versionId}`, { method: 'DELETE' });
            const data = await res.json();
            if (res.ok && data.success) {
                showToast('Version deleted successfully');
                setConfirmDeleteVersionId(null);
                // Refresh the app data
                const refreshRes = await fetch('/api/apps');
                const refreshData = await refreshRes.json();
                if (refreshData.success) {
                    const updatedApp = refreshData.apps.find(a => a.id === appId);
                    if (updatedApp) {
                        setApp(updatedApp);
                    } else {
                        // All versions removed, app no longer exists
                        router.push('/app-library');
                    }
                }
            } else {
                showToast(data.error || 'Failed to delete version.');
                setConfirmDeleteVersionId(null);
            }
        } catch {
            showToast('Network error during delete.');
            setConfirmDeleteVersionId(null);
        } finally {
            setDeletingVersionId(null);
        }
    };

    const handleSubmitVersion = async (e) => {
        e.preventDefault();
        if (!newVersion || !apkFileId) { showToast('Please provide version and APK File ID.'); return; }

        setSubmittingVersion(true);
        const formData = new FormData();
        formData.append('appId', appId);
        formData.append('appName', app.name);
        formData.append('version', newVersion);
        formData.append('apkFileId', apkFileId);
        if (newAndroidVersion) formData.append('androidVersion', newAndroidVersion);
        if (newFeatures) formData.append('features', newFeatures);

        try {
            const res = await fetch('/api/telegram/upload-version', { method: 'POST', body: formData });
            const data = await res.json();

            if (res.ok && data.success) {
                showToast('Version added successfully!');
                setShowAddVersionModal(false);
                setNewVersion('');
                setNewAndroidVersion('');
                setNewFeatures('');
                setApkFileId('');

                const refreshRes = await fetch('/api/apps');
                const refreshData = await refreshRes.json();
                if (refreshData.success) {
                    const updatedApp = refreshData.apps.find(a => a.id === appId);
                    setApp(updatedApp);
                }
            } else {
                showToast(data.error || 'Upload failed.');
            }
        } catch (error) {
            showToast('Network error during upload.');
        } finally {
            setSubmittingVersion(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] text-slate-500 text-sm">
                Loading...
            </div>
        );
    }

    if (!app) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <svg className="w-12 h-12 text-slate-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <h1 className="text-xl font-bold text-white mb-2">App Not Found</h1>
                <p className="text-slate-500 text-sm mb-5">The application you are looking for does not exist or has been removed.</p>
                <button onClick={() => router.push('/app-library')} className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold transition-colors">
                    Return to Library
                </button>
            </div>
        );
    }

    return (
        <div className="w-full pb-12">
            {/* Toast */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl shadow-2xl text-white text-sm font-semibold bg-[#749F8B]/90 border border-[#749F8B]/30 flex items-center gap-2 backdrop-blur-sm">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    {toast}
                </div>
            )}

            {/* ── HERO HEADER OVERHAUL ── */}
            <div className="relative overflow-hidden rounded-4xl border border-[#FEBD8B]/20 mb-6 group transition-all hover:border-[#FEBD8B]/40" style={{ background: 'linear-gradient(165deg, #0a0312 0%, #1A082E 100%)' }}>
                <div className="absolute top-0 right-0 w-full h-full opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.2) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#FEBD8B]/10 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[#749F8B]/10 rounded-full blur-[60px] pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-transparent via-[#FEBD8B]/40 to-transparent" />

                <div className="relative z-10 px-6 py-8 md:px-10 md:py-10">
                    <div className="flex flex-col lg:flex-row gap-8 items-start">
                        <div className="flex-1 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-4xl border-2 border-[#FEBD8B]/20 bg-[#110a17] p-1 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex items-center justify-center shrink-0 relative overflow-hidden group/icon">
                                <div className="absolute inset-0 bg-linear-to-br from-[#FEBD8B]/5 to-transparent transition-opacity group-hover/icon:opacity-100 opacity-0" />
                                {app.versions && app.versions.length > 0 && app.versions[0].imageUrl ? (
                                    <LoadingImage src={`/api/telegram/image/${app.versions[0].imageUrl}`} alt={app.name} className="w-full h-full object-cover rounded-[1.8rem] relative z-10" />
                                ) : app.iconStatic && app.iconStatic !== '📦' ? (
                                    <LoadingImage src={app.iconStatic} alt={app.name} className="w-full h-full object-cover rounded-[1.8rem] relative z-10" />
                                ) : (
                                    <span className="text-4xl text-[#FEBD8B]/30 font-black relative z-10">?</span>
                                )}
                            </div>

                            <div className="flex-1">
                                <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-3">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded bg-[#FEBD8B]/10 text-[#FEBD8B] border border-[#FEBD8B]/20">{app.category}</span>
                                    {app.versions?.[0]?.androidVersion && (
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded bg-[#749F8B]/10 text-[#749F8B] border border-[#749F8B]/20">Android {app.versions[0].androidVersion}</span>
                                    )}
                                </div>
                                <h1 className="text-2xl md:text-4xl font-black text-white tracking-tighter leading-none mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">{app.name}</h1>
                                <p className="text-[#FEBD8B]/60 font-mono tracking-widest text-xs uppercase font-bold">{app.developer || 'Unknown Labs'}</p>
                                
                                <div className="flex flex-wrap justify-center md:justify-start gap-6 mt-8">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">Downloads</span>
                                        <span className="text-lg font-bold text-white font-mono">{(app.downloadCount ?? 0).toLocaleString()}</span>
                                    </div>
                                    <div className="w-px h-8 bg-white/5 self-end mb-1" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">Page Views</span>
                                        <span className="text-lg font-bold text-white font-mono">{(app.viewCount ?? 0).toLocaleString()}</span>
                                    </div>
                                    <div className="w-px h-8 bg-white/5 self-end mb-1" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">Releases</span>
                                        <span className="text-lg font-bold text-white font-mono">{app.versions?.length ?? 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="w-full lg:w-64 flex flex-col gap-3">
                            {app.versions && app.versions.length > 0 && (
                                <button
                                    onClick={() => handleDownload(app.versions[0].apkUrl, app.versions[0].version)}
                                    className="relative w-full overflow-hidden px-8 py-4 rounded-2xl bg-[#749F8B] text-white font-black text-xs uppercase tracking-[0.2em] shadow-[0_0_25px_rgba(116,159,139,0.2)] hover:shadow-[0_0_35px_rgba(116,159,139,0.4)] transition-all flex items-center justify-center gap-3 active:scale-95"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    Initial Protocol
                                </button>
                            )}
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={handleCopyMainLink}
                                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-[#FEBD8B]/60 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                                >
                                    Share
                                </button>
                                {isUltra && (
                                    <button
                                        onClick={() => setShowAddVersionModal(true)}
                                        className="flex-1 px-4 py-3 rounded-xl bg-[#749F8B]/5 border border-[#749F8B]/20 text-[10px] font-black uppercase tracking-widest text-[#749F8B] hover:bg-[#749F8B]/10 transition-colors flex items-center justify-center gap-2"
                                    >
                                        Update
                                    </button>
                                )}
                            </div>
                            {isUltra && (
                                <button 
                                    onClick={() => setConfirmDeleteApp(true)}
                                    className="w-full px-4 py-2 rounded-xl border border-red-500/10 text-[9px] font-black uppercase tracking-[0.3em] text-red-500/40 hover:text-red-500 hover:border-red-500/30 transition-all text-center mt-1"
                                >
                                    Deconstruct App
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── TWO-COLUMN LAYOUT ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT COLUMN — Version List Overhaul */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-[2px] bg-[#FEBD8B] shadow-[0_0_8px_rgba(254,189,139,0.5)]" />
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FEBD8B]/80">Historical Records</h2>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {app.versions.map((vid, idx) => {
                            const isHighlighted = highlightedVersion === vid.version;
                            const isLatest = idx === 0;
                            return (
                                <div
                                    key={idx}
                                    id={vid.version}
                                    className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${isHighlighted ? 'bg-[#FEBD8B]/10 border-[#FEBD8B]/50 shadow-[0_0_30px_rgba(254,189,139,0.1)]' : 'bg-[#110a17] border-white/5 hover:border-[#FEBD8B]/20 hover:bg-[#FEBD8B]/2'}`}
                                >
                                    <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border font-mono text-xs font-black ${isLatest ? 'bg-[#749F8B]/10 border-[#749F8B]/30 text-[#749F8B]' : 'bg-white/5 border-white/10 text-slate-500'}`}>
                                                {isLatest ? 'NEW' : idx + 1}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-white font-mono tracking-tight">{vid.version}</span>
                                                    {isLatest && <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">Stable</span>}
                                                </div>
                                                <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500 font-medium">
                                                    <span>{new Date(vid.releaseDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                                    <span className="w-1 h-1 rounded-full bg-white/20" />
                                                    <span className="font-mono text-[#FEBD8B]/50 uppercase tracking-widest">{vid.androidVersion || 'SDK ANY'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 self-end sm:self-center">
                                            <button
                                                onClick={() => handleCopyVersionLink(vid.version)}
                                                className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-blue-400 hover:border-blue-500/30 transition-all"
                                                title="Copy Link"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                            </button>
                                            <button
                                                onClick={() => handleDownload(vid.apkUrl, vid.version)}
                                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#749F8B] text-white text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(116,159,139,0.2)] hover:shadow-[0_0_25px_rgba(116,159,139,0.4)] transition-all"
                                            >
                                                Download
                                            </button>
                                            {isUltra && (
                                                <button
                                                    onClick={() => setConfirmDeleteVersionId(vid.id)}
                                                    className="p-2.5 rounded-xl bg-red-500/5 border border-red-500/10 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {vid.features && (
                                        <div className="px-5 pb-5 pt-2 border-t border-white/2">
                                            <div className="bg-[#0a0312] rounded-xl p-4 border border-[#FEBD8B]/10">
                                                <div className="text-[9px] font-black text-[#FEBD8B]/60 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-[#FEBD8B] group-hover:animate-pulse" />
                                                    Changelog Details
                                                </div>
                                                <ul className="space-y-2">
                                                    {vid.features.split('\n').filter(f => f.trim()).map((feat, i) => (
                                                        <li key={i} className="flex items-start gap-3 text-xs text-slate-400 font-medium">
                                                            <span className="text-[#FEBD8B]/40 mt-0.5">»</span>
                                                            <span className="leading-relaxed">{feat}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="rounded-2xl border border-[#FEBD8B]/10 bg-[#110a17] overflow-hidden shadow-xl">
                        <div className="px-5 py-4 border-b border-[#FEBD8B]/5 bg-[#0a0312]">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FEBD8B]/60">Core Parameters</p>
                        </div>
                        <div className="p-5 space-y-4">
                            {[
                                { label: 'Codename', value: app.name },
                                { label: 'Origin', value: app.developer || 'Unknown Labs' },
                                { label: 'Class', value: app.category },
                                ...(app.versions && app.versions.length > 0 ? [
                                    { label: 'Integrity', value: app.versions[0].version },
                                    { label: 'Registry', value: new Date(app.versions[0].releaseDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) },
                                    { label: 'OS Build', value: app.versions[0].androidVersion ? `Android ${app.versions[0].androidVersion}` : 'Generic' },
                                ] : []),
                            ].map((row, i) => (
                                <div key={i} className="flex flex-col gap-1">
                                    <span className="text-[9px] text-slate-600 uppercase font-black tracking-widest">{row.label}</span>
                                    <span className="text-xs text-[#FEBD8B]/90 font-bold truncate">{row.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {app.description && (
                        <div className="rounded-2xl border border-white/5 bg-[#080b18] overflow-hidden">
                            <div className="px-5 py-4 border-b border-white/5 bg-[#0a0d18]">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Documentation</p>
                            </div>
                            <div className="p-5">
                                <p className="text-xs text-slate-400 leading-relaxed font-medium italic opacity-80">"{app.description}"</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-3">
                        <div className="p-1 rounded-2xl bg-linear-to-r from-[#FEBD8B]/20 to-[#749F8B]/20">
                            <button
                                onClick={() => handleDownload(app.versions?.[0]?.apkUrl, app.versions?.[0]?.version)}
                                className="w-full bg-[#1A082E] hover:bg-transparent transition-all rounded-[calc(1rem-4px)] px-6 py-4 flex items-center justify-between group shadow-2xl"
                            >
                                <div className="flex flex-col items-start gap-1">
                                    <span className="text-[10px] font-black text-[#FEBD8B] uppercase tracking-widest">Execute Download</span>
                                    <span className="text-xs font-bold text-white font-mono">LATEST_BUILD.APK</span>
                                </div>
                                <svg className="w-5 h-5 text-[#FEBD8B] group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Download Queue Overlay */}
            {downloads.length > 0 && (
                <div className="fixed bottom-6 right-6 z-50 w-80 max-h-[60vh] overflow-y-auto pointer-events-none flex flex-col font-mono">
                    <div className="pointer-events-auto flex flex-col gap-0 bg-[#06080e]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-[#FEBD8B]/50 to-transparent" />
                        <div className="flex items-center justify-between mb-4 px-1">
                            <span className="text-[11px] font-black uppercase tracking-widest text-[#FEBD8B] flex items-center gap-2">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Transfer Queue
                            </span>
                            <span className="text-[10px] bg-white/10 text-slate-300 px-2 rounded-full py-0.5">{downloads.length} active</span>
                        </div>

                        <div className="relative pl-3 space-y-4">
                            <div className="absolute left-[15px] top-2 bottom-6 w-px bg-white/10" />
                            {downloads.map((d) => (
                                <div key={d.id} className="relative z-10">
                                    <div className={`absolute -left-[5px] top-1.5 w-2 h-2 rounded-full border border-[#06080e] shadow-[0_0_0_2px_#06080e] ${d.status === 'loading' ? 'bg-[#FEBD8B] animate-pulse' : d.status === 'error' ? 'bg-red-500' : 'bg-[#749F8B]'}`} />
                                    <div className="ml-5">
                                        <div className="text-[10px] text-slate-500 mb-1 ml-1 flex justify-between">
                                            <span>v{d.version}</span>
                                            <span>{d.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                        </div>
                                        <div className={`p-3 rounded-xl border relative ${d.status === 'loading' ? 'bg-[#FEBD8B]/5 border-[#FEBD8B]/20' : d.status === 'error' ? 'bg-red-500/5 border-red-500/20' : 'bg-[#749F8B]/5 border-[#749F8B]/20'}`}>
                                            <div className={`absolute top-2 -left-1.5 w-3 h-3 rotate-45 border-l border-b bg-[#06080e] ${d.status === 'loading' ? 'border-[#FEBD8B]/20' : d.status === 'error' ? 'border-red-500/20' : 'border-[#749F8B]/20'}`} />
                                            <div className="flex items-start gap-3 relative z-10">
                                                {d.status === 'loading' && (
                                                    <div className="shrink-0 mt-0.5">
                                                        <svg className="animate-spin w-4 h-4 text-[#FEBD8B]" viewBox="0 0 24 24" fill="none">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                    </div>
                                                )}
                                                {d.status === 'error' && (
                                                    <div className="shrink-0 mt-0.5 text-red-400">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    </div>
                                                )}
                                                {d.status === 'success' && (
                                                    <div className="shrink-0 mt-0.5 text-emerald-400">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className={`text-xs font-black truncate ${d.status === 'loading' ? 'text-[#FEBD8B]/90' : d.status === 'error' ? 'text-red-100' : 'text-[#749F8B]'}`}>
                                                        {d.status === 'loading' ? 'Downloading...' : d.status === 'error' ? 'Download Failed' : 'Download Complete'}
                                                    </div>
                                                    {d.errorMsg && (
                                                        <div className="text-[10px] text-red-400/80 mt-1 leading-tight max-w-[200px] border-l-2 border-red-500/30 pl-2">
                                                            {d.errorMsg}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Add Version Modal ── */}
            {showAddVersionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#1A082E] border border-[#FEBD8B]/20 rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6 space-y-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-white">Add New Release</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">for {app.name}</p>
                                </div>
                                <button onClick={() => !submittingVersion && setShowAddVersionModal(false)} className="text-slate-600 hover:text-white transition-colors" disabled={submittingVersion}>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <form onSubmit={handleSubmitVersion} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">Version Number <span className="text-red-400">*</span></label>
                                    <input
                                        required
                                        type="text"
                                        value={newVersion}
                                        onChange={(e) => setNewVersion(e.target.value)}
                                        placeholder="e.g. v2.0.0"
                                        className="w-full bg-[#0a0312] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FEBD8B]/40 transition-colors font-mono"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">Android Version</label>
                                    <input
                                        type="text"
                                        value={newAndroidVersion}
                                        onChange={(e) => setNewAndroidVersion(e.target.value)}
                                        placeholder="e.g. 8.0+"
                                        className="w-full bg-[#0a0312] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FEBD8B]/40 transition-colors"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">Release Notes</label>
                                    <textarea
                                        rows={3}
                                        value={newFeatures}
                                        onChange={(e) => setNewFeatures(e.target.value)}
                                        placeholder="What's new? (one item per line)"
                                        className="w-full bg-[#0a0312] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FEBD8B]/40 transition-colors resize-none"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">APK File ID <span className="text-red-400">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        value={apkFileId}
                                        onChange={(e) => setApkFileId(e.target.value)}
                                        placeholder="Paste Telegram file ID here"
                                        className="w-full bg-[#0a0312] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FEBD8B]/40 transition-colors font-mono"
                                    />
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">
                                        Telegram Document File ID
                                    </p>
                                </div>

                                <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                                    <button type="button" onClick={() => setShowAddVersionModal(false)} disabled={submittingVersion} className="px-4 py-2 border border-white/10 hover:bg-white/5 text-slate-400 text-sm font-medium rounded-xl transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={submittingVersion || !newVersion || !apkFileId} className="flex items-center gap-2 px-5 py-2 bg-[#749F8B] hover:bg-[#749F8B]/80 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-50">
                                        {submittingVersion ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                                                Saving...
                                            </>
                                        ) : 'Save Release'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            {/* Delete App Confirmation Modal */}
            {confirmDeleteApp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#1A082E] border border-red-500/20 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Deconstruct App?</h3>
                        <p className="text-xs text-slate-500 mb-6">This action will permanently remove <span className="text-white font-bold">{app.name}</span> and all its versions from the core registry.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmDeleteApp(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-slate-400 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all">Cancel</button>
                            <button onClick={handleDeleteApp} disabled={deletingApp} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50">
                                {deletingApp ? 'Processing...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Version Confirmation Modal */}
            {confirmDeleteVersionId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#1A082E] border border-red-500/20 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Delete Version?</h3>
                        <p className="text-xs text-slate-500 mb-6">Are you sure you want to remove this specific build from the archive?</p>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmDeleteVersionId(null)} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-slate-400 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all">Cancel</button>
                            <button 
                                onClick={() => handleDeleteVersion(confirmDeleteVersionId)} 
                                disabled={deletingVersionId === confirmDeleteVersionId} 
                                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                            >
                                {deletingVersionId === confirmDeleteVersionId ? 'Processing...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
