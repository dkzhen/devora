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
    const [apkFile, setApkFile] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    // Storage Config State for readonly display
    const [storageConfig, setStorageConfig] = useState({
        TELEGRAM_STORAGE_CHAT_ID: 'Loading...',
        TELEGRAM_STORAGE_TOPIC_APK: 'Loading...',
        TELEGRAM_STORAGE_TOPIC_IMAGES: 'Loading...'
    });

    const router = useRouter();
    const fileInputRef = useRef(null);
    const imageInputRef = useRef(null);

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

            // Fetch Storage Config for Display
            try {
                const res = await fetch('/api/telegram/storage-config');
                const data = await res.json();
                if (data.success && data.config) {
                    setStorageConfig(data.config);
                } else {
                    setStorageConfig({
                        TELEGRAM_STORAGE_CHAT_ID: 'Not Configured',
                        TELEGRAM_STORAGE_TOPIC_APK: 'Not Configured',
                        TELEGRAM_STORAGE_TOPIC_IMAGES: 'Not Configured'
                    });
                }
            } catch (error) {
                console.error('Error fetching config:', error);
            }

            setLoading(false);
        };
        init();
    }, [router]);

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleApkSelect = (e) => {
        const file = e.target.files[0];
        if (file && file.name.endsWith('.apk')) {
            setApkFile(file);
        } else if (file) {
            showToast('Please select a valid .apk file', 'error');
            e.target.value = ''; // Reset
        }
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file && (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp')) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else if (file) {
            showToast('Please select a valid image (JPG, PNG, WEBP)', 'error');
            e.target.value = '';
        }
    };

    const formatBytes = (bytes, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!appName || !version || !apkFile) {
            showToast('Please fill in all required fields and select an APK.', 'error');
            return;
        }

        setSubmitting(true);
        const formData = new FormData();
        formData.append('appName', appName);
        formData.append('version', version);
        formData.append('category', category);
        formData.append('description', description);
        formData.append('apkFile', apkFile);
        if (imageFile) formData.append('imageFile', imageFile);

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
                    <p className="text-gray-400 text-sm">Upload your application. Files are automatically forwarded and stored securely in your dedicated Telegram topics.</p>
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

                {/* 2. Files Upload */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                        <div className="w-6 h-6 rounded bg-purple-500/10 text-purple-400 flex items-center justify-center">
                            <span className="text-xs font-black">2</span>
                        </div>
                        <h2 className="text-lg font-bold text-gray-200">Files Upload</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* APK Upload */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block">APK File <span className="text-red-400">*</span></label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-[16px] cursor-pointer transition-all ${apkFile ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-white/10 bg-[#0a0d16] hover:border-indigo-500/30'}`}
                            >
                                <input
                                    type="file"
                                    accept=".apk"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleApkSelect}
                                />
                                {apkFile ? (
                                    <div className="text-center space-y-2">
                                        <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-xl mx-auto flex items-center justify-center mb-3">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                                        </div>
                                        <p className="text-sm font-bold text-gray-200 truncate max-w-[200px]">{apkFile.name}</p>
                                        <p className="text-xs text-indigo-400 font-mono">{formatBytes(apkFile.size)}</p>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <svg className="w-10 h-10 text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                        <p className="text-sm text-gray-300 font-semibold mb-1">Click to browse</p>
                                        <p className="text-xs text-gray-500">Android Package (.apk)</p>
                                    </div>
                                )}
                            </div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                <svg className="w-3 h-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                Uploads to Telegram APK Topic
                            </p>
                        </div>

                        {/* Image Upload */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block">App Icon (Optional)</label>
                            <div
                                onClick={() => imageInputRef.current?.click()}
                                className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-[16px] cursor-pointer transition-all overflow-hidden ${imagePreview ? 'border-fuchsia-500/40 bg-fuchsia-500/5' : 'border-white/10 bg-[#0a0d16] hover:border-fuchsia-500/30'}`}
                            >
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.webp"
                                    className="hidden"
                                    ref={imageInputRef}
                                    onChange={handleImageSelect}
                                />
                                {imagePreview ? (
                                    <div className="text-center relative w-full h-full flex flex-col items-center justify-center">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={imagePreview} alt="Preview" className="w-16 h-16 object-cover rounded-2xl mb-3 shadow-lg border border-white/10" />
                                        <p className="text-sm font-bold text-gray-200 truncate max-w-[200px]">{imageFile.name}</p>
                                        <p className="text-xs text-fuchsia-400 font-mono">{formatBytes(imageFile.size)}</p>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <svg className="w-10 h-10 text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        <p className="text-sm text-gray-300 font-semibold mb-1">Upload Icon</p>
                                        <p className="text-xs text-gray-500">JPG, PNG, WEBP</p>
                                    </div>
                                )}
                            </div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                <svg className="w-3 h-3 text-fuchsia-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                Uploads to Telegram Image Topic
                            </p>
                        </div>
                    </div>
                </div>

                {/* Storage Info Badge */}
                <div className="bg-[#0a0d16] border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-200">Active Storage Route</p>
                            <p className="text-xs text-gray-500">Files will be sent here</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[10px] font-mono font-medium">
                        <span className="bg-gray-800/50 text-gray-400 px-2.5 py-1.5 rounded-lg border border-white/5 flex items-center gap-1">
                            CHAT: <span className="text-gray-200">{storageConfig.TELEGRAM_STORAGE_CHAT_ID}</span>
                        </span>
                        <span className="bg-indigo-500/10 text-indigo-400 px-2.5 py-1.5 rounded-lg border border-indigo-500/10 flex items-center gap-1">
                            APK: <span className="text-indigo-300">TID_{storageConfig.TELEGRAM_STORAGE_TOPIC_APK}</span>
                        </span>
                        <span className="bg-fuchsia-500/10 text-fuchsia-400 px-2.5 py-1.5 rounded-lg border border-fuchsia-500/10 flex items-center gap-1">
                            IMG: <span className="text-fuchsia-300">TID_{storageConfig.TELEGRAM_STORAGE_TOPIC_IMAGES}</span>
                        </span>
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
                                Uploading to Telegram...
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
