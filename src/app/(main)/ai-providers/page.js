'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { HeroHeader, LoadingState } from '@/components/HeroHeader';

export default function AiProvidersPage() {
    const [search, setSearch] = useState('');
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    const [baseUrl, setBaseUrl] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // all | active | suspend

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

        fetchUser();
        fetchModels();
    }, []);

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success(`Copied to clipboard`, {
            style: {
                background: '#0F1219',
                color: '#D9C5C5',
                border: '1px solid #D9C5C533',
                fontSize: '10px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
            },
            iconTheme: {
                primary: '#D9C5C5',
                secondary: '#0F1219',
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
        setModels(prev => prev.map(m => m.id === modelId ? { ...m, allowedEmails: emails } : m));
        try {
            const res = await fetch('/api/ai-providers/models/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ modelId, allowedEmails: emails })
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
                    background: '#0B0F1A',
                    color: '#D9C5C5',
                    border: '1px solid #D9C5C511',
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
                    background: '#111111',
                    color: '#ff4b4b',
                    border: '1px solid #ff4b4b22',
                    fontSize: '9px',
                }
            });
        }
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
            case 'suspend': return 'text-amber-400 border-amber-400/20 bg-amber-400/5';
            case 'hidden': return 'text-slate-500 border-white/10 bg-white/5 opacity-70';
            default: return 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5';
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
            <div className="mt-3 pt-3 border-t border-white/2">
                <p className="text-[7px] font-black uppercase text-blue-400 tracking-widest mb-2 flex items-center justify-between">
                    <span>Whitelist Emails ({emails.length})</span>
                    {emails.length === 0 && <span className="text-amber-500/60 lowercase italic font-light">None set</span>}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                    {emails.map(email => (
                        <span key={email} className="text-[8px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-sm flex items-center gap-1 group/chip">
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
                    className="w-full bg-black/60 border border-white/10 rounded-sm px-3 py-1.5 text-[9px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 font-mono transition-all"
                />
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-6 pb-12">
            <HeroHeader
                colorTheme="whinehouse"
                breadcrumbs={[{ label: 'DASHBOARD', href: '/' }, { label: 'AI PROVIDERS' }]}
                title="AI"
                badge="Providers"
                description="Manage your local API core and supported upstream models. Flat developer-focused architecture."
            />

            {loading ? (
                <LoadingState colorTheme="whinehouse" message="Synchronizing Upstream Models..." />
            ) : error ? (
                <div className="py-20 text-center border border-dashed border-red-500/10 rounded text-red-500/60 text-[10px] font-mono uppercase tracking-[0.2em]">
                    API CONNECTION ERROR: {error}
                </div>
            ) : (
                <>
                    <div className="border border-white/5 bg-[#0B0F1A] rounded overflow-hidden">
                        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-white/3 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start sm:items-center gap-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-sm border border-[#D9C5C5]/30 flex items-center justify-center bg-[#111111] text-[#D9C5C5] shadow-inner shrink-0">
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-[9px] sm:text-[10px] font-black text-slate-100 uppercase tracking-[0.2em]">Core Endpoint</h3>
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                                    </div>
                                    <div className="flex items-center gap-2 mt-1.5 overflow-hidden">
                                        <code className="text-[9px] sm:text-[10px] font-mono text-slate-300 bg-white/5 border border-white/5 px-2 py-0.5 rounded-xs truncate sm:whitespace-normal break-all">{baseUrl}</code>
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
                                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-sm border text-emerald-400 border-emerald-400/20 bg-emerald-400/5">
                                    CORE ACTIVE
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="border border-[#D9C5C5]/20 bg-[#D9C5C5]/5 p-4 sm:p-5 rounded-sm flex flex-col sm:flex-row items-start gap-4">
                        <div className="p-2 rounded-xs bg-[#111111] border border-[#D9C5C5]/30 text-[#D9C5C5] shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D9C5C5]">Developer Notice</p>
                            <div className="text-[10px] text-slate-400 mt-2.5 space-y-2 font-mono">
                                <div className="flex items-center gap-2">
                                    <span className="w-1 h-1 rounded-full bg-[#D9C5C5]/40" />
                                    <span><span className="text-emerald-400 font-bold">ACTIVE</span> &mdash; Highly available system endpoints.</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-1 h-1 rounded-full bg-[#D9C5C5]/40" />
                                    <span><span className="text-amber-500 font-bold">SUSPENDED</span> &mdash; Model is temporarily offline.</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-1 h-1 rounded-full bg-[#D9C5C5]/40" />
                                    <span><span className="text-blue-400 font-bold">RESTRICTED</span> &mdash; Whitelist authorization required.</span>
                                </div>

                                <div className="mt-3 text-[#D9C5C5]/80 italic bg-[#111111]/30 p-2 border-l border-[#D9C5C5]/20">
                                    * API access requires a valid <a href="/api-key" className="text-slate-200 hover:text-white underline underline-offset-4 decoration-[#D9C5C5]/40 transition-colors font-bold">Bearer Token</a>.
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
                        <div className="flex flex-col sm:flex-row flex-1 items-stretch gap-2 max-w-2xl">
                            <div className="relative flex-1 group">
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#D9C5C5] transition-colors">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search identifiers or providers..."
                                    className="w-full bg-[#0B0F1A] border border-white/10 rounded-sm pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#D9C5C5]/50 transition-all font-mono"
                                />
                            </div>

                            <div className="flex items-center p-1 bg-[#0B0F1A] border border-white/10 rounded-sm shrink-0">
                                {[
                                    { id: 'all', label: 'ALL' },
                                    { id: 'active', label: 'ACTIVE', dot: 'bg-emerald-400' },
                                    { id: 'suspend', label: 'SUSPEND', dot: 'bg-amber-500' }
                                ].map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setStatusFilter(t.id)}
                                        className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-xs transition-all flex items-center gap-2 ${statusFilter === t.id
                                            ? 'bg-[#D9C5C5]/10 text-[#D9C5C5] shadow-inner'
                                            : 'text-slate-500 hover:text-slate-300'
                                            }`}
                                    >
                                        {t.dot && <span className={`w-1 h-1 rounded-full ${t.dot} ${statusFilter === t.id ? 'animate-pulse' : ''}`} />}
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6 text-[10px] font-black uppercase tracking-widest px-5 py-3 sm:py-2.5 border border-[#D9C5C5]/30 rounded bg-[#111111] shadow-[0_0_30px_rgba(217,197,197,0.05)] overflow-hidden">
                            <div className="flex items-center justify-between sm:justify-start gap-3 border-b sm:border-b-0 sm:border-r border-white/10 pb-2 sm:pb-0 sm:pr-5">
                                <span className="text-white brightness-125">Synchronized Models</span>
                                <span className="text-[#D9C5C5] font-mono text-xs font-bold">{models.length}</span>
                            </div>

                            <div className="flex items-center justify-around sm:justify-start gap-8 sm:gap-5 pt-1 sm:pt-0">
                                <div className="flex items-center gap-2.5 group">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#10B981]" />
                                    <span className="text-emerald-400 font-black hidden sm:inline">ACTIVE</span>
                                    <span className="text-white font-mono text-xs italic">{activeCount}</span>
                                </div>

                                <div className="flex items-center gap-2.5 group">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_#F59E0B]" />
                                    <span className="text-amber-500 font-black hidden sm:inline">SUSPENDED</span>
                                    <span className="text-white font-mono text-xs italic">{suspendCount}</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="grid gap-6 sm:gap-10">
                        {Object.entries(groupedModels).map(([owner, ownerModels]) => (
                            <div key={owner} className="space-y-4">
                                <div className="flex items-center gap-3 px-1">
                                    <span className="w-3 h-2 rounded-xs bg-[#D9C5C5]/40" />
                                    <h4 className="text-[11px] font-black text-[#D9C5C5] uppercase tracking-[0.4em]">{owner}</h4>
                                    <div className="h-px flex-1 bg-white/5 ml-4" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {ownerModels.map(model => (
                                        <div key={model.id} className={`p-4 border border-white/5 bg-[#0B0F1A] hover:bg-white/2 transition-all rounded group flex flex-col justify-between min-h-[120px] ${model.status === 'hidden' ? 'ring-1 ring-white/10 opacity-50' : ''}`}>
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex flex-col gap-1.5">
                                                    <code className="text-[11px] font-mono text-blue-400 group-hover:text-blue-300 transition-colors break-all leading-relaxed">
                                                        {model.id}
                                                    </code>
                                                    <div className="flex gap-1.5">
                                                        <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-xs border ${getStatusStyle(model.status)}`}>
                                                            {model.status}
                                                        </span>
                                                        {model.isRestricted && (
                                                            <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-xs border border-blue-500/20 text-blue-400 bg-blue-500/5">
                                                                RESTRICTED
                                                            </span>
                                                        )}
                                                        {user?.role === 'ULTRA' && (
                                                            <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-xs border border-purple-500/20 text-purple-400 bg-purple-500/5">
                                                                ADMIN_VISIBLE
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
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => copyToClipboard(model.id)}
                                                            className="text-slate-600 hover:text-[#D9C5C5] transition-colors p-1"
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

                                            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                                    SYS_MODEL
                                                </span>
                                                <span className="text-[9px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded-xs">
                                                    v{model.created ? new Date(model.created * 1000).getFullYear() : '2026'}.{model.created ? new Date(model.created * 1000).getMonth() + 1 : '1'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
