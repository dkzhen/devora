'use client';

import { useState, useEffect } from 'react';
import { HeroHeader, LoadingState } from '@/components/HeroHeader';

export default function ApiKeyPage() {
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [apiKeys, setApiKeys] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [keyToDelete, setKeyToDelete] = useState(null);
    const [usageHistory, setUsageHistory] = useState([]);
    const [copiedId, setCopiedId] = useState(null);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        const init = async () => {
            try {
                const userInfo = localStorage.getItem('user_info');
                if (!userInfo) { setLoading(false); return; }
                setIsAuthorized(true);
                await Promise.all([fetchKeys(), fetchUsageHistory()]);
            } catch { setLoading(false); }
        };
        init();
    }, []);

    const fetchKeys = async () => {
        try {
            const res = await fetch('/api/api-keys');
            if (res.ok) {
                const data = await res.json();
                setApiKeys(data.apiKeys || []);
            }
        } catch { } finally { setLoading(false); }
    };

    const fetchUsageHistory = async () => {
        try {
            const res = await fetch('/api/api-keys/usage');
            if (res.ok) {
                const data = await res.json();
                setUsageHistory(data.history || []);
            }
        } catch { }
    };

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleCopy = (id, key) => {
        navigator.clipboard.writeText(key);
        setCopiedId(id);
        showToast('API Key copied to clipboard!');
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDelete = async (id) => {
        try {
            const res = await fetch(`/api/api-keys/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setApiKeys(prev => prev.filter(k => k.id !== id));
                showToast('API Key revoked successfully.');
            } else {
                showToast('Failed to revoke key.', 'error');
            }
        } catch { showToast('Network error.', 'error'); }
        finally { setKeyToDelete(null); }
    };

    const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const maskKey = (key) => key.slice(0, 14) + '•'.repeat(20) + key.slice(-4);

    if (!loading && !isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-[#04080f]">
                <div className="max-w-md w-full bg-[#0a1208] border border-[#5cb644]/30 rounded-2xl p-8 text-center shadow-2xl">
                    <div className="w-16 h-16 mx-auto mb-4 bg-[#f36222]/10 rounded-full flex items-center justify-center border border-[#f36222]/30">
                        <svg className="w-8 h-8 text-[#f36222]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Members Only</h2>
                    <p className="text-gray-400 leading-relaxed text-sm">
                        API Key management requires an active account. Sign in to generate and manage your access tokens.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-white">
            {/* Background grid */}
            <div className="fixed inset-0 opacity-[0.025] pointer-events-none" style={{
                backgroundImage: `linear-gradient(rgba(92,182,68,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(243,98,34,0.3) 1px, transparent 1px)`,
                backgroundSize: '32px 32px'
            }} />

            <div className="flex flex-col space-y-6 relative z-10 w-full">
                {/* Hero Header */}
                <HeroHeader
                    title="API"
                    badge="Keys"
                    description="Generate and manage API keys to access Devora endpoints programmatically."
                    colorTheme="devora"
                    breadcrumbs={[
                        { label: 'Dashboard', href: '/' },
                        { label: 'API Keys' }
                    ]}
                    className="shrink-0"
                    actionContent={
                        isAuthorized && !loading && (
                            <button
                                onClick={() => setShowCreate(true)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-[#f36222]/10 hover:bg-[#f36222]/20 text-[#f36222] border border-[#f36222]/30 hover:border-[#f36222]/60 rounded-lg text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                </svg>
                                New Key
                            </button>
                        )
                    }
                />

                {/* Content */}
                {loading ? (
                    <div className="py-24 flex flex-col items-center justify-center bg-[#0a1208]/30 rounded-2xl border border-white/5">
                        <LoadingState message="Fetching API Keys..." colorTheme="devora" />
                        <p className="text-[10px] text-gray-500 mt-3 font-mono uppercase tracking-[0.3em] animate-pulse">Authenticating access...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Stats Bar */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: 'Total Keys', value: apiKeys.length, color: '#f36222' },
                                { label: 'Active', value: apiKeys.length, color: '#5cb644' },
                                { label: 'Prefix', value: 'devora_', color: '#007fc3' },
                            ].map((stat) => (
                                <div key={stat.label} className="bg-[#0a0f1a]/60 border border-white/5 rounded-xl px-4 py-3 flex flex-col gap-1">
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">{stat.label}</span>
                                    <span className="font-mono font-black text-lg" style={{ color: stat.color }}>{stat.value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Keys List */}
                        {apiKeys.length === 0 ? (
                            <div className="text-center py-16 bg-[#04080f]/60 rounded-2xl border border-[#5cb644]/10 shadow-inner">
                                {/* Icon */}
                                <div className="w-24 h-24 mx-auto mb-6 relative">
                                    <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-[#f36222]/10 via-[#5cb644]/10 to-[#007fc3]/10 border border-[#5cb644]/20" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <svg className="w-12 h-12 text-[#5cb644]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                        </svg>
                                    </div>
                                </div>
                                <h3 className="text-xl font-black text-white mb-2">No API Keys Yet</h3>
                                <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                                    Create your first API key to start using authenticated Devora endpoints.
                                </p>
                                <button
                                    onClick={() => setShowCreate(true)}
                                    className="inline-flex items-center gap-2 px-7 py-3 bg-linear-to-r from-[#f36222] via-[#5cb644] to-[#007fc3] text-white rounded-lg text-xs font-black uppercase tracking-widest transition-all hover:opacity-90 active:scale-95 shadow-[0_0_20px_rgba(92,182,68,0.3)]"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Create API Key
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {apiKeys.map((k, idx) => (
                                    <ApiKeyCard
                                        key={k.id}
                                        apiKey={k}
                                        idx={idx}
                                        copiedId={copiedId}
                                        onCopy={handleCopy}
                                        onRevoke={() => setKeyToDelete(k.id)}
                                        maskKey={maskKey}
                                        formatDate={formatDate}
                                    />
                                ))}

                                <button
                                    onClick={() => setShowCreate(true)}
                                    className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-[#5cb644]/20 hover:border-[#5cb644]/50 rounded-xl text-xs font-black text-[#5cb644]/50 hover:text-[#5cb644] uppercase tracking-widest transition-all"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add Another Key
                                </button>
                            </div>
                        )}

                        {/* Usage info banner */}
                        <div className="bg-[#007fc3]/5 border border-[#007fc3]/15 rounded-xl px-5 py-4 flex gap-4 items-start">
                            <svg className="w-5 h-5 text-[#007fc3] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="text-[11px] font-bold text-[#007fc3] mb-0.5">How to use API Keys</p>
                                <p className="text-[10px] text-gray-500 leading-relaxed">
                                    Include your key in API requests via the <span className="font-mono text-gray-400">Authorization: Bearer devora_...</span> header. API keys are tied to your account and inherit your permissions.
                                </p>
                            </div>
                        </div>

                        {/* Usage History Section */}
                        <div className="pt-6">
                            <div className="flex items-center justify-between mb-4 px-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-4 bg-[#f36222] rounded-full" />
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#f36222]">Usage History</h3>
                                </div>
                                <button onClick={fetchUsageHistory} className="p-1.5 text-gray-500 hover:text-white transition-colors">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                </button>
                            </div>
                            
                            {usageHistory.length === 0 ? (
                                <div className="bg-[#0a0f1a]/40 border border-white/5 rounded-xl py-12 text-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">No API activity recorded yet</p>
                                </div>
                            ) : (
                                <div className="bg-[#0a0f1a]/40 border border-white/5 rounded-xl overflow-hidden shadow-2xl">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-white/5 border-b border-white/5">
                                                    <th className="px-5 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-[#5cb644]">Time</th>
                                                    <th className="px-5 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-[#5cb644]">Key</th>
                                                    <th className="px-5 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-[#5cb644]">Method</th>
                                                    <th className="px-5 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-[#5cb644]">Endpoint</th>
                                                    <th className="px-5 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-[#5cb644] text-right">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {usageHistory.map((hit) => (
                                                    <tr key={hit.id} className="hover:bg-white/2 transition-colors group">
                                                        <td className="px-5 py-3 font-mono text-[10px] text-gray-400">
                                                            {new Date(hit.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                            <span className="block text-[8px] text-gray-600 mt-0.5">{new Date(hit.createdAt).toLocaleDateString()}</span>
                                                        </td>
                                                        <td className="px-5 py-3 font-bold text-[10px] text-white">
                                                            {hit.apiKey?.name || 'Deleted Key'}
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            <span className={`px-1.5 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-wider ${
                                                                hit.method === 'POST' ? 'bg-amber-500/10 text-amber-500' : 
                                                                hit.method === 'GET' ? 'bg-emerald-500/10 text-emerald-500' : 
                                                                'bg-blue-500/10 text-blue-500'
                                                            }`}>
                                                                {hit.method}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3 font-mono text-[10px] text-gray-500 group-hover:text-gray-300">
                                                            {hit.endpoint}
                                                        </td>
                                                        <td className="px-5 py-3 text-right">
                                                            <span className={`font-mono text-[10px] font-bold ${
                                                                hit.status >= 200 && hit.status < 300 ? 'text-[#5cb644]' : 
                                                                hit.status >= 400 ? 'text-red-500' : 'text-gray-400'
                                                            }`}>
                                                                {hit.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreate && (
                <CreateKeyModal
                    onClose={() => setShowCreate(false)}
                    onCreate={(newKey) => {
                        setApiKeys(prev => [newKey, ...prev]);
                        showToast('API Key created successfully!');
                    }}
                />
            )}

            {/* Revoke Confirm Modal */}
            {keyToDelete && (
                <RevokeModal
                    onClose={() => setKeyToDelete(null)}
                    onConfirm={() => handleDelete(keyToDelete)}
                />
            )}

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 right-6 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 z-50 border text-sm font-bold transition-all ${toast.type === 'error' ? 'bg-red-900/80 border-red-500/30 text-red-200' : 'bg-[#0a1208]/90 border-[#5cb644]/30 text-[#5cb644]'}`}>
                    {toast.type === 'error' ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    )}
                    {toast.msg}
                </div>
            )}
        </div>
    );
}

