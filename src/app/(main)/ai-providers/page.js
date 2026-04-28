'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { HeroHeader, LoadingState } from '@/components/HeroHeader';
import { getAvailablePresets } from '@/constants/ai-proxy.constants';

export default function AiProvidersPage() {
    const [search, setSearch] = useState('');
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    const [baseUrl, setBaseUrl] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // all | active | suspend
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingModel, setEditingModel] = useState(null);
    const [formData, setFormData] = useState({ id: '', name: '', ownedBy: '', proxyPreset: 'DEFAULT', baseUrl: '', contextLength: '' });
    const [healthStatus, setHealthStatus] = useState({ status: 'idle', color: 'gray', errorRate: 0 });
    const proxyPresets = getAvailablePresets();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setBaseUrl(`${window.location.origin}/api/v1/ai`);
        }
        const fetchUser = async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user);
                }
            } catch (err) { /* silent */ }
        };

        const fetchModels = async () => {
            try {
                const res = await fetch('/api/ai-providers/models');
                if (!res.ok) throw new Error('Failed to fetch models from server');
                const data = await res.json();
                setModels(data.data || []);
            } catch (err) {
                setError(err.message);
                toast.error(err.message);
            } finally {
                setLoading(false);
            }
        };

        const fetchHealth = async () => {
            try {
                const res = await fetch('/api/ai-providers/health');
                if (res.ok) {
                    const data = await res.json();
                    setHealthStatus(data);
                }
            } catch (err) { /* silent */ }
        };

        fetchUser();
        fetchModels();
        fetchHealth();
        
        // Poll health every 30 seconds
        const healthInterval = setInterval(fetchHealth, 30000);
        return () => clearInterval(healthInterval);
    }, []);

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success(`Copied to clipboard`, {
            style: {
                background: '#0c0e1a',
                color: '#cbd5e1',
                border: '1px solid rgba(255,255,255,0.1)',
                fontSize: '10px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
            },
            iconTheme: {
                primary: '#8b5cf6',
                secondary: '#0c0e1a',
            },
        });
    };

    const handleRestrictionToggle = async (modelId, currentState) => {
        const newRestricted = !currentState;
        setModels(prev => prev.map(m => m.id === modelId ? { ...m, isRestricted: newRestricted } : m));

        try {
            const res = await fetch('/api/ai-providers/models/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ modelId, isRestricted: newRestricted })
            });
            if (!res.ok) throw new Error('Failed to update restriction');
            toast.success(`Access restriction ${newRestricted ? 'ENABLED' : 'DISABLED'}`, {
                style: { background: '#0B0F1A', color: '#D9C5C5', border: '1px solid #D9C5C511', fontSize: '9px', fontWeight: 'black' }
            });
        } catch (err) {
            setModels(prev => prev.map(m => m.id === modelId ? { ...m, isRestricted: currentState } : m));
            toast.error(err.message);
        }
    };

    const handleWhitelistUpdate = async (modelId, emails) => {
        // Assume emails is an array
        const normalizedEmails = emails.map(email => email.trim().toLowerCase()).filter(Boolean);
        const shouldRestrict = normalizedEmails.length > 0;
        setModels(prev => prev.map(m => m.id === modelId ? { ...m, allowedEmails: normalizedEmails, isRestricted: shouldRestrict } : m));
        try {
            const res = await fetch('/api/ai-providers/models/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ modelId, allowedEmails: normalizedEmails, isRestricted: shouldRestrict })
            });
            if (!res.ok) throw new Error('Failed to update whitelist');
            toast.success('Whitelist updated', {
                style: { background: '#0B0F1A', color: '#D9C5C5', border: '1px solid #D9C5C511', fontSize: '9px', fontWeight: 'black' }
            });
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleStatusChange = async (modelId, newStatus) => {
        // Optimistic update
        const previousModels = [...models];
        setModels(prev => prev.map(m =>
            m.id === modelId ? { ...m, status: newStatus } : m
        ));

        try {
            const res = await fetch('/api/ai-providers/models/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ modelId, status: newStatus })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to persist status');
            }

            toast.success(`Model status updated to ${newStatus.toUpperCase()}`, {
                style: {
                    background: '#0c0e1a',
                    color: '#cbd5e1',
                    border: '1px solid rgba(255,255,255,0.05)',
                    fontSize: '9px',
                    fontWeight: 'black',
                    textTransform: 'uppercase'
                }
            });
        } catch (err) {
            // Rollback on error
            setModels(previousModels);
            toast.error(err.message, {
                style: {
                    background: '#0c0e1a',
                    color: '#ef4444',
                    border: '1px solid rgba(239,68,68,0.2)',
                    fontSize: '9px',
                }
            });
        }
    };

    const handleAddModel = async () => {
        if (!formData.id || !formData.name || !formData.ownedBy) {
            toast.error('All fields are required');
            return;
        }

        try {
            const res = await fetch('/api/ai-providers/models', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to add model');
            }

            const { data } = await res.json();
            setModels(prev => [...prev, {
                id: data.id,
                name: data.name,
                owned_by: data.ownedBy,
                created: data.created,
                status: data.status,
                isRestricted: data.isRestricted,
                allowedEmails: [],
                baseUrl: data.baseUrl || null,
                proxyPreset: data.proxyPreset || 'DEFAULT',
                contextLength: data.contextLength || 128000
            }]);

            toast.success('Model added successfully');
            setShowAddModal(false);
            setFormData({ id: '', name: '', ownedBy: '', proxyPreset: 'DEFAULT', baseUrl: '', contextLength: '' });
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleEditModel = async () => {
        if (!formData.id || !formData.name || !formData.ownedBy) {
            toast.error('All fields are required');
            return;
        }

        try {
            const res = await fetch('/api/ai-providers/models', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update model');
            }

            setModels(prev => prev.map(m => 
                m.id === formData.id 
                    ? { ...m, name: formData.name, owned_by: formData.ownedBy, baseUrl: formData.baseUrl || null, proxyPreset: formData.proxyPreset || 'DEFAULT', contextLength: parseInt(formData.contextLength) || 128000 }
                    : m
            ));

            toast.success('Model updated successfully');
            setEditingModel(null);
            setFormData({ id: '', name: '', ownedBy: '', proxyPreset: 'DEFAULT', baseUrl: '', contextLength: '' });
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleDeleteModel = async (modelId) => {
        if (!confirm('Are you sure you want to delete this model?')) return;

        try {
            const res = await fetch(`/api/ai-providers/models?id=${modelId}`, {
                method: 'DELETE'
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete model');
            }

            setModels(prev => prev.filter(m => m.id !== modelId));
            toast.success('Model deleted successfully');
        } catch (err) {
            toast.error(err.message);
        }
    };

    const openEditModal = (model) => {
        setEditingModel(model);
        setFormData({
            id: model.id,
            name: model.name,
            ownedBy: model.owned_by,
            proxyPreset: model.proxyPreset || 'DEFAULT',
            baseUrl: model.baseUrl || '',
            contextLength: model.contextLength ? String(model.contextLength) : ''
        });
    };

    const filteredModels = models.filter(m => {
        // 1. Search filter
        const matchesSearch = m.id.toLowerCase().includes(search.toLowerCase()) ||
            m.owned_by.toLowerCase().includes(search.toLowerCase());
        if (!matchesSearch) return false;

        // 2. Email Prefix (Private Models) filter
        if (m.id.includes('/')) {
            const prefix = m.id.split('/')[0];
            const isEmail = prefix.includes('@');
            if (isEmail && user?.email !== prefix && user?.role !== 'ULTRA') {
                return false;
            }
        }

        // 3. Privacy filter
        if (user?.role !== 'ULTRA' && m.status === 'hidden') return false;

        // 4. Status filter (User toggle)
        if (statusFilter !== 'all' && m.status !== statusFilter) return false;

        return true;
    }).sort((a, b) => {
        const statusOrder = { 'active': 0, 'suspend': 1, 'hidden': 2 };
        const aOrder = statusOrder[a.status] ?? 0;
        const bOrder = statusOrder[b.status] ?? 0;

        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.id.localeCompare(b.id); // Alpha sort for same status
    });

    const groupedModels = filteredModels.reduce((acc, model) => {
        const owner = model.owned_by || 'Other';
        if (!acc[owner]) acc[owner] = [];
        acc[owner].push(model);
        return acc;
    }, {});

    const activeCount = models.filter(m => m.status === 'active').length;
    const suspendCount = models.filter(m => m.status === 'suspend').length;

    const getStatusStyle = (status) => {
        switch (status) {
            case 'suspend': return 'text-amber-400 border-amber-400/30 bg-amber-400/10';
            case 'hidden': return 'text-slate-400 border-slate-600/30 bg-slate-700/20 opacity-70';
            default: return 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10';
        }
    };

    const formatContextLength = (value) => {
        const numericValue = Number(value);
        if (!Number.isFinite(numericValue) || numericValue <= 0) return null;

        if (numericValue >= 1000000) {
            const formatted = numericValue / 1000000;
            return `${Number.isInteger(formatted) ? formatted : formatted.toFixed(1)}M`;
        }

        if (numericValue >= 1000) {
            const formatted = numericValue / 1000;
            return `${Number.isInteger(formatted) ? formatted : Math.round(formatted)}K`;
        }

        return `${numericValue}`;
    };

    const getProviderBadge = (model) => {
        switch (model.proxyPreset) {
            case 'ROUTER':
                return { label: '9ROUTER', className: 'border-cyan-400/30 text-cyan-300 bg-cyan-500/10' };
            case 'CPA':
                return { label: 'CPA', className: 'border-fuchsia-400/30 text-fuchsia-300 bg-fuchsia-500/10' };
            default:
                return { label: 'DEFAULT', className: 'border-slate-400/30 text-slate-300 bg-slate-500/10' };
        }
    };

    const WhitelistManager = ({ modelId, emails, onUpdate }) => {
        const [input, setInput] = useState('');
        const addEmail = (e) => {
            if (e.key === 'Enter' && input.trim()) {
                if (!emails.includes(input.trim().toLowerCase())) {
                    onUpdate(modelId, [...emails, input.trim().toLowerCase()]);
                }
                setInput('');
            }
        };
        const removeEmail = (email) => {
            onUpdate(modelId, emails.filter(e => e !== email));
        };

        return (
            <div className="mt-3 pt-3 border-t border-slate-600/30">
                <p className="text-[7px] font-bold uppercase text-blue-300 tracking-widest mb-2 flex items-center justify-between">
                    <span>Whitelist Emails ({emails.length})</span>
                    {emails.length === 0 && <span className="text-amber-400/70 lowercase italic font-light">None set</span>}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                    {emails.map(email => (
                        <span key={email} className="text-[8px] bg-blue-500/15 border border-blue-400/30 text-blue-300 px-1.5 py-0.5 rounded-sm flex items-center gap-1 group/chip">
                            {email}
                            <button onClick={() => removeEmail(email)} className="hover:text-red-400">×</button>
                        </span>
                    ))}
                </div>
                <input
                    type="email"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={addEmail}
                    placeholder="Add user email..."
                    className="w-full bg-slate-800/60 border border-slate-600/50 rounded-sm px-3 py-1.5 text-[9px] text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-400/50 font-mono transition-all"
                />
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-6 pb-12">
            <HeroHeader
                breadcrumbs={[
                    {
                        label: "Dashboard",
                        href: "/",
                        icon: <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                    },
                    {
                        label: "AI Providers",
                        icon: <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.6)] animate-pulse mr-1" />
                    }
                ]}
                title="AI"
                badge="Providers"
                description="Manage your local API core and supported upstream models. Flat developer-focused architecture optimized for ultra-low latency."
            />

            {loading ? (
                <LoadingState  message="Synchronizing Upstream Models..." />
            ) : error ? (
                <div className="py-20 text-center border border-dashed border-red-500/10 rounded text-red-500/60 text-[10px] font-mono uppercase tracking-[0.2em]">
                    API CONNECTION ERROR: {error}
                </div>
            ) : (
                <>
                    <div className="border border-white/10 bg-gradient-to-br from-slate-800/40 to-slate-900/40 rounded-xl overflow-hidden shadow-xl">
                        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start sm:items-center gap-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl border border-purple-400/30 flex items-center justify-center bg-purple-500/10 text-purple-300 shadow-inner shrink-0">
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-[9px] sm:text-[10px] font-bold text-slate-200 uppercase tracking-[0.2em]">Core Endpoint</h3>
                                        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                                            healthStatus.color === 'emerald' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' :
                                            healthStatus.color === 'green' ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' :
                                            healthStatus.color === 'yellow' ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]' :
                                            healthStatus.color === 'orange' ? 'bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.5)]' :
                                            healthStatus.color === 'red' ? 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]' :
                                            'bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.5)]'
                                        }`} />
                                    </div>
                                    <div className="flex items-center gap-2 mt-1.5 overflow-hidden">
                                        <code className="text-[9px] sm:text-[10px] font-mono text-slate-200 bg-slate-700/50 border border-slate-600/50 px-2 py-0.5 rounded-xs truncate sm:whitespace-normal break-all">{baseUrl}</code>
                                        <button
                                            onClick={() => copyToClipboard(baseUrl)}
                                            className="text-slate-600 hover:text-slate-100 transition-colors shrink-0"
                                            title="Copy Base URL"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm border ${
                                    healthStatus.color === 'emerald' ? 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10' :
                                    healthStatus.color === 'green' ? 'text-green-300 border-green-400/30 bg-green-400/10' :
                                    healthStatus.color === 'yellow' ? 'text-yellow-300 border-yellow-400/30 bg-yellow-400/10' :
                                    healthStatus.color === 'orange' ? 'text-orange-300 border-orange-400/30 bg-orange-400/10' :
                                    healthStatus.color === 'red' ? 'text-red-300 border-red-400/30 bg-red-400/10' :
                                    'text-slate-300 border-slate-400/30 bg-slate-400/10'
                                }`}>
                                    {healthStatus.status.toUpperCase()}
                                </span>
                                {healthStatus.errorRate > 0 && (
                                    <span className="text-[7px] text-slate-400 font-mono">
                                        {healthStatus.errorRate}% ERR
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="border border-slate-600/40 bg-slate-800/30 p-4 sm:p-5 rounded-xl flex flex-col sm:flex-row items-start gap-4 backdrop-blur-sm">
                        <div className="p-2 rounded-lg bg-slate-700/40 border border-slate-600/40 text-slate-300 shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div className="flex-1">                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-300">Developer Notice</p>
                            <div className="text-[10px] text-slate-300 mt-2.5 space-y-2 font-mono">
                                <div className="flex items-center gap-2">
                                    <span className="w-1 h-1 rounded-full bg-slate-500" />
                                    <span><span className="text-emerald-300 font-bold">ACTIVE</span> &mdash; Highly available system endpoints.</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-1 h-1 rounded-full bg-slate-500" />
                                    <span><span className="text-amber-400 font-bold">SUSPENDED</span> &mdash; Model is temporarily offline.</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-1 h-1 rounded-full bg-slate-500" />
                                    <span><span className="text-blue-300 font-bold">RESTRICTED</span> &mdash; Whitelist authorization required.</span>
                                </div>
 
                                <div className="mt-3 text-slate-300 italic bg-slate-700/40 p-2 border-l border-slate-500/50 rounded-r-md">
                                    * API access requires a valid <a href="/api-key" className="text-slate-100 hover:text-white underline underline-offset-4 decoration-slate-400/40 transition-colors font-bold">Bearer Token</a>.
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
                        <div className="flex flex-col sm:flex-row flex-1 items-stretch gap-2 max-w-2xl">
                            <div className="relative flex-1 group">
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-purple-400 transition-colors">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search identifiers or providers..."
                                    className="w-full bg-slate-800/50 border border-slate-600/50 rounded-sm pl-9 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-400/50 transition-all font-mono"
                                />
                            </div>

                            <div className="flex items-center p-1 bg-slate-800/50 border border-slate-600/50 rounded-sm shrink-0">
                                {[
                                    { id: 'all', label: 'ALL' },
                                    { id: 'active', label: 'ACTIVE', dot: 'bg-emerald-400' },
                                    { id: 'suspend', label: 'SUSPEND', dot: 'bg-amber-500' }
                                ].map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setStatusFilter(t.id)}
                                        className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 ${statusFilter === t.id
                                            ? 'bg-slate-700/60 text-slate-100 shadow-inner'
                                            : 'text-slate-400 hover:text-slate-200'
                                            }`}
                                    >
                                        {t.dot && <span className={`w-1 h-1 rounded-full ${t.dot} ${statusFilter === t.id ? 'animate-pulse' : ''}`} />}
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6 text-[10px] font-bold uppercase tracking-widest px-5 py-3 sm:py-2.5 border border-slate-600/40 rounded-xl bg-slate-800/40 shadow-xl overflow-hidden">
                            <div className="flex items-center justify-between sm:justify-start gap-3 border-b sm:border-b-0 sm:border-r border-slate-600/30 pb-2 sm:pb-0 sm:pr-5">
                                <span className="text-slate-300">Synchronized Models</span>
                                <span className="text-slate-100 font-mono text-xs font-bold">{models.length}</span>
                            </div>

                            <div className="flex items-center justify-around sm:justify-start gap-8 sm:gap-5 pt-1 sm:pt-0">
                                <div className="flex items-center gap-2.5 group">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#10B981]" />
                                    <span className="text-emerald-300 font-bold hidden sm:inline">ACTIVE</span>
                                    <span className="text-slate-100 font-mono text-xs italic">{activeCount}</span>
                                </div>

                                <div className="flex items-center gap-2.5 group">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_#F59E0B]" />
                                    <span className="text-amber-400 font-bold hidden sm:inline">SUSPENDED</span>
                                    <span className="text-slate-100 font-mono text-xs italic">{suspendCount}</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    {user?.role === 'ULTRA' && (
                        <div className="flex justify-end">
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 rounded-lg text-purple-300 text-[10px] font-bold uppercase tracking-widest transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                Add Model
                            </button>
                        </div>
                    )}

                    <div className="grid gap-6 sm:gap-10">
                        {Object.entries(groupedModels).map(([owner, ownerModels]) => (
                            <div key={owner} className="space-y-4">
                                <div className="flex items-center gap-3 px-1">
                                    <span className="w-3 h-2 rounded-full bg-purple-400/50" />
                                    <h4 className="text-[11px] font-bold text-slate-200 uppercase tracking-[0.4em]">{owner}</h4>
                                    <div className="h-px flex-1 bg-slate-600/30 ml-4" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {ownerModels.map(model => {
                                        const contextBadge = formatContextLength(model.contextLength);
                                        const providerBadge = getProviderBadge(model);

                                        return (
                                        <div key={model.id} className={`p-4 border border-slate-600/40 bg-slate-800/40 hover:bg-slate-700/40 transition-all rounded-xl group flex flex-col justify-between min-h-[120px] ${model.status === 'hidden' ? 'ring-1 ring-slate-600/40 opacity-50' : 'shadow-lg shadow-black/20'}`}>
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex flex-col gap-1.5">
                                                    <code className="text-[11px] font-mono text-blue-300 group-hover:text-blue-200 transition-colors break-all leading-relaxed">
                                                        {model.id}
                                                    </code>
                                                    {model.baseUrl && (
                                                        <div className="mt-1">
                                                            <span className="text-[7px] font-mono text-slate-400 bg-slate-700/30 px-1.5 py-0.5 rounded-xs truncate max-w-[200px] inline-block">
                                                                {model.baseUrl}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="flex gap-1.5 flex-wrap">
                                                        <span className={`text-[7px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-xs border ${getStatusStyle(model.status)}`}>
                                                            {model.status}
                                                        </span>
                                                         {user?.role === 'ULTRA' && providerBadge && providerBadge.label !== 'DEFAULT' && (
                                                             <span className={`text-[7px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-xs border ${providerBadge.className}`}>
                                                                 {providerBadge.label}
                                                             </span>
                                                         )}
                                                         {contextBadge && (
                                                            <span className="text-[7px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-xs border border-emerald-400/30 text-emerald-300 bg-emerald-500/10">
                                                                 {contextBadge}
                                                            </span>
                                                        )}
                                                        {model.isRestricted && (
                                                            <span className="text-[7px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-xs border border-blue-400/30 text-blue-300 bg-blue-500/10">
                                                                RESTRICTED
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {user?.role === 'ULTRA' ? (
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handleStatusChange(model.id, 'active')}
                                                                className={`p-1 rounded-sm bg-emerald-500/10 border ${model.status === 'active' ? 'border-emerald-500/50 text-emerald-400' : 'border-white/10 text-slate-600 hover:text-emerald-400'}`}
                                                                title="Set Active"
                                                            >
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                            </button>
                                                            <button
                                                                onClick={() => handleRestrictionToggle(model.id, model.isRestricted)}
                                                                className={`p-1 rounded-sm bg-blue-500/10 border ${model.isRestricted ? 'border-blue-500/50 text-blue-400' : 'border-white/10 text-slate-600 hover:text-blue-400'}`}
                                                                title="Toggle Access Restriction"
                                                            >
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusChange(model.id, 'suspend')}
                                                                className={`p-1 rounded-sm bg-amber-500/10 border ${model.status === 'suspend' ? 'border-amber-500/50 text-amber-400' : 'border-white/10 text-slate-600 hover:text-amber-400'}`}
                                                                title="Set Suspended"
                                                            >
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusChange(model.id, 'hidden')}
                                                                className={`p-1 rounded-sm bg-red-500/10 border ${model.status === 'hidden' ? 'border-red-500/50 text-red-400' : 'border-white/10 text-slate-600 hover:text-red-400'}`}
                                                                title="Hide Model"
                                                            >
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                                                            </button>
                                                            <button
                                                                onClick={() => openEditModal(model)}
                                                                className="p-1 rounded-sm bg-blue-500/10 border border-white/10 text-slate-600 hover:text-blue-400"
                                                                title="Edit Model"
                                                            >
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteModel(model.id)}
                                                                className="p-1 rounded-sm bg-red-500/10 border border-white/10 text-slate-600 hover:text-red-400"
                                                                title="Delete Model"
                                                            >
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => copyToClipboard(model.id)}
                                                            className="text-slate-400 hover:text-purple-300 transition-colors p-1"
                                                            title="Copy Model ID"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {user?.role === 'ULTRA' && model.isRestricted && (
                                                <WhitelistManager
                                                    modelId={model.id}
                                                    emails={model.allowedEmails || []}
                                                    onUpdate={handleWhitelistUpdate}
                                                />
                                            )}

                                            <div className="mt-4 pt-4 border-t border-slate-600/30 flex items-center justify-between">
                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                                    SYS_MODEL
                                                </span>
                                                <span className="text-[9px] font-mono text-slate-300 bg-slate-700/40 px-2 py-0.5 rounded-xs">
                                                    v{model.created ? new Date(model.created * 1000).getFullYear() : '2026'}.{model.created ? new Date(model.created * 1000).getMonth() + 1 : '1'}
                                                </span>
                                            </div>
                                        </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Add/Edit Model Modal */}
            {(showAddModal || editingModel) && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 border border-slate-600/50 rounded-xl p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold text-slate-100 mb-4 uppercase tracking-wider">
                            {editingModel ? 'Edit Model' : 'Add New Model'}
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-300 mb-2 block">
                                    Model ID
                                </label>
                                <input
                                    type="text"
                                    value={formData.id}
                                    onChange={e => setFormData({ ...formData, id: e.target.value })}
                                    disabled={!!editingModel}
                                    placeholder="e.g., gpt-4, claude-3-opus"
                                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-400/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-300 mb-2 block">
                                    Model Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., GPT-4, Claude 3 Opus"
                                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-400/50 transition-all"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-300 mb-2 block">
                                    Owned By
                                </label>
                                <input
                                    type="text"
                                    value={formData.ownedBy}
                                    onChange={e => setFormData({ ...formData, ownedBy: e.target.value })}
                                    placeholder="e.g., OpenAI, Anthropic"
                                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-400/50 transition-all"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-300 mb-2 block">
                                    Base URL (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={formData.baseUrl}
                                    onChange={e => setFormData({ ...formData, baseUrl: e.target.value })}
                                    placeholder="e.g., https://api.openai.com/v1"
                                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-400/50 transition-all"
                                />
                                <p className="text-[8px] text-slate-400 mt-1.5 font-mono">
                                    Custom endpoint for this model. Leave empty to use proxy preset URL.
                                </p>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-300 mb-2 block">
                                    Context Length
                                </label>
                                <input
                                    type="number"
                                    value={formData.contextLength}
                                    onChange={e => setFormData({ ...formData, contextLength: e.target.value })}
                                    placeholder="e.g., 128000"
                                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-400/50 transition-all"
                                />
                                <p className="text-[8px] text-slate-400 mt-1.5 font-mono">
                                    Maximum context window in tokens. Default: 128000
                                </p>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-300 mb-2 block">
                                    Proxy Server
                                </label>
                                <select
                                    value={formData.proxyPreset}
                                    onChange={e => setFormData({ ...formData, proxyPreset: e.target.value })}
                                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-purple-400/50 transition-all"
                                >
                                    {proxyPresets.map(preset => (
                                        <option key={preset.value} value={preset.value}>
                                            {preset.label}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[8px] text-slate-400 mt-1.5 font-mono">
                                    Configure proxy URLs in environment variables
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setEditingModel(null);
                                    setFormData({ id: '', name: '', ownedBy: '', proxyPreset: 'DEFAULT', baseUrl: '', contextLength: '' });
                                }}
                                className="flex-1 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 rounded-lg text-slate-300 text-[10px] font-bold uppercase tracking-widest transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={editingModel ? handleEditModel : handleAddModel}
                                className="flex-1 px-4 py-2.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 rounded-lg text-purple-300 text-[10px] font-bold uppercase tracking-widest transition-all"
                            >
                                {editingModel ? 'Update' : 'Add'} Model
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
