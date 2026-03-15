'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; import { Plug, Wrench, CheckCircle2, Activity, Plus, X, Edit2, Trash2 } from 'lucide-react';

const FEATURE_ICONS = {
    'airdrops': <img src="/icons/menu.png" className="w-6 h-6 object-contain" alt="Airdrops" />,
    'gmail-center': <img src="/icons/menu.png" className="w-6 h-6 object-contain" alt="Gmail" />,
    'mail-control': <img src="/icons/menu.png" className="w-6 h-6 object-contain" alt="Mail" />,
    'drive-center': <img src="/icons/menu.png" className="w-6 h-6 object-contain" alt="Drive" />,
    'groq-intelligence': <img src="/icons/menu.png" className="w-6 h-6 object-contain" alt="Groq Intelligence" />,
    'app-library': <img src="/icons/menu.png" className="w-6 h-6 object-contain" alt="App Library" />,
    'http-client': <img src="/icons/menu.png" className="w-6 h-6 object-contain" alt="HTTP Client" />,
};

const FEATURE_COLORS = {
    'airdrops': { icon: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    'gmail-center': { icon: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    'mail-control': { icon: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    'drive-center': { icon: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    'groq-intelligence': { icon: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
};

function ToggleSwitch({ enabled, onChange, loading }) {
    return (
        <button
            onClick={onChange}
            disabled={loading}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-300 focus:outline-none ${enabled ? 'bg-linear-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/25' : 'bg-white/10'} ${loading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
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

    // Add feature state
    const [isAddingFeature, setIsAddingFeature] = useState(false);
    const [newFeatureId, setNewFeatureId] = useState('');
    const [newFeatureLabel, setNewFeatureLabel] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Edit feature state
    const [editingFeatureConfig, setEditingFeatureConfig] = useState(null); // stores the original feature string
    const [editFeatureId, setEditFeatureId] = useState('');
    const [editFeatureLabel, setEditFeatureLabel] = useState('');
    const [isEditSubmitting, setIsEditSubmitting] = useState(false);

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

    const handleAddFeature = async (e) => {
        e.preventDefault();

        if (!newFeatureId.trim() || !newFeatureLabel.trim()) {
            showToast('Please fill in both fields', 'warning');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/maintenance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    feature: newFeatureId.trim(),
                    label: newFeatureLabel.trim()
                }),
            });

            if (res.ok) {
                const newConfig = await res.json();
                setConfigs(prev => [...prev, newConfig].sort((a, b) => a.feature.localeCompare(b.feature)));
                showToast('Feature added successfully', 'success');

                // Reset form
                setNewFeatureId('');
                setNewFeatureLabel('');
                setIsAddingFeature(false);
            } else {
                const errorData = await res.json();
                showToast(errorData.error || 'Failed to add feature', 'error');
            }
        } catch {
            showToast('An error occurred', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteFeature = async (featureStr, labelStr) => {
        if (!window.confirm(`Are you sure you want to permanently delete the maintenance configuration for "${labelStr}"?`)) {
            return;
        }

        setToggling(prev => ({ ...prev, [featureStr]: true }));
        try {
            const res = await fetch(`/api/maintenance/${featureStr}`, { method: 'DELETE' });
            if (res.ok) {
                setConfigs(prev => prev.filter(c => c.feature !== featureStr));
                showToast('Feature deleted', 'success');
            } else {
                const errorData = await res.json();
                showToast(errorData.error || 'Failed to delete feature', 'error');
            }
        } catch {
            showToast('An error occurred', 'error');
        } finally {
            setToggling(prev => ({ ...prev, [featureStr]: false }));
        }
    };

    const handleOpenEditModal = (config) => {
        setEditingFeatureConfig(config.feature);
        setEditFeatureId(config.feature);
        setEditFeatureLabel(config.label);
    };

    const handleEditFeatureSubmit = async (e) => {
        e.preventDefault();
        if (!editFeatureId.trim() || !editFeatureLabel.trim()) {
            showToast('Please fill in both fields', 'warning');
            return;
        }

        setIsEditSubmitting(true);
        try {
            const res = await fetch(`/api/maintenance/${editingFeatureConfig}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    newFeature: editFeatureId.trim(),
                    label: editFeatureLabel.trim()
                }),
            });

            if (res.ok) {
                const updatedConfig = await res.json();
                setConfigs(prev => {
                    const idx = prev.findIndex(c => c.feature === editingFeatureConfig);
                    if (idx === -1) return prev;
                    const newArr = [...prev];
                    newArr[idx] = updatedConfig;
                    return newArr.sort((a, b) => a.feature.localeCompare(b.feature));
                });
                showToast('Feature updated', 'success');
                setEditingFeatureConfig(null);
            } else {
                const errorData = await res.json();
                showToast(errorData.error || 'Failed to update feature', 'error');
            }
        } catch {
            showToast('An error occurred', 'error');
        } finally {
            setIsEditSubmitting(false);
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
                <div className="absolute inset-0 bg-linear-to-br from-gray-900 via-[#1a0d2e] to-gray-900" />
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
                        System <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-400 to-orange-400">Control</span>
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
                    <div className="absolute inset-0 bg-linear-to-br from-gray-900 via-[#1a0d2e] to-gray-900" />
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
                                <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-400 via-orange-400 to-amber-500">Maintenance</span>
                            </h1>
                            <p className="text-gray-400 mt-2 text-sm">Toggle feature availability and manage maintenance messages</p>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                            {activeCount > 0 && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-sm font-bold">
                                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                    {activeCount} Active
                                </div>
                            )}
                            <button
                                onClick={() => setIsAddingFeature(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl text-blue-300 text-sm font-bold transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Feature
                            </button>
                        </div>
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
                <div className="flex items-center justify-between mb-3 px-1">
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Feature Controls</h2>

                    {/* Mobile Add Button */}
                    <button
                        onClick={() => setIsAddingFeature(true)}
                        className="md:hidden flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-blue-300 text-[11px] font-bold transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Add
                    </button>
                </div>

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
                                        <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-amber-500/50 to-transparent" />
                                    )}

                                    <div className="p-5">
                                        {/* Header row */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-11 h-11 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center`}>
                                                    {FEATURE_ICONS[config.feature] || (
                                                        <img src="/icons/menu.png" className="w-6 h-6 object-contain" alt={config.label} />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white text-base flex items-center gap-2">
                                                        {config.label}
                                                    </div>
                                                    <div className="text-xs text-gray-500 font-mono">/{config.feature}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2.5">
                                                {/* Mini actions */}
                                                <div className="flex items-center mr-1">
                                                    <button
                                                        onClick={() => handleOpenEditModal(config)}
                                                        disabled={isToggling}
                                                        className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                        title="Edit Config"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteFeature(config.feature, config.label)}
                                                        disabled={isToggling}
                                                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                        title="Delete Config"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>

                                                {/* Status badge */}
                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border hidden sm:inline-block ${config.enabled
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

            {/* Add Feature Modal */}
            {isAddingFeature && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isSubmitting && setIsAddingFeature(false)} />
                    <div className="relative bg-[#0a0f1e] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl animate-fade-in-up">
                        <div className="flex items-center justify-between p-5 border-b border-white/5">
                            <h3 className="text-lg font-bold text-white">Add Custom Feature</h3>
                            <button
                                onClick={() => setIsAddingFeature(false)}
                                disabled={isSubmitting}
                                className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddFeature} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                                    Feature Display Name
                                </label>
                                <input
                                    type="text"
                                    value={newFeatureLabel}
                                    onChange={(e) => {
                                        setNewFeatureLabel(e.target.value);
                                        // Auto-generate slug if it's empty
                                        if (!newFeatureId) {
                                            setNewFeatureId(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
                                        }
                                    }}
                                    placeholder="e.g. Groq Intelligence Alpha"
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:bg-blue-500/5 transition-all"
                                    autoFocus
                                    required
                                />
                                <p className="text-[10px] text-gray-500 mt-1 pl-1">The name users will see.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                                    URL ID / Slug
                                </label>
                                <input
                                    type="text"
                                    value={newFeatureId}
                                    onChange={(e) => setNewFeatureId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                    placeholder="e.g. groq-intelligence-alpha"
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:bg-blue-500/5 transition-all font-mono"
                                    required
                                />
                                <p className="text-[10px] text-gray-500 mt-1 pl-1">Used internally and in routes (lowercase, no spaces).</p>
                            </div>

                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex gap-3 mt-4">
                                <Activity className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-amber-200/80 leading-relaxed">
                                    A default maintenance message will be generated automatically. You can edit it after creating the feature.
                                </p>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddingFeature(false)}
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold text-gray-300 transition-all disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !newFeatureId || !newFeatureLabel}
                                    className="flex-1 px-4 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-sm font-semibold text-white shadow-lg shadow-blue-700/25 border border-white/10 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                            Adding...
                                        </>
                                    ) : (
                                        'Add Feature'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Feature Modal */}
            {editingFeatureConfig && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isEditSubmitting && setEditingFeatureConfig(null)} />
                    <div className="relative bg-[#0a0f1e] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl animate-fade-in-up">
                        <div className="flex items-center justify-between p-5 border-b border-white/5">
                            <h3 className="text-lg font-bold text-white">Edit Feature Data</h3>
                            <button
                                onClick={() => setEditingFeatureConfig(null)}
                                disabled={isEditSubmitting}
                                className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleEditFeatureSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                                    Feature Display Name
                                </label>
                                <input
                                    type="text"
                                    value={editFeatureLabel}
                                    onChange={(e) => setEditFeatureLabel(e.target.value)}
                                    placeholder="e.g. Groq Intelligence Alpha"
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:bg-blue-500/5 transition-all"
                                    autoFocus
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                                    URL ID / Slug
                                </label>
                                <input
                                    type="text"
                                    value={editFeatureId}
                                    onChange={(e) => setEditFeatureId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                    placeholder="e.g. groq-intelligence-alpha"
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:bg-blue-500/5 transition-all font-mono"
                                    required
                                />
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setEditingFeatureConfig(null)}
                                    disabled={isEditSubmitting}
                                    className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold text-gray-300 transition-all disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isEditSubmitting || !editFeatureId || !editFeatureLabel}
                                    className="flex-1 px-4 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-sm font-semibold text-white shadow-lg shadow-blue-700/25 border border-white/10 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isEditSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
