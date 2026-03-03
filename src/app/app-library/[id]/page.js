'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

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
            const contentDisposition = res.headers.get('Content-Disposition') || '';
            const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            const filename = match ? match[1].replace(/['"]/g, '') : 'download.apk';

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
            <div className="flex items-center justify-center min-h-[60vh] text-gray-500 text-sm">
                Loading...
            </div>
        );
    }

    if (!app) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <svg className="w-12 h-12 text-gray-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <h1 className="text-xl font-bold text-white mb-2">App Not Found</h1>
                <p className="text-gray-500 text-sm mb-5">The application you are looking for does not exist or has been removed.</p>
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
                <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl shadow-2xl text-white text-sm font-semibold bg-emerald-500/90 border border-emerald-400/30 flex items-center gap-2 backdrop-blur-sm">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    {toast}
                </div>
            )}

            {/* ── HERO HEADER ── */}
            <div className="relative overflow-hidden rounded-2xl mb-5" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0e1535 50%, #080c1a 100%)' }}>
                {/* Decorative corner accent */}
                <div className="absolute top-0 right-0 w-64 h-64 opacity-20" style={{ background: 'radial-gradient(circle at top right, #3b82f6, transparent 70%)' }} />
                <div className="absolute bottom-0 left-0 w-48 h-48 opacity-10" style={{ background: 'radial-gradient(circle at bottom left, #818cf8, transparent 70%)' }} />
                {/* Grid texture */}
                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

                <div className="relative z-10 px-6 py-5 md:px-8 md:py-6">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-1.5 text-xs mb-5">
                        <button onClick={() => router.push('/app-library')} className="flex items-center gap-1 text-blue-400/60 hover:text-blue-300">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                            App Library
                        </button>
                        <svg className="w-3 h-3 text-blue-400/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        <span className="text-blue-200/80 font-medium truncate max-w-[180px]">{app.name}</span>
                    </nav>

                    {/* Main header row */}
                    <div className="flex flex-col lg:flex-row lg:items-center gap-5">

                        {/* Icon + App identity */}
                        <div className="flex gap-5 items-center flex-1 min-w-0">
                            {/* Large icon */}
                            <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl border border-white/10 flex items-center justify-center shrink-0 overflow-hidden shadow-2xl" style={{ background: 'linear-gradient(145deg, #111827, #1e2740)' }}>
                                {app.versions && app.versions.length > 0 && app.versions[0].imageUrl ? (
                                    <img src={`/api/telegram/image/${app.versions[0].imageUrl}`} alt={app.name} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = '/icons/default-app-icon.svg'; }} />
                                ) : app.iconStatic && app.iconStatic !== '📦' ? (
                                    <img src={app.iconStatic} alt={app.name} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = '/icons/default-app-icon.svg'; }} />
                                ) : (
                                    <svg width="44" height="44" viewBox="0 0 512 512" fill="currentColor" className="text-blue-400/50">
                                        <path d="M256,0C114.6,0,0,114.6,0,256s114.6,256,256,256s256-114.6,256-256S397.4,0,256,0z M415.8,415.7 c-20.8,20.8-44.9,37.1-71.8,48.4c-27.8,11.8-57.4,17.7-88,17.7c-30.5,0-60.1-6-88-17.7c-26.9-11.4-51.1-27.7-71.8-48.4 c-20.8-20.8-37.1-44.9-48.4-71.8C36,316.1,30,286.5,30,256s6-60.1,17.7-88c11.4-26.9,27.7-51.1,48.4-71.8 c20.9-20.8,45-37.1,71.9-48.5C195.9,36,225.5,30,256,30s60.1,6,88,17.7c26.9,11.4,51.1,27.7,71.8,48.4 c20.8,20.8,37.1,44.9,48.4,71.8c11.8,27.8,17.7,57.4,17.7,88c0,30.5-6,60.1-17.7,88C452.8,370.8,436.5,395,415.8,415.7z" />
                                        <path d="M294.2,150.3l2.8-4.2l2.8-4.1l6.2-9.3c0.8-1.1,0.5-2.7-0.7-3.4c-1.1-0.8-2.7-0.5-3.4,0.7l-6.6,9.9l-2.8,4.2l-2.8,4.2 c-9-3.5-18.9-5.4-29.5-5.4c-10.5,0-20.5,1.9-29.5,5.4l-2.8-4.2l-2.8-4.2l-6.6-9.9c-0.8-1.1-2.3-1.4-3.4-0.7 c-1.1,0.8-1.4,2.3-0.7,3.4l6.2,9.3l2.8,4.1l2.8,4.2c-21,9.8-35.3,28.3-35.3,49.6h138.7C329.5,178.6,315.3,160.1,294.2,150.3z M230.4,180c-4.1,0-7.4-3.3-7.4-7.4s3.3-7.4,7.4-7.4c4.1,0,7.4,3.3,7.4,7.4C237.8,176.7,234.5,180,230.4,180z M289.8,180 c-4.1,0-7.4-3.3-7.4-7.4s3.3-7.4,7.4-7.4c4.1,0,7.4,3.3,7.4,7.4C297.3,176.7,294,180,289.8,180z" />
                                        <path d="M191.8,209.8h-1.1v12.3v10.1v86.6c0,8.7,7,15.7,15.7,15.7h11.3c-0.4,1.3-0.6,2.7-0.6,4.1v0.8v5V370 c0,8.2,6.7,14.9,14.9,14.9s14.9-6.7,14.9-14.9v-25.6v-5v-0.8c0-1.4-0.2-2.8-0.6-4.1h27.6c-0.4,1.3-0.6,2.7-0.6,4.1v0.8v5V370 c0,8.2,6.7,14.9,14.9,14.9c8.2,0,14.9-6.7,14.9-14.9v-25.6v-5v-0.8c0-1.4-0.2-2.8-0.6-4.1h11.3c8.7,0,15.7-7,15.7-15.7v-86.6v-10.1 v-12.4h-1.1H191.8V209.8z" />
                                        <path d="M166,209.8c-8.2,0-14.9,6.7-14.9,14.9v63.6c0,8.2,6.7,14.9,14.9,14.9c8.2,0,14.9-6.7,14.9-14.9v-63.6 C180.8,216.4,174.2,209.8,166,209.8z" />
                                        <path d="M354.3,209.8c-8.2,0-14.9,6.7-14.9,14.9v63.6c0,8.2,6.7,14.9,14.9,14.9c8.2,0,14.9-6.7,14.9-14.9v-63.6 C369.1,216.4,362.5,209.8,354.3,209.8z" />
                                    </svg>
                                )}
                            </div>

                            {/* App name + tags */}
                            <div className="flex-1 min-w-0">
                                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-none">{app.name}</h1>
                                {app.developer && <p className="text-sm text-blue-300/60 mt-1 font-medium">{app.developer}</p>}
                                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400/80 bg-blue-500/10 border border-blue-500/15 px-1.5 py-0.5 rounded">{app.category}</span>
                                    {app.versions && app.versions.length > 0 && app.versions[0].androidVersion && (
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/70 bg-emerald-500/8 border border-emerald-500/15 px-1.5 py-0.5 rounded">Android {app.versions[0].androidVersion}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-col gap-2.5 shrink-0 w-full lg:w-52">
                            {app.versions && app.versions.length > 0 && (
                                <button
                                    onClick={() => handleDownload(app.versions[0].apkUrl, app.versions[0].version)}
                                    className="w-full flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl text-sm font-black text-white border border-blue-400/30"
                                    style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)' }}
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    Download APK
                                </button>
                            )}
                            <button
                                onClick={handleCopyMainLink}
                                className="w-full flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-300 bg-white/5 border border-white/8 hover:bg-white/10"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                                Share App
                            </button>
                            {isUltra && (
                                <button
                                    onClick={() => setShowAddVersionModal(true)}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                                    Add Release
                                </button>
                            )}
                            {isUltra && (
                                <div className="pt-1 border-t border-white/5">
                                    {confirmDeleteApp ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setConfirmDeleteApp(false)}
                                                disabled={deletingApp}
                                                className="flex-1 px-3 py-2 rounded-xl text-xs font-bold text-gray-400 border border-white/8 bg-white/4 hover:bg-white/8"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleDeleteApp}
                                                disabled={deletingApp}
                                                className="flex-1 px-3 py-2 rounded-xl text-xs font-black text-red-400 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20"
                                            >
                                                {deletingApp ? 'Deleting…' : 'Confirm Delete'}
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setConfirmDeleteApp(true)}
                                            className="w-full flex items-center justify-center gap-2 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-red-400/70 bg-red-500/8 border border-red-500/15 hover:bg-red-500/15"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            Delete App
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats strip */}
                    <div className="flex items-stretch gap-0 mt-5 border-t border-white/5 pt-4">
                        {[
                            { label: 'Downloads', value: (app.downloadCount ?? 0).toLocaleString(), icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4', color: 'text-blue-400' },
                            { label: 'Page Views', value: (app.viewCount ?? 0).toLocaleString(), icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z', color: 'text-purple-400' },
                            { label: 'Versions', value: app.versions?.length ?? 0, icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z', color: 'text-amber-400' },
                            { label: 'Latest', value: app.versions?.[0]?.version ?? '—', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z', color: 'text-emerald-400' },
                        ].map((stat, i) => (
                            <div key={i} className={`flex items-center gap-3 flex-1 ${i > 0 ? 'pl-4 border-l border-white/5 ml-4' : ''}`}>
                                <div className={`${stat.color} opacity-60 shrink-0`}>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={stat.icon} /></svg>
                                </div>
                                <div>
                                    <div className="text-sm font-black text-white font-mono">{stat.value}</div>
                                    <div className="text-[10px] text-gray-600 uppercase tracking-wider hidden sm:block">{stat.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── TWO-COLUMN LAYOUT ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* LEFT COLUMN — Version List */}
                <div className="lg:col-span-2 space-y-3">
                    {/* Section header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-4 rounded-full" style={{ background: 'linear-gradient(to bottom, #3b82f6, #818cf8)' }} />
                            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">Release History</h2>
                            <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded-md">{app.versions.length}</span>
                        </div>
                    </div>

                    {/* Version Table */}
                    <div className="rounded-2xl overflow-hidden border border-white/5" style={{ background: '#080b14' }}>
                        {/* Table Header */}
                        <div className="grid grid-cols-12 px-5 py-2.5 border-b border-white/5" style={{ background: '#0a0d18' }}>
                            <div className="col-span-4 text-[10px] font-black uppercase tracking-widest text-gray-600">Version</div>
                            <div className="col-span-3 text-[10px] font-black uppercase tracking-widest text-gray-600 hidden sm:block">Date</div>
                            <div className="col-span-2 text-[10px] font-black uppercase tracking-widest text-gray-600 hidden md:block">Android</div>
                            <div className="col-span-3 text-[10px] font-black uppercase tracking-widest text-gray-600 text-right">Actions</div>
                        </div>

                        {/* Version Rows */}
                        {app.versions.map((vid, idx) => {
                            const isHighlighted = highlightedVersion === vid.version;
                            const isLatest = idx === 0;
                            return (
                                <div
                                    key={idx}
                                    id={vid.version}
                                    className={`border-b border-white/4 last:border-0 ${isHighlighted ? 'bg-blue-500/5' : 'bg-transparent hover:bg-white/2'}`}
                                >
                                    <div className="grid grid-cols-12 px-5 py-3.5 items-center">
                                        {/* Version */}
                                        <div className="col-span-4 flex items-center gap-2 min-w-0">
                                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isLatest ? 'bg-emerald-400' : 'bg-gray-700'}`} />
                                            <span className="text-sm font-black text-white font-mono tracking-tight">{vid.version}</span>
                                            {isLatest && (
                                                <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded shrink-0 hidden sm:inline">Latest</span>
                                            )}
                                        </div>
                                        {/* Date */}
                                        <div className="col-span-3 text-xs text-gray-500 hidden sm:block">
                                            {new Date(vid.releaseDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </div>
                                        {/* Android */}
                                        <div className="col-span-2 text-xs text-gray-600 font-mono hidden md:block">
                                            {vid.androidVersion || '—'}
                                        </div>
                                        {/* Actions */}
                                        <div className="col-span-8 sm:col-span-5 md:col-span-3 flex items-center justify-end gap-2">
                                            {isUltra && confirmDeleteVersionId === vid.id ? (
                                                <>
                                                    <button
                                                        onClick={() => setConfirmDeleteVersionId(null)}
                                                        className="px-2 py-1.5 rounded-lg text-[11px] font-semibold border border-white/8 bg-white/3 text-gray-500"
                                                    >Cancel</button>
                                                    <button
                                                        onClick={() => handleDeleteVersion(vid.id)}
                                                        disabled={deletingVersionId === vid.id}
                                                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-black border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                                    >{deletingVersionId === vid.id ? '…' : 'Delete'}</button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleCopyVersionLink(vid.version)}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-white/8 bg-white/3 hover:bg-white/8 text-gray-500 hover:text-gray-200"
                                                    >
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                                        {isHighlighted ? 'Copied' : 'Link'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownload(vid.apkUrl, vid.version)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black border border-blue-500/25 text-blue-400 hover:bg-blue-500/15"
                                                        style={{ background: 'rgba(59,130,246,0.08)' }}
                                                    >
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                        Download
                                                    </button>
                                                    {isUltra && (
                                                        <button
                                                            onClick={() => setConfirmDeleteVersionId(vid.id)}
                                                            className="flex items-center justify-center w-7 h-7 rounded-lg border border-red-500/15 bg-red-500/5 text-red-400/50 hover:bg-red-500/15 hover:text-red-400"
                                                            title="Delete version"
                                                        >
                                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Release Notes */}
                                    {vid.features && (
                                        <div className="px-5 pb-3.5 border-t border-white/4">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-700 mt-3 mb-2">What's new</p>
                                            <ul className="space-y-1">
                                                {vid.features.split('\n').filter(f => f.trim()).map((feat, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-xs text-gray-500">
                                                        <span className="text-blue-500/50 select-none mt-0.5 shrink-0">▸</span>
                                                        <span className="leading-relaxed">{feat}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* RIGHT COLUMN — App Info Sidebar */}
                <div className="space-y-4">

                    {/* App Info Card */}
                    <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: '#080b14' }}>
                        <div className="px-4 py-3 border-b border-white/5" style={{ background: '#0a0d18' }}>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">App Information</p>
                        </div>
                        <div className="p-4 space-y-0">
                            {[
                                { label: 'App Name', value: app.name },
                                { label: 'Developer', value: app.developer || 'Unknown' },
                                { label: 'Category', value: app.category },
                                ...(app.versions && app.versions.length > 0 ? [
                                    { label: 'Current Version', value: app.versions[0].version },
                                    { label: 'Updated', value: new Date(app.versions[0].releaseDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) },
                                    { label: 'Android Required', value: app.versions[0].androidVersion ? `Android ${app.versions[0].androidVersion}` : 'Any' },
                                ] : []),
                                { label: 'Total Versions', value: String(app.versions?.length ?? 0) },
                            ].map((row, i, arr) => (
                                <div key={i} className={`flex items-start justify-between gap-3 py-2.5 ${i < arr.length - 1 ? 'border-b border-white/4' : ''}`}>
                                    <span className="text-[11px] text-gray-600 shrink-0">{row.label}</span>
                                    <span className="text-[11px] text-gray-200 font-semibold text-right truncate max-w-[130px]">{row.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Description Card */}
                    {app.description && (
                        <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: '#080b14' }}>
                            <div className="px-4 py-3 border-b border-white/5" style={{ background: '#0a0d18' }}>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">About</p>
                            </div>
                            <div className="p-4">
                                <p className="text-xs text-gray-400 leading-relaxed">{app.description}</p>
                            </div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: '#080b14' }}>
                        <div className="px-4 py-3 border-b border-white/5" style={{ background: '#0a0d18' }}>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">Quick Actions</p>
                        </div>
                        <div className="p-3 space-y-2">
                            {app.versions && app.versions.length > 0 && (
                                <button
                                    onClick={() => handleDownload(app.versions[0].apkUrl, app.versions[0].version)}
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-black text-white border border-blue-400/20"
                                    style={{ background: 'linear-gradient(135deg, #1d4ed8, #4338ca)' }}
                                >
                                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    <span>Download Latest APK</span>
                                </button>
                            )}
                            <button
                                onClick={handleCopyMainLink}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-300 border border-white/8 bg-white/4 hover:bg-white/8"
                            >
                                <svg className="w-4 h-4 shrink-0 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                                <span>Copy Share Link</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Download Queue Overlay (Timeline / Chat Bubble Style) */}
            {downloads.length > 0 && (
                <div className="fixed bottom-6 right-6 z-50 w-80 max-h-[60vh] overflow-y-auto pointer-events-none flex flex-col font-mono">
                    <div className="pointer-events-auto flex flex-col gap-0 bg-[#06080e]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl relative overflow-hidden">
                        {/* Shimmer header line */}
                        <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-blue-500/50 to-transparent" />

                        <div className="flex items-center justify-between mb-4 px-1">
                            <span className="text-[11px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-2">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Transfer Queue
                            </span>
                            <span className="text-[10px] bg-white/10 text-gray-300 px-2 rounded-full py-0.5">{downloads.length} active</span>
                        </div>

                        <div className="relative pl-3 space-y-4">
                            {/* Vertical timeline line */}
                            <div className="absolute left-[15px] top-2 bottom-6 w-px bg-white/10" />

                            {downloads.map((d) => (
                                <div key={d.id} className="relative z-10">
                                    {/* Timeline dot */}
                                    <div className={`absolute -left-[5px] top-1.5 w-2 h-2 rounded-full border border-[#06080e] shadow-[0_0_0_2px_#06080e] ${d.status === 'loading' ? 'bg-blue-500 animate-pulse' :
                                        d.status === 'error' ? 'bg-red-500' : 'bg-emerald-500'
                                        }`} />

                                    {/* Bubble */}
                                    <div className="ml-5">
                                        <div className="text-[10px] text-gray-500 mb-1 ml-1 flex justify-between">
                                            <span>v{d.version}</span>
                                            <span>{d.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                        </div>
                                        <div className={`p-3 rounded-xl border relative ${d.status === 'loading' ? 'bg-blue-500/5 border-blue-500/20' :
                                            d.status === 'error' ? 'bg-red-500/5 border-red-500/20' :
                                                'bg-emerald-500/5 border-emerald-500/20'
                                            }`}>
                                            {/* Chat tail pointer */}
                                            <div className={`absolute top-2 -left-1.5 w-3 h-3 rotate-45 border-l border-b bg-[#06080e] ${d.status === 'loading' ? 'border-blue-500/20' :
                                                d.status === 'error' ? 'border-red-500/20' :
                                                    'border-emerald-500/20'
                                                }`} />

                                            <div className="flex items-start gap-3 relative z-10">
                                                {d.status === 'loading' && (
                                                    <div className="shrink-0 mt-0.5">
                                                        <svg className="animate-spin w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none">
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
                                                    <div className={`text-xs font-black truncate ${d.status === 'loading' ? 'text-blue-100' :
                                                        d.status === 'error' ? 'text-red-100' :
                                                            'text-emerald-100'
                                                        }`}>
                                                        {d.status === 'loading' ? 'Downloading...' :
                                                            d.status === 'error' ? 'Download Failed' :
                                                                'Download Complete'}
                                                    </div>
                                                    {d.errorMsg && (
                                                        <div className="text-[10px] text-red-400/80 mt-1 leading-tight max-w-[200px] border-l-2 border-red-500/30 pl-2">
                                                            {d.errorMsg}
                                                        </div>
                                                    )}
                                                    {d.status === 'error' && (
                                                        <button
                                                            onClick={() => handleDownload(
                                                                app.versions.find(v => v.version === d.version)?.apkUrl,
                                                                d.version
                                                            )}
                                                            className="mt-2 text-[10px] font-bold text-red-300 bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1 rounded inline-flex items-center gap-1 transition-colors"
                                                        >
                                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                                            Retry
                                                        </button>
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
                    <div className="bg-[#0f1420] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6 space-y-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-bold text-white">Add New Release</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">for {app.name}</p>
                                </div>
                                <button onClick={() => !submittingVersion && setShowAddVersionModal(false)} className="text-gray-600 hover:text-white transition-colors" disabled={submittingVersion}>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <form onSubmit={handleSubmitVersion} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block">Version Number <span className="text-red-400">*</span></label>
                                    <input
                                        required
                                        type="text"
                                        value={newVersion}
                                        onChange={(e) => setNewVersion(e.target.value)}
                                        placeholder="e.g. v2.0.0"
                                        className="w-full bg-[#0a0d16] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/40 transition-colors font-mono"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block">Android Version</label>
                                    <input
                                        type="text"
                                        value={newAndroidVersion}
                                        onChange={(e) => setNewAndroidVersion(e.target.value)}
                                        placeholder="e.g. 8.0+"
                                        className="w-full bg-[#0a0d16] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/40 transition-colors"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block">Release Notes</label>
                                    <textarea
                                        rows={3}
                                        value={newFeatures}
                                        onChange={(e) => setNewFeatures(e.target.value)}
                                        placeholder="What's new? (one item per line)"
                                        className="w-full bg-[#0a0d16] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/40 transition-colors resize-none"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block">APK File ID <span className="text-red-400">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        value={apkFileId}
                                        onChange={(e) => setApkFileId(e.target.value)}
                                        placeholder="Paste Telegram file ID here"
                                        className="w-full bg-[#0a0d16] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/40 transition-colors font-mono"
                                    />
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
                                        Telegram Document File ID
                                    </p>
                                </div>

                                <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                                    <button type="button" onClick={() => setShowAddVersionModal(false)} disabled={submittingVersion} className="px-4 py-2 border border-white/10 hover:bg-white/5 text-gray-400 text-sm font-medium rounded-xl transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={submittingVersion || !newVersion || !apkFileId} className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-50">
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
        </div>
    );
}
