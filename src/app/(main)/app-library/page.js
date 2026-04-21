'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { HeroHeader, LoadingState } from '@/components/HeroHeader';
import LoadingImage from '@/components/LoadingImage';
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
    const [apkFileId, setApkFileId] = useState('');
    const [imageFileId, setImageFileId] = useState('');
    const [submittingApp, setSubmittingApp] = useState(false);


    const [apps, setApps] = useState([]);

    const [config, setConfig] = useState({
        TELEGRAM_STORAGE_CHAT_ID: '',
        TELEGRAM_STORAGE_TOPIC_APK: '',
        TELEGRAM_STORAGE_TOPIC_IMAGES: '',
        TELEGRAM_STORAGE_TOPIC_METADATA: ''
    });

    const router = useRouter();

    // Function to capitalize first letter of each word
    const capitalizeWords = (str) => {
        if (!str) return '';
        return str.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    };

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
        
        // Validasi input tidak boleh kosong
        if (!config.TELEGRAM_STORAGE_CHAT_ID || !config.TELEGRAM_STORAGE_TOPIC_APK || !config.TELEGRAM_STORAGE_TOPIC_IMAGES) {
            showToast('Please fill in all required fields (Chat ID, APK Topic, Image Topic)');
            return;
        }

        // Validasi format Chat ID (harus dimulai dengan -)
        if (!config.TELEGRAM_STORAGE_CHAT_ID.startsWith('-')) {
            showToast('Chat ID must start with "-" (e.g., -100xxxxxxxxxx)');
            return;
        }

        // Validasi Topic ID harus angka
        if (isNaN(config.TELEGRAM_STORAGE_TOPIC_APK) || isNaN(config.TELEGRAM_STORAGE_TOPIC_IMAGES)) {
            showToast('Topic IDs must be valid numbers');
            return;
        }

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

    const handleSubmitApp = async (e) => {
        e.preventDefault();
        if (!appName || !version || !apkFileId) {
            showToast('Please fill in all required fields and provide an APK File ID.');
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
        formData.append('apkFileId', apkFileId);
        if (imageFileId) formData.append('imageFileId', imageFileId);

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
                setApkFileId('');
                setImageFileId('');

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
        <div className="space-y-6 md:space-y-8">
            {toast && (
                <div className="fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium bg-linear-to-r from-blue-600 via-fuchsia-600 to-purple-600 animate-pulse border border-blue-400/40">
                    {toast}
                </div>
            )}

            {/* Hero Header Cyberpunk */}
            <HeroHeader
                breadcrumbs={[
                    { label: 'Dashboard', href: '/' },
                    { label: 'App Library' }
                ]}
                title="App"
                badge="Library"
                description="Discover, download, and share applications. Keep up entirely with all our latest app versions."
                
            />

            {/* Warning Banner if Bot Token Missing (ULTRA only) */}
            {isUltra && botTokenMissing && (
                <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="shrink-0 w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center mt-0.5">
                        <svg className="w-3 h-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-amber-200 mb-1">Bot Token Required</h4>
                        <p className="text-xs text-slate-300 leading-relaxed mb-3">
                            Please configure <span className="font-mono text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded">BOT_TOKEN_TELEGRAM</span> in Global Configuration before setting up storage parameters.
                        </p>
                        <Link href="/config">
                            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-200 text-xs font-bold rounded-lg transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Go to Global Config
                            </button>
                        </Link>
                    </div>
                </div>
            )}

            {/* Main Action Bar: Search + Buttons */}
            <div className="flex flex-col md:flex-row gap-4 item-center">
                {/* Search box with Dawn style */}
                <div className="flex-1 relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-[#FEBD8B]/60 group-focus-within:text-[#FEBD8B] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search apps by name, category, or description..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-[#0a0312] border border-[#FEBD8B]/20 rounded-xl text-xs text-[#FDF2D9] placeholder:text-[#FEBD8B]/30 focus:border-[#FEBD8B]/40 focus:ring-2 focus:ring-[#FEBD8B]/5 focus:outline-none font-mono transition-all shadow-[inset_0_0_10px_rgba(254,189,139,0.05)]"
                    />
                </div>

                {/* Tombol Add & Settings */}
                {isUltra && (
                    <div className="flex gap-2 shrink-0">
                        <Link href="/app-library/add">
                            <button
                                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border bg-[#749F8B]/5 border-[#749F8B]/30 text-[#749F8B] hover:bg-[#749F8B]/10 shadow-[0_0_15px_rgba(116,159,139,0.1)]"
                                aria-label="Add New App"
                                title="Add new app"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                                <span className="hidden sm:inline">Add Release</span>
                            </button>
                        </Link>
                        <button
                            onClick={() => {
                                if (botTokenMissing) {
                                    showToast('Please configure BOT_TOKEN_TELEGRAM in Global Config first.');
                                    return;
                                }
                                setShowConfig(!showConfig);
                            }}
                            disabled={botTokenMissing}
                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${
                                botTokenMissing 
                                    ? 'bg-slate-800/50 border-slate-700/50 text-slate-600 cursor-not-allowed opacity-50'
                                    : showConfig 
                                        ? 'bg-[#749F8B] border-[#749F8B]/50 text-white shadow-[0_0_20px_rgba(116,159,139,0.4)]' 
                                        : 'bg-[#749F8B]/5 border-[#749F8B]/30 text-[#749F8B] hover:bg-[#749F8B]/10 shadow-[0_0_15px_rgba(116,159,139,0.1)]'
                            }`}
                            aria-label="Storage Settings"
                            title={botTokenMissing ? 'Bot Token required' : 'Storage configuration'}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            <span className="hidden sm:inline">{showConfig ? 'Active' : 'Configs'}</span>
                        </button>
                    </div>
                )}
            </div>


            {/* Loading State & Content */}
            {loading ? (
                <LoadingState  message="Loading App Library..." />
            ) : (
                <div className="relative space-y-4 md:space-y-8">
                    {/* Storage Config Section (ULTRA only) - MOVED ABOVE GRID */}
                    {isUltra && showConfig && (
                        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
                            {botTokenMissing ? (
                                <div className="bg-[#1A082E] border border-[#FEBD8B]/20 rounded-[20px] overflow-hidden shadow-2xl relative max-w-3xl mx-auto">
                                    <div className="absolute top-0 inset-x-0 h-0.5 bg-linear-to-r from-[#FEBD8B] to-[#749F8B]" />
                                    <div className="p-8 flex flex-col items-center text-center">
                                        <div className="w-14 h-14 bg-[#FEBD8B]/10 border border-[#FEBD8B]/20 rounded-full flex items-center justify-center mb-6">
                                            <svg className="w-7 h-7 text-[#FEBD8B]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                        </div>
                                        <div className="space-y-2 mb-8">
                                            <span className="inline-block text-[10px] font-black uppercase tracking-[0.2em] text-[#FEBD8B]/80 bg-[#FEBD8B]/5 px-3 py-1 rounded-full border border-[#FEBD8B]/10 mb-2">Configuration Required</span>
                                            <h2 className="text-xl font-bold text-white tracking-tight text-center">Missing Bot Token</h2>
                                            <p className="max-w-md mx-auto text-slate-400 text-sm leading-relaxed text-center">The storage module requires a Telegram Bot Token. Please add this key to your global configuration first:</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText('BOT_TOKEN_TELEGRAM');
                                                setTokenCopied(true);
                                                setTimeout(() => setTokenCopied(false), 2000);
                                            }}
                                            className={`flex items-center gap-2 px-4 py-2 bg-[#1A082E] border rounded-xl font-mono text-xs mb-8 transition-colors group ${tokenCopied ? 'border-emerald-500/50 text-emerald-400' : 'border-white/5 text-[#749F8B] hover:border-[#749F8B]/30'}`}
                                        >
                                            <span className={tokenCopied ? 'text-emerald-600' : 'text-slate-600'}>$</span>
                                            <span className="font-bold tracking-wider">BOT_TOKEN_TELEGRAM</span>
                                            {tokenCopied ? (
                                                <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                            ) : (
                                                <svg className="w-3.5 h-3.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                            )}
                                        </button>
                                        <Link href="/config">
                                            <button className="px-8 py-3.5 bg-linear-to-r from-[#FEBD8B] to-[#749F8B] hover:from-[#FEBD8B]/80 hover:to-[#749F8B]/80 text-[#1A082E] font-black text-xs uppercase tracking-widest rounded-xl shadow-lg transition-colors">Go to Global Configurations</button>
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-[#0a0312] border border-[#FEBD8B]/20 rounded-2xl overflow-hidden shadow-2xl relative">
                                    <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-[#FEBD8B]/50 to-transparent" />
                                    <div className="p-6 md:p-8 space-y-6">
                                        <div className="flex items-center justify-between border-b border-[#FEBD8B]/10 pb-4">
                                            <div>
                                                <h2 className="text-base font-bold text-white tracking-tight">Storage Parameters</h2>
                                                <p className="text-[10px] text-[#FEBD8B]/60 mt-0.5 uppercase font-black tracking-widest">Telegram Cloud Integration</p>
                                            </div>
                                            <button onClick={() => setShowConfig(false)} className="text-slate-500 hover:text-white transition-colors">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {/* Group Chat ID */}
                                            <div className="space-y-2 lg:col-span-1">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                    Target Chat ID
                                                </label>
                                                <div className="relative group">
                                                    <input
                                                        type="text"
                                                        value={config.TELEGRAM_STORAGE_CHAT_ID}
                                                        onChange={(e) => setConfig({ ...config, TELEGRAM_STORAGE_CHAT_ID: e.target.value })}
                                                        placeholder="-100xxxxxxxxxx"
                                                        className="w-full bg-[#1A082E] border border-[#FEBD8B]/10 rounded-xl px-4 py-2.5 font-mono text-xs text-[#FDF2D9] placeholder:text-slate-700 focus:outline-none focus:border-[#FEBD8B]/40 transition-colors"
                                                    />
                                                </div>
                                            </div>

                                            {/* APK Topic */}
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
                                                    <span>APK Topic ID</span>
                                                    <button
                                                        onClick={() => handleTestSync('apk', config.TELEGRAM_STORAGE_TOPIC_APK)}
                                                        disabled={testing === 'apk'}
                                                        className="text-[9px] font-black text-[#749F8B] hover:text-[#FEBD8B] transition-colors"
                                                    >
                                                        {testing === 'apk' ? 'Sending...' : 'Test'}
                                                    </button>
                                                </label>
                                                <input
                                                    type="number"
                                                    value={config.TELEGRAM_STORAGE_TOPIC_APK}
                                                    onChange={(e) => setConfig({ ...config, TELEGRAM_STORAGE_TOPIC_APK: e.target.value })}
                                                    className="w-full bg-[#1A082E] border border-[#FEBD8B]/10 rounded-xl px-4 py-2.5 font-mono text-xs text-[#FDF2D9] focus:outline-none focus:border-[#FEBD8B]/40 transition-colors"
                                                />
                                            </div>

                                            {/* Image Topic */}
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
                                                    <span>Image Topic ID</span>
                                                    <button
                                                        onClick={() => handleTestSync('images', config.TELEGRAM_STORAGE_TOPIC_IMAGES)}
                                                        disabled={testing === 'images'}
                                                        className="text-[9px] font-black text-[#749F8B] hover:text-[#FEBD8B] transition-colors"
                                                    >
                                                        {testing === 'images' ? 'Sending...' : 'Test'}
                                                    </button>
                                                </label>
                                                <input
                                                    type="number"
                                                    value={config.TELEGRAM_STORAGE_TOPIC_IMAGES}
                                                    onChange={(e) => setConfig({ ...config, TELEGRAM_STORAGE_TOPIC_IMAGES: e.target.value })}
                                                    className="w-full bg-[#1A082E] border border-[#FEBD8B]/10 rounded-xl px-4 py-2.5 font-mono text-xs text-[#FDF2D9] focus:outline-none focus:border-[#FEBD8B]/40 transition-colors"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex pt-4">
                                            <button
                                                onClick={handleSaveConfig}
                                                disabled={saving}
                                                className="w-full md:w-auto px-8 py-3 bg-[#749F8B] hover:bg-[#749F8B]/80 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-[0_0_20px_rgba(116,159,139,0.2)] transition-all disabled:opacity-50"
                                            >
                                                {saving ? 'Synchronizing...' : 'Save Configuration'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredApps.map((app) => (
                            <div
                                key={app.id}
                                onClick={() => router.push(`/app-library/${app.id}`)}
                                className="relative bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 border border-purple-500/20 rounded-2xl overflow-hidden hover:border-purple-400/50 cursor-pointer"
                            >
                                <div className="p-6 flex flex-col h-full">
                                    {/* Header with icon and category badge */}
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="shrink-0">
                                            <div className="w-16 h-16 rounded-xl overflow-hidden border border-purple-400/30 bg-slate-800/80 flex items-center justify-center shadow-lg">
                                                {app.versions && app.versions.length > 0 && app.versions[0].imageUrl ? (
                                                    <LoadingImage
                                                        src={`/api/telegram/image/${app.versions[0].imageUrl}`}
                                                        alt={app.name}
                                                        className="w-full h-full object-cover"
                                                        fallback={
                                                            <svg className="w-10 h-10" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                <rect x="3" y="3" width="18" height="18" rx="1" transform="translate(24) rotate(90)" fill="#2ca9bc" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                                <line x1="13.11" y1="7" x2="7.56" y2="17" stroke="#000000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                                                                <path d="M10.89,7l5.55,10M7,15H17" fill="none" stroke="#000000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                                                            </svg>
                                                        }
                                                    />
                                                ) : app.iconStatic && app.iconStatic !== '📦' ? (
                                                    <LoadingImage
                                                        src={app.iconStatic}
                                                        alt={app.name}
                                                        className="w-full h-full object-cover"
                                                        fallback={
                                                            <svg className="w-10 h-10" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                <rect x="3" y="3" width="18" height="18" rx="1" transform="translate(24) rotate(90)" fill="rgba(168, 85, 247, 0.15)" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                                <line x1="13.11" y1="7" x2="7.56" y2="17" stroke="rgba(168, 85, 247, 0.6)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                                                                <path d="M10.89,7l5.55,10M7,15H17" fill="none" stroke="rgba(168, 85, 247, 0.6)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                                                            </svg>
                                                        }
                                                    />
                                                ) : (
                                                    <svg className="w-10 h-10" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <rect x="3" y="3" width="18" height="18" rx="1" transform="translate(24) rotate(90)" fill="rgba(168, 85, 247, 0.15)" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                        <line x1="13.11" y1="7" x2="7.56" y2="17" stroke="rgba(168, 85, 247, 0.6)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                                                        <path d="M10.89,7l5.55,10M7,15H17" fill="none" stroke="rgba(168, 85, 247, 0.6)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                                                    </svg>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <h3 className="text-base font-bold text-slate-100 line-clamp-1 leading-tight">
                                                    {capitalizeWords(app.name)}
                                                </h3>
                                                <button
                                                    onClick={e => { e.stopPropagation(); handleCopyLink(e, app.id); }}
                                                    className="shrink-0 p-1.5 text-slate-500 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg"
                                                    title="Copy Link"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                                                </button>
                                            </div>
                                            
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-bold uppercase tracking-wider">
                                                    <span className="w-1 h-1 rounded-full bg-purple-400" />
                                                    {app.category}
                                                </span>
                                                <span className="text-[11px] text-slate-500 font-mono">
                                                    v{app.versions && app.versions.length > 0 ? app.versions[0].version : '1.0.0'}
                                                </span>
                                            </div>
                                            
                                            {app.developer && (
                                                <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-medium">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                    {app.developer}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Description */}
                                    <p className="text-sm text-slate-400 leading-relaxed line-clamp-2 mb-4 flex-1">
                                        {app.description || 'No description available.'}
                                    </p>
                                    
                                    {/* Footer */}
                                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-4 text-[11px]">
                                            <div className="flex items-center gap-1.5 text-slate-500">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                <span className="font-medium">{app.downloadCount || 0}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-slate-500">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                <span className="font-medium">{app.viewCount || 0}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-400">
                                            <span>View Details</span>
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {filteredApps.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-[#749F8B]/70 border border-dashed border-[#749F8B]/20 rounded-3xl bg-[#1A082E]/40 mt-8">
                            <svg className="w-12 h-12 mb-4 opacity-50 text-[#749F8B]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                            <h3 className="text-lg font-bold text-[#FDF2D9]">No Apps Found</h3>
                            <p className="text-sm mt-1">Try modifying your search criteria.</p>
                        </div>
                    )}
                </div>
            )}


            {/* Add App Modal */}
            {showAddAppModal && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => !submittingApp && setShowAddAppModal(false)}>
                    <div className="bg-[#1A082E] border border-[#FEBD8B]/20 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6 md:p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-black text-white tracking-tight">Add New App</h3>
                                    <p className="text-sm text-slate-400 mt-1">Upload a new application to the library</p>
                                </div>
                                <button onClick={() => !submittingApp && setShowAddAppModal(false)} className="text-slate-500 hover:text-white transition-colors" disabled={submittingApp}>
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <form onSubmit={handleSubmitApp} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">App Name <span className="text-red-400">*</span></label>
                                        <input
                                            required
                                            type="text"
                                            value={appName}
                                            onChange={(e) => setAppName(e.target.value)}
                                            placeholder="e.g. Devora Scanner"
                                            className="w-full bg-[#110a17] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FEBD8B]/50 transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Developer</label>
                                        <input
                                            type="text"
                                            value={developer}
                                            onChange={(e) => setDeveloper(e.target.value)}
                                            placeholder="e.g. Devora Labs"
                                            className="w-full bg-[#110a17] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FEBD8B]/50 transition-colors"
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
                                            className="w-full bg-[#110a17] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FEBD8B]/50 transition-colors font-mono"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Android Version</label>
                                        <input
                                            type="text"
                                            value={androidVersion}
                                            onChange={(e) => setAndroidVersion(e.target.value)}
                                            placeholder="e.g. 8.0+"
                                            className="w-full bg-[#110a17] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FEBD8B]/50 transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Category</label>
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="w-full bg-[#110a17] border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-300 focus:outline-none focus:border-[#FEBD8B]/50 transition-colors appearance-none"
                                        >
                                            <option value="Mod">Mod</option>
                                            <option value="Original">Original</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Description</label>
                                        <textarea
                                            rows={2}
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Briefly describe what the app does..."
                                            className="w-full bg-[#110a17] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FEBD8B]/50 transition-colors resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">APK File ID <span className="text-red-400">*</span></label>
                                        <input
                                            required
                                            type="text"
                                            value={apkFileId}
                                            onChange={(e) => setApkFileId(e.target.value)}
                                            placeholder="Paste Telegram file ID here"
                                            className="w-full bg-[#110a17] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FEBD8B]/50 transition-colors font-mono"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">App Icon File ID (Optional)</label>
                                        <input
                                            type="text"
                                            value={imageFileId}
                                            onChange={(e) => setImageFileId(e.target.value)}
                                            placeholder="Paste Telegram photo ID here"
                                            className="w-full bg-[#110a17] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#749F8B]/50 transition-colors font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddAppModal(false)}
                                        className="px-5 py-2.5 bg-transparent border border-white/10 hover:bg-white/5 text-slate-300 font-bold text-sm rounded-xl transition-colors"
                                        disabled={submittingApp}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submittingApp || !appName || !version || !apkFileId}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-[#749F8B] hover:bg-[#749F8B]/80 text-white font-black text-sm rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submittingApp ? 'Saving...' : 'Save App'}
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