/* ── API Key Card ── */
function ApiKeyCard({ apiKey, idx, copiedId, onCopy, onRevoke, maskKey, formatDate }) {
    const [revealed, setRevealed] = useState(false);
    const gradients = [
        'from-[#f36222]/10 to-[#5cb644]/5',
        'from-[#5cb644]/10 to-[#007fc3]/5',
        'from-[#007fc3]/10 to-[#f36222]/5',
    ];
    const borderColors = ['border-[#f36222]/20', 'border-[#5cb644]/20', 'border-[#007fc3]/20'];
    const dotColors = ['bg-[#f36222]', 'bg-[#5cb644]', 'bg-[#007fc3]'];
    const g = idx % 3;

    return (
        <div className={`relative overflow-hidden rounded-xl border ${borderColors[g]} bg-linear-to-r ${gradients[g]} p-4 group transition-all hover:shadow-[0_0_20px_rgba(92,182,68,0.1)]`}>
            {/* Scan line effect */}
            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.015) 3px, rgba(255,255,255,0.015) 4px)' }} />

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                        <span className={`w-2 h-2 rounded-full ${dotColors[g]} shadow-[0_0_6px_currentColor] animate-pulse`} />
                        <div>
                            <p className="text-sm font-black text-white tracking-wide">{apiKey.name}</p>
                            <p className="text-[9px] text-gray-500 font-mono uppercase tracking-[0.15em]">Created {formatDate(apiKey.createdAt)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-[#5cb644]/10 border border-[#5cb644]/20 rounded text-[8px] font-black text-[#5cb644] uppercase tracking-wider">Active</span>
                        <button
                            onClick={onRevoke}
                            className="p-1.5 rounded text-gray-600 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all opacity-0 group-hover:opacity-100"
                            title="Revoke key"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                </div>

                {/* Key Display */}
                <div className="flex items-center gap-2 bg-black/30 border border-white/5 rounded-lg px-3 py-2.5 font-mono text-xs">
                    <svg className="w-3.5 h-3.5 text-[#f36222]/60 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    <span className="flex-1 text-gray-300 text-[11px] truncate">{revealed ? apiKey.key : maskKey(apiKey.key)}</span>
                    <button onClick={() => setRevealed(r => !r)} className="text-gray-600 hover:text-gray-300 transition-colors shrink-0 ml-1" title={revealed ? 'Hide' : 'Reveal'}>
                        {revealed ? (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                        ) : (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        )}
                    </button>
                    <button
                        onClick={() => onCopy(apiKey.id, apiKey.key)}
                        className="text-gray-600 hover:text-[#5cb644] transition-colors shrink-0"
                        title="Copy key"
                    >
                        {copiedId === apiKey.id ? (
                            <svg className="w-3.5 h-3.5 text-[#5cb644]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        ) : (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Create Modal ── */
function CreateKeyModal({ onClose, onCreate }) {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [created, setCreated] = useState(null);
    const [copied, setCopied] = useState(false);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!name.trim()) { setError('Key name is required.'); return; }
        setLoading(true); setError('');
        try {
            const res = await fetch('/api/api-keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
            const data = await res.json();
            if (res.ok) {
                setCreated(data.apiKey);
                onCreate(data.apiKey);
            } else {
                setError(data.error || 'Failed to create key.');
            }
        } catch { setError('Network error.'); }
        finally { setLoading(false); }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(created.key);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#04080f] border border-[#5cb644]/20 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="relative px-6 py-5 border-b border-white/5" style={{ background: 'linear-gradient(135deg,#1a0d05 0%,#071408 50%,#020810 100%)' }}>
                    {/* Corner decorations */}
                    <span className="absolute top-2 right-2 w-4 h-4 border-t border-r border-[#f36222]/40" />
                    <span className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-[#5cb644]/40" />
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#f36222,#5cb644,#007fc3)' }}>
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-base font-black text-white tracking-wide">Create API Key</h3>
                            <p className="text-[10px] text-gray-500 font-mono">Prefix: <span className="text-[#f36222]">devora_</span></p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6">
                    {created ? (
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 bg-[#5cb644]/5 border border-[#5cb644]/20 rounded-xl p-4">
                                <svg className="w-5 h-5 text-[#5cb644] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <div>
                                    <p className="text-sm font-bold text-[#5cb644]">API Key Created!</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">Copy it now — you won&apos;t be able to see it in full again.</p>
                                </div>
                            </div>
                            <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex items-center gap-2 font-mono text-xs">
                                <span className="flex-1 text-gray-200 break-all text-[10px]">{created.key}</span>
                                <button onClick={handleCopy} className="shrink-0 p-1.5 rounded hover:bg-[#5cb644]/10 text-gray-400 hover:text-[#5cb644] transition-colors">
                                    {copied ? (
                                        <svg className="w-4 h-4 text-[#5cb644]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                    )}
                                </button>
                            </div>
                            <button onClick={onClose} className="w-full py-2.5 text-xs font-black text-white bg-linear-to-r from-[#f36222] via-[#5cb644] to-[#007fc3] rounded-lg hover:opacity-90 active:scale-95 transition-all uppercase tracking-widest">
                                Done
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleCreate} className="space-y-4">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-4 py-2.5 text-xs font-bold flex items-center gap-2">
                                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    {error}
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-black text-[#5cb644] uppercase tracking-widest mb-2">Key Name</label>
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="e.g., My Temp Mail Key"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full bg-black/30 border border-white/10 focus:border-[#5cb644]/40 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none transition-all font-mono focus:shadow-[0_0_10px_rgba(92,182,68,0.1)]"
                                />
                                <p className="text-[10px] text-gray-600 mt-1.5">The generated key will have the prefix <span className="text-[#f36222] font-mono">devora_</span></p>
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button type="button" onClick={onClose} disabled={loading} className="flex-1 py-2.5 text-xs font-bold text-gray-500 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-all">
                                    Cancel
                                </button>
                                <button type="submit" disabled={loading} className="flex-1 py-2.5 text-xs font-black text-white bg-linear-to-r from-[#f36222] via-[#5cb644] to-[#007fc3] rounded-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest">
                                    {loading ? 'Generating...' : 'Generate Key'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ── Revoke Modal ── */
function RevokeModal({ onClose, onConfirm }) {
    const [loading, setLoading] = useState(false);
    const handleConfirm = async () => { setLoading(true); await onConfirm(); setLoading(false); };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#04080f] border border-red-500/20 rounded-2xl max-w-sm w-full p-6 text-center">
                <div className="w-14 h-14 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
                    <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h3 className="text-lg font-black text-white mb-2">Revoke API Key?</h3>
                <p className="text-gray-500 text-xs mb-6">This key will be permanently deleted. Any services using it will lose access immediately.</p>
                <div className="flex gap-3">
                    <button onClick={onClose} disabled={loading} className="flex-1 py-2.5 text-xs font-bold text-gray-500 border border-white/10 hover:border-white/20 rounded-lg transition-all">Cancel</button>
                    <button onClick={handleConfirm} disabled={loading} className="flex-1 py-2.5 text-xs font-black text-white bg-red-600 hover:bg-red-500 rounded-lg transition-all disabled:opacity-50">
                        {loading ? 'Revoking...' : 'Yes, Revoke'}
                    </button>
                </div>
            </div>
        </div>
    );
}
