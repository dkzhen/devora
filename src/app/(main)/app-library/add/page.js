'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { HeroHeader, LoadingState } from '@/components/HeroHeader';

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
    const [storageMethod, setStorageMethod] = useState('telegram'); // 'telegram' or 'cloudisk'
    const [apkFileId, setApkFileId] = useState('');
    const [imageFileId, setImageFileId] = useState('');
    const [apkFile, setApkFile] = useState(null);

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

        // Validation based on storage method
        if (storageMethod === 'telegram') {
            if (!appName || !version || !apkFileId) {
                showToast('Please fill in all required fields and enter an APK File ID.', 'error');
                return;
            }
        } else {
            if (!appName || !version || !apkFile) {
                showToast('Please fill in all required fields and select an APK file.', 'error');
                return;
            }
        }

        setSubmitting(true);
        const formData = new FormData();
        formData.append('appName', appName);
        formData.append('version', version);
        formData.append('category', category);
        formData.append('description', description);

        if (storageMethod === 'telegram') {
            formData.append('apkFileId', apkFileId);
            if (imageFileId) formData.append('imageFileId', imageFileId);
        } else {
            formData.append('apkFile', apkFile);
            if (imageFileId) formData.append('imageFileId', imageFileId);
        }

        try {
            const endpoint = storageMethod === 'telegram' 
                ? '/api/telegram/upload' 
                : '/api/cloudisk/upload';

            const res = await fetch(endpoint, {
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

    if (loading) {
        return <LoadingState message="Loading..." />;
    }

    return (
        <div className="space-y-6 md:space-y-8">
            {toast && (
                <div className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg text-white text-sm font-medium border ${toast.type === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-400' :
                    toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' :
                        'bg-blue-500/10 border-blue-500/50 text-blue-400'
                    }`}>
                    {toast.message}
                </div>
            )}

            {/* Hero Header */}
            <HeroHeader
                breadcrumbs={[
                    { label: 'Dashboard', href: '/' },
                    { label: 'App Library', href: '/app-library' },
                    { label: 'Add New App' }
                ]}
                title="Add New"
                badge="App"
                description="Upload your application with flexible storage options - Telegram or Cloudisk."
            />

            <form onSubmit={handleSubmit} className="bg-[#0a0312] border border-[#FEBD8B]/20 rounded-2xl p-6 md:p-8 space-y-8 max-w-4xl mx-auto">

                {/* 1. App Information */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-[#FEBD8B]/10 pb-3">
                        <h2 className="text-base font-bold text-white">1. App Information</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">App Name <span className="text-red-400">*</span></label>
                            <input
                                required
                                type="text"
                                value={appName}
                                onChange={(e) => setAppName(e.target.value)}
                                placeholder="e.g. Devora Scanner"
                                className="w-full bg-[#1A082E] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FEBD8B]/40"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Version <span className="text-red-400">*</span></label>
                            <input
                                required
                                type="text"
                                value={version}
                                onChange={(e) => setVersion(e.target.value)}
                                placeholder="e.g. v1.0.0"
                                className="w-full bg-[#1A082E] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FEBD8B]/40 font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-[#1A082E] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-[#FEBD8B]/40 appearance-none"
                            >
                                <option value="Mod">Mod</option>
                                <option value="Original">Original</option>
                            </select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Description</label>
                            <textarea
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Briefly describe what the app does..."
                                className="w-full bg-[#1A082E] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FEBD8B]/40 resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Storage Method */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-[#FEBD8B]/10 pb-3">
                        <h2 className="text-base font-bold text-white">2. Storage Method</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setStorageMethod('telegram')}
                            className={`p-3 rounded-xl border ${
                                storageMethod === 'telegram'
                                    ? 'border-[#749F8B] bg-[#749F8B]/10'
                                    : 'border-white/10 bg-[#1A082E]'
                            }`}
                        >
                            <div className="flex flex-col items-center gap-1.5">
                                <svg className="w-6 h-6 text-[#749F8B]" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" clipRule="evenodd" d="M23.1117 4.49449C23.4296 2.94472 21.9074 1.65683 20.4317 2.227L2.3425 9.21601C0.694517 9.85273 0.621087 12.1572 2.22518 12.8975L6.1645 14.7157L8.03849 21.2746C8.13583 21.6153 8.40618 21.8791 8.74917 21.968C9.09216 22.0568 9.45658 21.9576 9.70712 21.707L12.5938 18.8203L16.6375 21.8531C17.8113 22.7334 19.5019 22.0922 19.7967 20.6549L23.1117 4.49449ZM3.0633 11.0816L21.1525 4.0926L17.8375 20.2531L13.1 16.6999C12.7019 16.4013 12.1448 16.4409 11.7929 16.7928L10.5565 18.0292L10.928 15.9861L18.2071 8.70703C18.5614 8.35278 18.5988 7.79106 18.2947 7.39293C17.9906 6.99479 17.4389 6.88312 17.0039 7.13168L6.95124 12.876L3.0633 11.0816ZM8.17695 14.4791L8.78333 16.6015L9.01614 15.321C9.05253 15.1209 9.14908 14.9366 9.29291 14.7928L11.5128 12.573L8.17695 14.4791Z" />
                                </svg>
                                <span className="font-bold text-xs text-white">Telegram</span>
                                <span className="text-[9px] text-slate-400">Use File ID</span>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setStorageMethod('cloudisk')}
                            className={`p-3 rounded-xl border ${
                                storageMethod === 'cloudisk'
                                    ? 'border-[#FEBD8B] bg-[#FEBD8B]/10'
                                    : 'border-white/10 bg-[#1A082E]'
                            }`}
                        >
                            <div className="flex flex-col items-center gap-1.5">
                                <svg className="w-6 h-6 text-[#FEBD8B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                                </svg>
                                <span className="font-bold text-xs text-white">Cloudisk</span>
                                <span className="text-[9px] text-slate-400">Upload File (50MB)</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* 3. File Upload/IDs based on method */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-[#FEBD8B]/10 pb-3">
                        <h2 className="text-base font-bold text-white">
                            3. {storageMethod === 'telegram' ? 'File IDs' : 'File Upload'}
                        </h2>
                    </div>

                    {storageMethod === 'telegram' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">APK File ID <span className="text-red-400">*</span></label>
                                <input
                                    required={storageMethod === 'telegram'}
                                    type="text"
                                    value={apkFileId}
                                    onChange={(e) => setApkFileId(e.target.value)}
                                    placeholder="Paste Telegram file ID here"
                                    className="w-full bg-[#1A082E] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FEBD8B]/40 font-mono"
                                />
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">
                                    Telegram Document File ID
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">App Icon File ID (Optional)</label>
                                <input
                                    type="text"
                                    value={imageFileId}
                                    onChange={(e) => setImageFileId(e.target.value)}
                                    placeholder="Paste Telegram photo ID here"
                                    className="w-full bg-[#1A082E] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FEBD8B]/40 font-mono"
                                />
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">
                                    Telegram Photo File ID
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">APK File <span className="text-red-400">*</span></label>
                                <input
                                    required={storageMethod === 'cloudisk'}
                                    type="file"
                                    accept=".apk"
                                    onChange={(e) => setApkFile(e.target.files[0])}
                                    className="w-full bg-[#1A082E] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FEBD8B]/40 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#FEBD8B]/10 file:text-[#FEBD8B]"
                                />
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">
                                    Max 50MB - APK files only
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">App Icon File ID (Optional)</label>
                                <input
                                    type="text"
                                    value={imageFileId}
                                    onChange={(e) => setImageFileId(e.target.value)}
                                    placeholder="Paste Telegram photo ID here"
                                    className="w-full bg-[#1A082E] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FEBD8B]/40 font-mono"
                                />
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">
                                    Telegram Photo File ID
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col-reverse md:flex-row justify-end gap-3 pt-4 border-t border-[#FEBD8B]/10">
                    <Link href="/app-library">
                        <button
                            type="button"
                            className="w-full md:w-auto px-6 py-2.5 bg-transparent border border-white/10 text-slate-300 font-bold text-sm rounded-xl"
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                    </Link>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full md:w-auto px-8 py-2.5 bg-[#749F8B] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {submitting ? (
                            <>
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Uploading...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                Upload & Save
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
