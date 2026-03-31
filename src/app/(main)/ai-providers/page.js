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
                background: '#111111',
                color: '#b9a0a0',
                border: '1px solid #b9a0a033',
                fontSize: '10px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
            },
            iconTheme: {
                primary: '#b9a0a0',
                secondary: '#111111',
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
                style: { background: '#0B0F1A', color: '#b9a0a0', border: '1px solid #b9a0a011', fontSize: '9px', fontWeight: 'black' }
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
                style: { background: '#0B0F1A', color: '#b9a0a0', border: '1px solid #b9a0a011', fontSize: '9px', fontWeight: 'black' }
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
                    color: '#b9a0a0',
                    border: '1px solid #b9a0a011',
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
        if (user?.role === 'ULTRA') return true; // Ultra see everything
        return m.status !== 'hidden'; // Public doesn't see hidden
    }).sort((a, b) => {
        const statusOrder = { 'active': 0, 'suspend': 1, 'hidden': 2 };
        const aOrder = statusOrder[a.status] ?? 0;
        const bOrder = statusOrder[b.status] ?? 0;

        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.id.localeCompare(b.id); // Alpha sort for same status
    });

    // Group models by owned_by
    const groupedModels = filteredModels.reduce((acc, model) => {
        const owner = model.owned_by || 'Other';
        if (!acc[owner]) acc[owner] = [];
        acc[owner].push(model);
        return acc;
    }, {});

    const getStatusStyle = (status) => {
        switch (status) {
            case 'suspend': return 'text-amber-500 border-amber-500/20 bg-amber-500/5';
            case 'hidden': return 'text-gray-500 border-white/5 bg-white/2 opacity-60';
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
                    className="w-full bg-black/40 border border-white/5 rounded px-2 py-1 text-[9px] text-[#b9a0a0] focus:outline-none focus:border-blue-500/30 font-mono"
                />
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-6 pb-12">
            {/* Header section with Whinehouse theme */}
            <HeroHeader
                colorTheme="whinehouse"
                breadcrumbs={[{ label: 'DASHBOARD', href: '/' }, { label: 'AI PROVIDERS' }]}
                title="AI"
                badge="Providers"
                description="Manage your local API core and supported upstream models. Flat developer-focused architecture."
            />

            {/* Core API Section - Flat Design */}
            <div className="border border-white/5 bg-[#0B0F1A] rounded overflow-hidden">
                <div className="px-6 py-5 border-b border-white/3 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded border border-[#b9a0a0]/20 flex items-center justify-center bg-[#111111] text-[#b9a0a0]">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xs font-black text-white uppercase tracking-widest">Core Endpoint</h3>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                                <code className="text-[10px] font-mono text-[#b9a0a0] bg-white/2 px-2 py-0.5 rounded-sm">{baseUrl}</code>
                                <button
                                    onClick={() => copyToClipboard(baseUrl)}
                                    className="text-gray-700 hover:text-[#b9a0a0] transition-colors"
                                    title="Copy Base URL"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-sm border text-emerald-400 border-emerald-400/20 bg-emerald-400/5">
                            CORE ACTIVE
                        </span>
                    </div>
                </div>
            </div>

            {/* Note Card - Flat & Premium */}
            <div className="border border-[#b9a0a0]/10 bg-[#b9a0a0]/3 p-4 rounded flex items-start gap-3">
                <div className="p-1.5 rounded-sm bg-[#111111] border border-[#b9a0a0]/20 text-[#b9a0a0] shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div className="flex-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#b9a0a0]">Developer Notice</p>
                    <div className="text-[10px] text-gray-500 mt-2.5 space-y-1 font-mono">
                        <div className="flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-[#b9a0a0]/30" />
                            <span><span className="text-emerald-400/80 font-bold">ACTIVE</span> &mdash; Publicly available for all users.</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-[#b9a0a0]/30" />
                            <span><span className="text-amber-500/80 font-bold">SUSPENDED</span> &mdash; Service temporarily paused for maintenance.</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-[#b9a0a0]/30" />
                            <span><span className="text-blue-400/80 font-bold">RESTRICTED</span> &mdash; Exclusive access via email whitelist.</span>
                        </div>

                        <div className="mt-2 text-[#b9a0a0]/60 italic">
                            * Authorization via <a href="/api-key" className="text-[#b9a0a0] hover:text-[#f7f7f7] underline underline-offset-4 decoration-[#b9a0a0]/30 transition-colors font-bold">API Key</a> is required.
                        </div>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
                <div className="relative flex-1 max-w-sm group">
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search identifiers or providers..."
                        className="w-full bg-[#0B0F1A] border border-white/5 rounded px-4 py-2.5 text-xs text-white placeholder-gray-800 focus:outline-none focus:border-[#b9a0a0]/40 transition-all font-mono"
                    />
                </div>
                <div className="text-[10px] font-black text-gray-700 uppercase tracking-widest px-3 py-2 border border-white/3 rounded bg-white/1">
                    Synchronized Models: {models.length}
                </div>
            </div>

            {loading ? (
                <LoadingState colorTheme="whinehouse" message="Synchronizing Upstream Models..." />
            ) : error ? (
                <div className="py-20 text-center border border-dashed border-red-500/10 rounded text-red-500/60 text-[10px] font-mono uppercase tracking-[0.2em]">
                    API CONNECTION ERROR: {error}
                </div>
            ) : (
                <div className="grid gap-10">
                    {Object.entries(groupedModels).map(([owner, ownerModels]) => (
                        <div key={owner} className="space-y-4">
                            {/* Group Label */}
                            <div className="flex items-center gap-3 px-1">
                                <span className="w-2.5 h-1.5 rounded-xs bg-[#b9a0a0]/30" />
                                <h4 className="text-[11px] font-black text-[#b9a0a0] uppercase tracking-[0.3em]">{owner}</h4>
                                <div className="h-px flex-1 bg-white/2 ml-4" />
                            </div>

                            {/* Model Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {ownerModels.map(model => (
                                    <div key={model.id} className={`p-4 border border-white/5 bg-[#0B0F1A] hover:bg-white/2 transition-all rounded group flex flex-col justify-between min-h-[120px] ${model.status === 'hidden' ? 'ring-1 ring-white/10 opacity-50' : ''}`}>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex flex-col gap-1.5">
                                                <code className="text-[11px] font-mono text-blue-400 group-hover:text-blue-300 transition-colors break-all leading-relaxed">
                                                    {model.id}
                                                </code>                                                <div className="flex gap-1.5">
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
                                                            className={`p-1 rounded bg-emerald-500/10 border ${model.status === 'active' ? 'border-emerald-500/50 text-emerald-400' : 'border-white/5 text-gray-600 hover:text-emerald-400'}`}
                                                            title="Set Active"
                                                        >
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleRestrictionToggle(model.id, model.isRestricted)}
                                                            className={`p-1 rounded bg-blue-500/10 border ${model.isRestricted ? 'border-blue-500/50 text-blue-400' : 'border-white/5 text-gray-600 hover:text-blue-400'}`}
                                                            title="Toggle Access Restriction"
                                                        >
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusChange(model.id, 'suspend')}
                                                            className={`p-1 rounded bg-amber-500/10 border ${model.status === 'suspend' ? 'border-amber-500/50 text-amber-400' : 'border-white/5 text-gray-600 hover:text-amber-400'}`}
                                                            title="Set Suspended"
                                                        >
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusChange(model.id, 'hidden')}
                                                            className={`p-1 rounded bg-red-500/10 border ${model.status === 'hidden' ? 'border-red-500/50 text-red-400' : 'border-white/5 text-gray-600 hover:text-red-400'}`}
                                                            title="Hide Model"
                                                        >
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => copyToClipboard(model.id)}
                                                        className="text-gray-800 hover:text-[#b9a0a0] transition-colors p-1"
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

                                        <div className="mt-4 pt-3 border-t border-white/2 flex items-center justify-between">

                                            <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest">
                                                SYS_MODEL
                                            </span>
                                            <span className="text-[9px] font-mono text-[#b9a0a0]/60">
                                                v{new Date(model.created * 1000).getFullYear()}.{new Date(model.created * 1000).getMonth() + 1}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
