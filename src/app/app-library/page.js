'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';


export default function AppLibraryPage() {
    const [search, setSearch] = useState('');
    const [toast, setToast] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isUltra, setIsUltra] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(null);
    const [showConfig, setShowConfig] = useState(false);
    const [botTokenMissing, setBotTokenMissing] = useState(false);
    const [tokenCopied, setTokenCopied] = useState(false);

    // Modal state for Add App
    const [showAddAppModal, setShowAddAppModal] = useState(false);
    const [appName, setAppName] = useState('');
    const [developer, setDeveloper] = useState('');
    const [version, setVersion] = useState('');
    const [androidVersion, setAndroidVersion] = useState('');
    const [category, setCategory] = useState('Mod');
    const [description, setDescription] = useState('');
    const [apkFile, setApkFile] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [submittingApp, setSubmittingApp] = useState(false);
    const fileInputRef = useRef(null);
    const imageInputRef = useRef(null);

    const [apps, setApps] = useState([]);

    const [config, setConfig] = useState({
        TELEGRAM_STORAGE_CHAT_ID: '',
        TELEGRAM_STORAGE_TOPIC_APK: '',
        TELEGRAM_STORAGE_TOPIC_IMAGES: '',
        TELEGRAM_STORAGE_TOPIC_METADATA: ''
    });

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

            if (userRole === 'ULTRA') {
                setIsUltra(true);
                // Fetch existing config
                try {
                    const res = await fetch('/api/telegram/storage-config');
                    const data = await res.json();

                    if (res.status === 404 && data.error === 'BOT_TOKEN_NOT_FOUND') {
                        setBotTokenMissing(true);
                    } else if (data.success && data.config) {
                        setBotTokenMissing(false);
                        setConfig(prev => ({ ...prev, ...data.config }));
                    }
                } catch (e) { console.error('Failed to fetch storage config:', e); }
            }

            // Fetch Apps
            try {
                const res = await fetch('/api/apps');
                const data = await res.json();
                if (data.success) {
                    setApps(data.apps);
                }
            } catch (e) { console.error('Failed to fetch apps:', e); }

            setLoading(false);

        };
        init();
    }, []);

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

    const handleSaveConfig = async (e) => {
        if (e) e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/telegram/storage-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            if (res.ok) {
                showToast('Configuration saved successfully!');
            } else {
                const data = await res.json();
                showToast(data.error || 'Failed to save configuration.');
            }
        } catch (error) {
            showToast('Network error while saving.');
        } finally {
            setSaving(false);
        }
    };

    const handleTestSync = async (type, topicId) => {
        if (!config.TELEGRAM_STORAGE_CHAT_ID || !topicId) {
            showToast('Missing Chat ID or Topic ID.');
            return;
        }
        setTesting(type);
        try {
            const res = await fetch('/api/telegram/test-storage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatId: config.TELEGRAM_STORAGE_CHAT_ID,
                    topicId: topicId,
                    type: type.toUpperCase()
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                showToast(`Test message sent to ${type} successfully!`);
            } else {
                showToast(data.error || 'Test sync failed.');
            }
        } catch (error) {
            showToast('Connection failed. Check Bot Token.');
        } finally {
            setTesting(null);
        }
    };

    const isConfigComplete = () => {
        if (!isUltra) return true;
        return (
            config.TELEGRAM_STORAGE_CHAT_ID &&
            config.TELEGRAM_STORAGE_TOPIC_APK &&
            config.TELEGRAM_STORAGE_TOPIC_IMAGES
        );
    };

    const configComplete = isConfigComplete();

    const filteredApps = apps.filter(app =>
        app.name.toLowerCase().includes(search.toLowerCase()) ||
        app.category.toLowerCase().includes(search.toLowerCase()) ||
        (app.description && app.description.toLowerCase().includes(search.toLowerCase()))
    );

    const handleApkSelect = (e) => {
        const file = e.target.files[0];
        if (file && file.name.endsWith('.apk')) {
            setApkFile(file);
        } else if (file) {
            showToast('Please select a valid .apk file');
            e.target.value = '';
        }
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file && (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp')) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        } else if (file) {
            showToast('Please select a valid image (JPG, PNG, WEBP)');
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

    const handleSubmitApp = async (e) => {
        e.preventDefault();
        if (!appName || !version || !apkFile) {
            showToast('Please fill in all required fields and select an APK.');
            return;
        }

        setSubmittingApp(true);
        const formData = new FormData();
        formData.append('appName', appName);
        formData.append('developer', developer);
        formData.append('version', version);
        formData.append('androidVersion', androidVersion);
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
                showToast('App uploaded successfully!');
                setShowAddAppModal(false);
                setAppName('');
                setDeveloper('');
                setVersion('');
                setAndroidVersion('');
                setCategory('Utility');
                setDescription('');
                setApkFile(null);
                setImageFile(null);
                setImagePreview(null);

                // Refresh apps
                const refreshRes = await fetch('/api/apps');
                const refreshData = await refreshRes.json();
                if (refreshData.success) {
                    setApps(refreshData.apps);
                }
            } else {
                showToast(data.error || 'Upload failed.');
            }
        } catch (error) {
            showToast('Network error during upload.');
        } finally {
            setSubmittingApp(false);
        }
    };

    return (
        <div className="space-y-8">
            {toast && (
                <div className="fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium bg-blue-500">
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
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                                <span className="text-white">App </span>
                                <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 via-indigo-400 to-purple-400">Library</span>
                            </h1>
                            <p className="text-gray-400 text-sm max-w-xl">Discover, download, and share applications. Keep up entirely with all our latest app versions.</p>
                        </div>

                        <div className="flex items-center gap-3 self-start md:self-end mb-1">
                            {isUltra && (
                                <button
                                    onClick={() => {
                                        if (!configComplete) {
                                            setBotTokenMissing(false);
                                            setShowConfig(true);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                            showToast('Please complete storage configuration first.');
                                        } else {
                                            setShowAddAppModal(true);
                                        }
                                    }}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-colors border ${!configComplete ? 'bg-amber-500/10 border-amber-500/50 text-amber-500 hover:bg-amber-500/20' : 'bg-emerald-600/10 border-emerald-500/50 text-emerald-500 hover:bg-emerald-600/20'}`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                                    Add New App
                                </button>
                            )}
                            <button
                                disabled={!isUltra}
                                onClick={() => setShowConfig(!showConfig)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors border ${!isUltra ? 'bg-white/5 border-white/5 text-gray-600 cursor-not-allowed grayscale' : showConfig ? 'bg-blue-500/10 border-blue-500 text-blue-400 shadow-lg shadow-blue-500/10' : 'bg-white/5 border-white/10 text-gray-400 hover:border-blue-500/50 hover:text-blue-400'}`}
                            >
                                {!isUltra ? (
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                )}
                                {showConfig ? 'Close Settings' : 'Storage Settings'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Storage Config Section (ULTRA only) */}
            {isUltra && showConfig && (
                <div>
                    {botTokenMissing ? (
                        <div className="bg-[#0d111c] border border-white/10 rounded-[20px] overflow-hidden shadow-2xl relative max-w-[520px] mx-auto">
                            <div className="absolute top-0 inset-x-0 h-[2px] bg-linear-to-r from-orange-500 to-amber-400" />
                            <div className="p-10 flex flex-col items-center text-center">
                                <div className="w-14 h-14 bg-[#1a1f2e] border border-orange-500/20 rounded-full flex items-center justify-center mb-6">
                                    <svg className="w-7 h-7 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                </div>
                                <div className="space-y-2 mb-8">
                                    <span className="inline-block text-[10px] font-black uppercase tracking-[0.2em] text-orange-500/80 bg-orange-500/5 px-3 py-1 rounded-full border border-orange-500/10 mb-2">Configuration Required</span>
                                    <h2 className="text-2xl font-bold text-white tracking-tight">Missing Bot Token</h2>
                                    <p className="max-w-[400px] mx-auto text-gray-400 text-sm leading-relaxed">The storage module requires a Telegram Bot Token. Please add this key to your global configuration first:</p>
                                </div>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText('BOT_TOKEN_TELEGRAM');
                                        setTokenCopied(true);
                                        setTimeout(() => setTokenCopied(false), 2000);
                                    }}
                                    className={`flex items-center gap-2 px-4 py-2 bg-[#161b29] border rounded-xl font-mono text-xs mb-8 transition-colors group ${tokenCopied ? 'border-emerald-500/50 text-emerald-400' : 'border-white/5 text-blue-400 hover:border-blue-500/30'}`}
                                >
                                    <span className={tokenCopied ? 'text-emerald-600' : 'text-gray-600'}>$</span>
                                    <span className="font-bold tracking-wider">BOT_TOKEN_TELEGRAM</span>
                                    {tokenCopied ? (
                                        <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    ) : (
                                        <svg className="w-3.5 h-3.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                    )}
                                </button>
                                <Link href="/config" className="w-full sm:w-auto">
                                    <button className="w-full px-8 py-3.5 bg-linear-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-sm rounded-xl shadow-lg transition-colors">Go to Global Configurations</button>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-[#0d111c] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
                            <div className="absolute top-0 inset-x-0 h-[2px] bg-linear-to-r from-blue-600 to-indigo-400" />
                            <div className="p-6 md:p-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-white tracking-tight">Telegram Storage Configuration</h2>
                                        <p className="text-xs text-gray-500 mt-1 uppercase font-black tracking-widest">Apk Distribution module settings</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Group Chat ID */}
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                            Target Group Chat ID
                                        </label>
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                value={config.TELEGRAM_STORAGE_CHAT_ID}
                                                onChange={(e) => setConfig({ ...config, TELEGRAM_STORAGE_CHAT_ID: e.target.value })}
                                                placeholder="-100xxxxxxxxxx"
                                                className="w-full bg-[#070b14] border border-white/5 rounded-xl px-10 py-3 font-mono text-sm text-white focus:outline-hidden focus:border-blue-500/50 transition-colors"
                                            />
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 font-mono text-xs">#</div>
                                        </div>
                                    </div>

                                    {/* APK Topic */}
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between">
                                            <span className="flex items-center gap-2">APK Topic ID</span>
                                            <button
                                                onClick={() => handleTestSync('apk', config.TELEGRAM_STORAGE_TOPIC_APK)}
                                                disabled={testing === 'apk'}
                                                className="text-[9px] font-black text-blue-500 hover:text-blue-300 uppercase tracking-tighter transition-colors"
                                            >
                                                {testing === 'apk' ? 'Testing...' : 'Test Sync'}
                                            </button>
                                        </label>
                                        <input
                                            type="number"
                                            value={config.TELEGRAM_STORAGE_TOPIC_APK}
                                            onChange={(e) => setConfig({ ...config, TELEGRAM_STORAGE_TOPIC_APK: e.target.value })}
                                            className="w-full bg-[#070b14] border border-white/5 rounded-xl px-4 py-3 font-mono text-sm text-white focus:outline-hidden focus:border-indigo-500/50 transition-colors"
                                        />
                                    </div>

                                    {/* Image Topic */}
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between">
                                            <span className="flex items-center gap-2">Image Topic ID</span>
                                            <button
                                                onClick={() => handleTestSync('images', config.TELEGRAM_STORAGE_TOPIC_IMAGES)}
                                                disabled={testing === 'images'}
                                                className="text-[9px] font-black text-blue-500 hover:text-blue-300 uppercase tracking-tighter transition-colors"
                                            >
                                                {testing === 'images' ? 'Testing...' : 'Test Sync'}
                                            </button>
                                        </label>
                                        <input
                                            type="number"
                                            value={config.TELEGRAM_STORAGE_TOPIC_IMAGES}
                                            onChange={(e) => setConfig({ ...config, TELEGRAM_STORAGE_TOPIC_IMAGES: e.target.value })}
                                            className="w-full bg-[#070b14] border border-white/5 rounded-xl px-4 py-3 font-mono text-sm text-white focus:outline-hidden focus:border-purple-500/50 transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="flex pt-2">
                                    <button
                                        onClick={handleSaveConfig}
                                        disabled={saving}
                                        className="w-full md:w-auto px-10 py-3 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black uppercase tracking-widest text-[11px] rounded-xl shadow-xl shadow-blue-500/10 transition-colors disabled:opacity-50"
                                    >
                                        {saving ? 'Saving...' : 'Update Storage Parameters'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

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
                    className="w-full pl-11 pr-4 py-3 bg-gray-900 border border-white/10 hover:border-blue-500/30 rounded-2xl text-sm text-gray-100 placeholder-gray-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors shadow-lg shadow-black/20"
                />
            </div>

            <div className="relative">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 transition-colors">
                    {filteredApps.map((app) => (
                        <div
                            key={app.id}
                            onClick={() => router.push(`/app-library/${app.id}`)}
                            className="bg-gray-900/50 border border-white/10 hover:border-blue-500/40 rounded-2xl p-5 transition-colors cursor-pointer flex flex-col justify-between hover:bg-gray-800/80"
                        >
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3 w-full">
                                        <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-gray-800 to-gray-900 border border-white/5 flex items-center justify-center shadow-inner shrink-0 overflow-hidden">
                                            {app.versions && app.versions.length > 0 && app.versions[0].imageUrl ? (
                                                <img
                                                    src={`/api/telegram/image/${app.versions[0].imageUrl}`}
                                                    alt={app.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = '/icons/default-app-icon.svg';
                                                    }}
                                                />
                                            ) : app.iconStatic && app.iconStatic !== '📦' ? (
                                                <img
                                                    src={app.iconStatic}
                                                    alt={app.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = '/icons/default-app-icon.svg';
                                                    }}
                                                />
                                            ) : (
                                                <div className="text-white/90 group-hover:text-white transition-opacity">
                                                    <svg width="24" height="24" viewBox="0 0 512 512" fill="currentColor">
                                                        <path d="M256,0C114.6,0,0,114.6,0,256s114.6,256,256,256s256-114.6,256-256S397.4,0,256,0z M415.8,415.7 c-20.8,20.8-44.9,37.1-71.8,48.4c-27.8,11.8-57.4,17.7-88,17.7c-30.5,0-60.1-6-88-17.7c-26.9-11.4-51.1-27.7-71.8-48.4 c-20.8-20.8-37.1-44.9-48.4-71.8C36,316.1,30,286.5,30,256s6-60.1,17.7-88c11.4-26.9,27.7-51.1,48.4-71.8 c20.9-20.8,45-37.1,71.9-48.5C195.9,36,225.5,30,256,30s60.1,6,88,17.7c26.9,11.4,51.1,27.7,71.8,48.4 c20.8,20.8,37.1,44.9,48.4,71.8c11.8,27.8,17.7,57.4,17.7,88c0,30.5-6,60.1-17.7,88C452.8,370.8,436.5,395,415.8,415.7z"></path>
                                                        <path d="M294.2,150.3l2.8-4.2l2.8-4.1l6.2-9.3c0.8-1.1,0.5-2.7-0.7-3.4c-1.1-0.8-2.7-0.5-3.4,0.7l-6.6,9.9l-2.8,4.2l-2.8,4.2 c-9-3.5-18.9-5.4-29.5-5.4c-10.5,0-20.5,1.9-29.5,5.4l-2.8-4.2l-2.8-4.2l-6.6-9.9c-0.8-1.1-2.3-1.4-3.4-0.7 c-1.1,0.8-1.4,2.3-0.7,3.4l6.2,9.3l2.8,4.1l2.8,4.2c-21,9.8-35.3,28.3-35.3,49.6h138.7C329.5,178.6,315.3,160.1,294.2,150.3z M230.4,180c-4.1,0-7.4-3.3-7.4-7.4s3.3-7.4,7.4-7.4c4.1,0,7.4,3.3,7.4,7.4C237.8,176.7,234.5,180,230.4,180z M289.8,180 c-4.1,0-7.4-3.3-7.4-7.4s3.3-7.4,7.4-7.4c4.1,0,7.4,3.3,7.4,7.4C297.3,176.7,294,180,289.8,180z"></path>
                                                        <path d="M191.8,209.8h-1.1v12.3v10.1v86.6c0,8.7,7,15.7,15.7,15.7h11.3c-0.4,1.3-0.6,2.7-0.6,4.1v0.8v5V370 c0,8.2,6.7,14.9,14.9,14.9s14.9-6.7,14.9-14.9v-25.6v-5v-0.8c0-1.4-0.2-2.8-0.6-4.1h27.6c-0.4,1.3-0.6,2.7-0.6,4.1v0.8v5V370 c0,8.2,6.7,14.9,14.9,14.9c8.2,0,14.9-6.7,14.9-14.9v-25.6v-5v-0.8c0-1.4-0.2-2.8-0.6-4.1h11.3c8.7,0,15.7-7,15.7-15.7v-86.6v-10.1 v-12.4h-1.1H191.8V209.8z"></path>
                                                        <path d="M166,209.8c-8.2,0-14.9,6.7-14.9,14.9v63.6c0,8.2,6.7,14.9,14.9,14.9c8.2,0,14.9-6.7,14.9-14.9v-63.6 C180.8,216.4,174.2,209.8,166,209.8z"></path>
                                                        <path d="M354.3,209.8c-8.2,0-14.9,6.7-14.9,14.9v63.6c0,8.2,6.7,14.9,14.9,14.9c8.2,0,14.9-6.7,14.9-14.9v-63.6 C369.1,216.4,362.5,209.8,354.3,209.8z"></path>
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-white font-bold text-base truncate">{app.name}</h3>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs text-blue-400 font-medium bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">{app.category}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCopyLink(e, app.id);
                                            }}
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
                                    Latest: <span className="font-semibold text-gray-300">{app.versions && app.versions.length > 0 ? app.versions[0].version : 'v1.0.0'}</span>
                                </div>
                                <div className="text-xs font-semibold text-indigo-400 flex items-center gap-1 transition-colors">
                                    Details
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {filteredApps.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500 border border-dashed border-white/10 rounded-3xl bg-gray-900/20">
                    <svg className="w-12 h-12 mb-4 opacity-50 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    <h3 className="text-lg font-bold text-gray-300">No Apps Found</h3>
                    <p className="text-sm mt-1">Try modifying your search criteria.</p>
                </div>
            )}
            {/* Add App Modal */}
            {showAddAppModal && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => !submittingApp && setShowAddAppModal(false)}>
                    <div className="bg-[#0f1420] border border-white/10 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6 md:p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-black text-white tracking-tight">Add New App</h3>
                                    <p className="text-sm text-gray-400 mt-1">Upload a new application to the library</p>
                                </div>
                                <button onClick={() => !submittingApp && setShowAddAppModal(false)} className="text-gray-500 hover:text-white transition-colors" disabled={submittingApp}>
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <form onSubmit={handleSubmitApp} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block">App Name <span className="text-red-400">*</span></label>
                                        <input
                                            required
                                            type="text"
                                            value={appName}
                                            onChange={(e) => setAppName(e.target.value)}
                                            placeholder="e.g. Devora Scanner"
                                            className="w-full bg-[#0a0d16] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block">Developer</label>
                                        <input
                                            type="text"
                                            value={developer}
                                            onChange={(e) => setDeveloper(e.target.value)}
                                            placeholder="e.g. Devora Labs"
                                            className="w-full bg-[#0a0d16] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
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
                                            className="w-full bg-[#0a0d16] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors font-mono"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block">Android Version</label>
                                        <input
                                            type="text"
                                            value={androidVersion}
                                            onChange={(e) => setAndroidVersion(e.target.value)}
                                            placeholder="e.g. 8.0+"
                                            className="w-full bg-[#0a0d16] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block">Category</label>
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="w-full bg-[#0a0d16] border border-white/5 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50 transition-colors appearance-none"
                                        >
                                            <option value="Mod">Mod</option>
                                            <option value="Original">Original</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block">Description</label>
                                        <textarea
                                            rows={2}
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Briefly describe what the app does..."
                                            className="w-full bg-[#0a0d16] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block">APK File <span className="text-red-400">*</span></label>
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`relative flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${apkFile ? 'border-blue-500/40 bg-blue-500/5' : 'border-white/10 bg-[#0a0d16] hover:border-blue-500/30'}`}
                                        >
                                            <input type="file" accept=".apk" className="hidden" ref={fileInputRef} onChange={handleApkSelect} />
                                            {apkFile ? (
                                                <div className="text-center">
                                                    <svg className="w-6 h-6 text-blue-400 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                    <p className="text-sm font-bold text-gray-200 truncate max-w-[150px] mx-auto">{apkFile.name}</p>
                                                    <p className="text-[10px] text-blue-400 font-mono">{formatBytes(apkFile.size)}</p>
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    <svg className="w-6 h-6 text-gray-600 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                                    <p className="text-xs text-gray-300 font-semibold mb-0.5">Upload APK</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block">App Icon (Optional)</label>
                                        <div
                                            onClick={() => imageInputRef.current?.click()}
                                            className={`relative flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-xl cursor-pointer transition-colors overflow-hidden ${imagePreview ? 'border-fuchsia-500/40 bg-fuchsia-500/5' : 'border-white/10 bg-[#0a0d16] hover:border-fuchsia-500/30'}`}
                                        >
                                            <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" ref={imageInputRef} onChange={handleImageSelect} />
                                            {imagePreview ? (
                                                <div className="text-center relative w-full h-full flex flex-col items-center justify-center">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={imagePreview} alt="Preview" className="w-10 h-10 object-cover rounded-lg mb-1 shadow border border-white/10 mx-auto" />
                                                    <p className="text-[10px] text-fuchsia-400 font-mono">{formatBytes(imageFile.size)}</p>
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    <svg className="w-6 h-6 text-gray-600 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                    <p className="text-xs text-gray-300 font-semibold mb-0.5">Upload Icon</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddAppModal(false)}
                                        className="px-5 py-2.5 bg-transparent border border-white/10 hover:bg-white/5 text-gray-300 font-bold text-sm rounded-xl transition-colors"
                                        disabled={submittingApp}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submittingApp || !appName || !version || !apkFile}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submittingApp ? 'Uploading...' : 'Upload & Save App'}
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
