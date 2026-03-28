'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AddAppPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isUltra, setIsUltra] = useState(false);
    const [toast, setToast] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [appName, setAppName] = useState('');
    const [version, setVersion] = useState('');
    const [category, setCategory] = useState('Mod');
    const [description, setDescription] = useState('');
    const [apkFileId, setApkFileId] = useState('');
    const [imageFileId, setImageFileId] = useState('');

    const router = useRouter();

    useEffect(() => {
        const init = async () => {
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

            if (userRole !== 'ULTRA') {
                router.push('/app-library');
                return;
            }

            setIsUltra(true);
            setLoading(false);
        };
        init();
    }, [router]);

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!appName || !version || !apkFileId) {
            showToast('Please fill in all required fields and enter an APK File ID.', 'error');
            return;
        }

        setSubmitting(true);
        const formData = new FormData();
        formData.append('appName', appName);
        formData.append('version', version);
        formData.append('category', category);
        formData.append('description', description);
        formData.append('apkFileId', apkFileId);
        if (imageFileId) formData.append('imageFileId', imageFileId);

        try {
            const res = await fetch('/api/telegram/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (res.ok && data.success) {
                showToast('App uploaded successfully!', 'success');
                setTimeout(() => {
                    router.push('/app-library');
                }, 1500);
            } else {
                showToast(data.error || 'Upload failed.', 'error');
            }
        } catch (error) {
            showToast('Network error during upload.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return null; // or a simple spinner

    return (
        <div className="max-w-[800px] mx-auto space-y-8 pb-12">
            {toast && (
                <div className={`fixed bottom-4 right-4 z-50 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-bold animate-fade-in-up border ${toast.type === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-400' :
                    toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' :
                        'bg-blue-500/10 border-blue-500/50 text-blue-400'
                    }`}>
                    <div className="flex items-center gap-2">
                        {toast.type === 'error' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        {toast.type === 'success' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                        {toast.message}
                    </div>
                </div>
            )}

            {/* Header */}
            <div>
                <nav className="flex text-xs text-gray-500 mb-6 font-medium">
                    <Link href="/" className="hover:text-blue-400 transition-colors flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                        Dashboard
                    </Link>
                    <svg className="w-3 h-3 mx-2 self-center opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    <Link href="/app-library" className="hover:text-blue-400 transition-colors">App Library</Link>
                    <svg className="w-3 h-3 mx-2 self-center opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    <span className="text-gray-300">Add New App</span>
                </nav>

                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-black text-white tracking-tight">Add New App</h1>
                    <p className="text-gray-400 text-sm">Create your application record. Direct file IDs are securely attached.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-[#0f1420] border border-white/5 rounded-[18px] p-6 md:p-8 shadow-2xl space-y-10">

                {/* 1. App Information */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                        <div className="w-6 h-6 rounded bg-blue-500/10 text-blue-400 flex items-center justify-center">
                            <span className="text-xs font-black">1</span>
                        </div>
                        <h2 className="text-lg font-bold text-gray-200">App Information</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block">App Name <span className="text-red-400">*</span></label>
                            <input
                                required
                                type="text"
                                value={appName}
                                onChange={(e) => setAppName(e.target.value)}
                                placeholder="e.g. Devora Scanner"
                                className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block">Version <span className="text-red-400">*</span></label>
                            <input
                                required
                                type="text"
                                value={version}
                                onChange={(e) => setVersion(e.target.value)}
                                placeholder="e.g. v1.0.0"
                                className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block">Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50 transition-colors appearance-none"
                            >
                                <option value="Mod">Mod</option>
                                <option value="Original">Original</option>
                            </select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block">Description</label>
                            <textarea
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Briefly describe what the app does..."
                                className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* 2. File IDs */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                        <div className="w-6 h-6 rounded bg-purple-500/10 text-purple-400 flex items-center justify-center">
                            <span className="text-xs font-black">2</span>
                        </div>
                        <h2 className="text-lg font-bold text-gray-200">File Storage Links</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block">APK File ID <span className="text-red-400">*</span></label>
                            <input
                                required
                                type="text"
                                value={apkFileId}
                                onChange={(e) => setApkFileId(e.target.value)}
                                placeholder="Paste Telegram file ID here"
                                className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors font-mono"
                            />
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
                                Telegram Document File ID
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block">App Icon File ID (Optional)</label>
                            <input
                                type="text"
                                value={imageFileId}
                                onChange={(e) => setImageFileId(e.target.value)}
                                placeholder="Paste Telegram photo ID here"
                                className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-fuchsia-500/50 transition-colors font-mono"
                            />
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
                                Telegram Photo File ID
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col-reverse md:flex-row justify-end gap-3 pt-4 border-t border-white/5">
                    <Link href="/app-library">
                        <button
                            type="button"
                            className="w-full md:w-auto px-6 py-3 bg-transparent border border-white/10 hover:bg-white/5 hover:border-white/20 text-gray-300 font-bold text-sm rounded-xl transition-all"
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                    </Link>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100"
                    >
                        {submitting ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Saving to Database...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                Upload & Save App
                            </>
                        )}
                    </button>
                </div>

                {submitting && (
                    <div className="w-full bg-gray-900 rounded-full h-1 overflow-hidden mt-4">
                        <div className="bg-blue-500 h-1 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.6)] w-full"></div>
                    </div>
                )}
            </form>
        </div>
    );
}
