'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; import { Plug, Wrench, CheckCircle2, Activity } from 'lucide-react';

const FEATURE_ICONS = {
    'airdrops': (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 21v-6m0 0l-3 3m3-3l3 3" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5.5 11C5.5 7.41 8.41 4.5 12 4.5S18.5 7.41 18.5 11" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 11a9 9 0 0118 0" />
            <line strokeLinecap="round" strokeWidth={1.5} x1="12" y1="15" x2="5.5" y2="11" />
            <line strokeLinecap="round" strokeWidth={1.5} x1="12" y1="15" x2="18.5" y2="11" />
        </svg>
    ),
    'gmail-center': (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" />
        </svg>
    ),
    'mail-control': (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    ),
    'drive-center': (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
    ),
    'chatbot': (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
    )
};

const FEATURE_COLORS = {
    'airdrops': { icon: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    'gmail-center': { icon: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    'mail-control': { icon: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    'drive-center': { icon: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    'chatbot': { icon: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
};

function ToggleSwitch({ enabled, onChange, loading }) {
    return (
        <button
            onClick={onChange}
            disabled={loading}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-300 focus:outline-none ${enabled ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/25' : 'bg-white/10'} ${loading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
        >
            <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${enabled ? 'translate-x-8' : 'translate-x-1'}`}
            />
        </button>
    );
}

export default function MaintenanceControlPage() {
    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState({});
    const [user, setUser] = useState(null);
    const [toast, setToast] = useState(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const [messageInput, setMessageInput] = useState('');
    const router = useRouter();

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        const stored = localStorage.getItem('user_info');
        if (stored) {
            try { setUser(JSON.parse(stored)); } catch { }
        } else {
            fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.user) setUser(d.user); });
        }

        fetch('/api/maintenance')
            .then(r => r.json())
            .then(data => { setConfigs(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    // Guard: redirect if not ULTRA
    useEffect(() => {
        if (user && user.role !== 'ULTRA') {
            router.replace('/');
        }
    }, [user, router]);

    const handleToggle = async (feature) => {
        const config = configs.find(c => c.feature === feature);
        if (!config) return;

        setToggling(prev => ({ ...prev, [feature]: true }));
        try {
            const res = await fetch(`/api/maintenance/${feature}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: !config.enabled }),
            });
            if (res.ok) {
                const updated = await res.json();
                setConfigs(prev => prev.map(c => c.feature === feature ? updated : c));
                showToast(`${config.label} maintenance ${updated.enabled ? 'enabled' : 'disabled'}`, updated.enabled ? 'warning' : 'success');
            } else {
                showToast('Failed to update', 'error');
            }
        } catch {
            showToast('An error occurred', 'error');
        } finally {
            setToggling(prev => ({ ...prev, [feature]: false }));
        }
    };

    const handleSaveMessage = async (feature) => {
        setToggling(prev => ({ ...prev, [feature]: true }));
        try {
            const res = await fetch(`/api/maintenance/${feature}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: messageInput }),
            });
            if (res.ok) {
                const updated = await res.json();
                setConfigs(prev => prev.map(c => c.feature === feature ? updated : c));
                showToast('Message updated', 'success');
                setEditingMessage(null);
            } else {
                showToast('Failed to update message', 'error');
            }
        } catch {
            showToast('An error occurred', 'error');
        } finally {
            setToggling(prev => ({ ...prev, [feature]: false }));
        }
    };

    const activeCount = configs.filter(c => c.enabled).length;

    if (loading || !user) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                    <p className="text-xs text-gray-500 animate-pulse">Loading maintenance configs…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg text-white text-sm font-medium animate-fade-in-up border border-white/10 ${toast.type === 'success' ? 'bg-green-600' : toast.type === 'warning' ? 'bg-amber-600' : 'bg-red-600'}`}>
                    {toast.message}
                </div>
            )}

            {/* Mobile Header */}
            <div className="md:hidden relative overflow-hidden rounded-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-[#1a0d2e] to-gray-900" />
                <div className="absolute -top-8 -left-8 w-52 h-52 rounded-full bg-amber-600/15 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-12 right-0 w-44 h-44 rounded-full bg-orange-500/15 blur-3xl pointer-events-none" />
                <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                <div className="relative z-10 p-5 pt-4">
                    <nav className="flex text-xs text-amber-300/70 mb-4">
                        <a href="/" className="flex items-center gap-1 hover:text-amber-300 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                            Dashboard
                        </a>
                        <svg className="w-3 h-3 mx-1.5 text-amber-400/40 mt-px self-center" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        <span className="font-semibold text-amber-200">Maintenance</span>
                    </nav>
                    <h1 className="text-2xl font-black text-white tracking-tight">
                        System <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">Control</span>
                    </h1>
                    <p className="text-gray-400 text-xs mt-1.5">Manage feature availability</p>
                    {activeCount > 0 && (
                        <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-300 text-[11px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            {activeCount} feature{activeCount > 1 ? 's' : ''} in maintenance
                        </div>
                    )}
                </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden md:block">
                <div className="relative overflow-hidden rounded-2xl mb-2">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-[#1a0d2e] to-gray-900" />
                    <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-amber-600/10 blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-16 -left-8 w-56 h-56 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.2) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
                    <div className="relative z-10 p-8 flex items-end justify-between">
                        <div>
                            <nav className="flex text-xs text-amber-300/60 mb-4">
                                <a href="/" className="flex items-center gap-1 hover:text-amber-300 transition-colors">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                    Dashboard
                                </a>
                                <svg className="w-3 h-3 mx-2 text-amber-400/30 self-center" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                <span className="text-amber-200 font-semibold">Maintenance Control</span>
                            </nav>
                            <h1 className="text-4xl font-black tracking-tight">
                                <span className="text-white">System </span>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500">Maintenance</span>
                            </h1>
                            <p className="text-gray-400 mt-2 text-sm">Toggle feature availability and manage maintenance messages</p>
                        </div>
                        {activeCount > 0 && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-sm font-bold">
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                {activeCount} Active
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Status overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Total Features', value: configs.length, color: 'text-blue-400', icon: <Plug className="w-5 h-5 opacity-80" /> },
                    { label: 'In Maintenance', value: activeCount, color: 'text-amber-400', icon: <Wrench className="w-5 h-5 opacity-80" /> },
                    { label: 'Online', value: configs.length - activeCount, color: 'text-emerald-400', icon: <CheckCircle2 className="w-5 h-5 opacity-80" /> },
                    { label: 'Coverage', value: configs.length > 0 ? `${Math.round((activeCount / configs.length) * 100)}%` : '0%', color: 'text-purple-400', icon: <Activity className="w-5 h-5 opacity-80" /> },
                ].map((stat, i) => (
                    <div key={i} className="bg-white/3 border border-white/8 rounded-2xl p-4 flex flex-col">
                        <span className="text-xl mb-2">{stat.icon}</span>
                        <div className={`text-2xl font-black ${stat.color}`}>{loading ? '—' : stat.value}</div>
                        <div className="text-xs text-gray-500 mt-1 font-medium">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Feature cards */}
            <div className="space-y-1">
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1 mb-3">Feature Controls</h2>

                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="animate-pulse bg-white/4 rounded-2xl h-24" />
                    ))
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {configs.map((config) => {
                            const colors = FEATURE_COLORS[config.feature] || { icon: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20' };
                            const isEditing = editingMessage === config.feature;
                            const isToggling = toggling[config.feature];

                            return (
                                <div
                                    key={config.feature}
                                    className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${config.enabled
                                        ? 'bg-amber-500/5 border-amber-500/20 shadow-lg shadow-amber-500/5'
                                        : 'bg-white/3 border-white/8'
                                        }`}
                                >
                                    {/* Glow when active */}
                                    {config.enabled && (
                                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
                                    )}

                                    <div className="p-5">
                                        {/* Header row */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-11 h-11 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center ${colors.icon}`}>
                                                    {FEATURE_ICONS[config.feature] || (
                                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" /></svg>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white text-base">{config.label}</div>
                                                    <div className="text-xs text-gray-500 font-mono">/{config.feature}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {/* Status badge */}
                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${config.enabled
                                                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/25'
                                                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25'
                                                    }`}>
                                                    {config.enabled ? '🔧 MAINTENANCE' : '✅ ONLINE'}
                                                </span>
                                                <ToggleSwitch
                                                    enabled={config.enabled}
                                                    onChange={() => handleToggle(config.feature)}
                                                    loading={isToggling}
                                                />
                                            </div>
                                        </div>

                                        {/* Message section */}
                                        <div className="bg-black/20 border border-white/5 rounded-xl p-3">
                                            {isEditing ? (
                                                <div className="space-y-2">
                                                    <textarea
                                                        value={messageInput}
                                                        onChange={e => setMessageInput(e.target.value)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-amber-500/40 resize-none"
                                                        rows={3}
                                                        placeholder="Custom maintenance message..."
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleSaveMessage(config.feature)}
                                                            disabled={isToggling}
                                                            className="flex-1 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-xs font-bold border border-amber-500/30 transition-colors disabled:opacity-50"
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingMessage(null)}
                                                            className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg text-xs font-bold border border-white/10 transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <div className="text-[10px] text-gray-600 font-semibold uppercase tracking-widest mb-1">Maintenance Message</div>
                                                        <p className="text-xs text-gray-400 leading-relaxed">
                                                            {config.message || 'No custom message set.'}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => { setEditingMessage(config.feature); setMessageInput(config.message || ''); }}
                                                        className="shrink-0 p-1.5 text-gray-600 hover:text-gray-400 hover:bg-white/5 rounded-lg transition-colors"
                                                        title="Edit message"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Last updated */}
                                        <div className="text-[10px] text-gray-600 mt-2 text-right">
                                            Updated: {new Date(config.updatedAt).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Info box */}
            <div className="bg-blue-500/5 border border-blue-500/15 rounded-2xl p-5 flex gap-4">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                    <div className="text-sm font-bold text-blue-300 mb-1">How it works</div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                        When you enable maintenance for a feature, users who navigate to that page will be automatically redirected to the maintenance page. ULTRA admins are <strong className="text-gray-300">not affected</strong> — they can still access features normally.
                    </p>
                </div>
            </div>
        </div>
    );
}
