'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { HeroHeader, LoadingState } from '@/components/HeroHeader';

// ── Local-storage helpers ──────────────────────────────────────────────────────
const LS_KEY = 'llm_console_config';
const LS_SALT = 'devora_llm_v1';

function lsEncrypt(str) {
    if (!str) return str;
    try {
        const xor = (s) => s.split('').map((char, i) =>
            String.fromCharCode(char.charCodeAt(0) ^ LS_SALT.charCodeAt(i % LS_SALT.length))
        ).join('');
        return btoa(encodeURIComponent(xor(str)));
    } catch { return str; }
}

function lsDecrypt(str) {
    if (!str) return str;
    try {
        const decoded = decodeURIComponent(atob(str));
        const dexor = (s) => s.split('').map((char, i) =>
            String.fromCharCode(char.charCodeAt(0) ^ LS_SALT.charCodeAt(i % LS_SALT.length))
        ).join('');
        return dexor(decoded);
    } catch { return str; }
}

function lsLoad() {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        // Decrypt key if present
        if (data && data.apiKey) {
            data.apiKey = lsDecrypt(data.apiKey);
        }
        return data;
    } catch { return null; }
}

function lsSave(data) {
    try {
        const toSave = { ...data };
        if (toSave.apiKey) {
            toSave.apiKey = lsEncrypt(toSave.apiKey);
        }
        localStorage.setItem(LS_KEY, JSON.stringify(toSave));
    } catch { }
}

function lsClear() {
    try { localStorage.removeItem(LS_KEY); } catch { }
}

// ── Small UI helpers ───────────────────────────────────────────────────────────
function StatusPill({ code }) {
    const ok = code >= 200 && code < 300;
    const warn = code >= 400 && code < 500;
    const cls = ok
        ? 'bg-[#76D2DB]/15 text-[#76D2DB] border-[#76D2DB]/40'
        : warn
            ? 'bg-[#DA4848]/15 text-[#DA4848] border-[#DA4848]/40'
            : 'bg-gray-500/15 text-slate-400 border-gray-500/30';
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest border font-mono ${cls}`}>
            {ok ? (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            )}
            {code}
        </span>
    );
}

function CopyBtn({ value, label = 'Copy' }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button
            onClick={copy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest border border-[#76D2DB]/30 text-[#76D2DB]/70 hover:text-[#76D2DB] hover:border-[#76D2DB]/60 hover:bg-[#76D2DB]/5 transition-all"
        >
            {copied ? (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
            )}
            {copied ? 'Copied!' : label}
        </button>
    );
}

// Logged-in only: fetches full decrypted key from server before copying
function ApiKeyCopyBtn() {
    const [state, setState] = useState('idle'); // idle | loading | done | error
    const copy = async () => {
        setState('loading');
        try {
            const res = await fetch('/api/llm-console/config?raw=true', { cache: 'no-store' });
            const data = await res.json();
            if (data.apiKey) {
                await navigator.clipboard.writeText(data.apiKey);
                setState('done');
                setTimeout(() => setState('idle'), 2000);
            } else {
                setState('error');
                setTimeout(() => setState('idle'), 2000);
            }
        } catch {
            setState('error');
            setTimeout(() => setState('idle'), 2000);
        }
    };
    const icons = {
        idle: <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>,
        loading: <span className="w-3 h-3 rounded-full border border-[#76D2DB]/40 border-t-[#76D2DB] animate-spin inline-block" />,
        done: <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>,
        error: <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>,
    };
    const labels = { idle: 'Copy', loading: '...', done: 'Copied!', error: 'Failed' };
    const colorCls = state === 'error'
        ? 'border-[#DA4848]/40 text-[#DA4848]/70 hover:text-[#DA4848]'
        : 'border-[#76D2DB]/30 text-[#76D2DB]/70 hover:text-[#76D2DB] hover:border-[#76D2DB]/60 hover:bg-[#76D2DB]/5';
    return (
        <button
            onClick={copy}
            disabled={state === 'loading'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest border transition-all disabled:opacity-60 ${colorCls}`}
        >
            {icons[state]}
            {labels[state]}
        </button>
    );
}

// ── Provider Shortcuts ───────────────────────────────────────────────────────
const PROVIDERS = [
    {
        id: 'openai',
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4o',
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.28 7.507c-.093-2.114-1.611-3.877-3.665-4.282A8.192 8.192 0 0012 2a8.192 8.192 0 00-6.615 1.225C3.33 3.63 1.812 5.393 1.72 7.507A8.192 8.192 0 002.944 14.12c.322 2.046 1.83 3.692 3.82 4.103a8.192 8.192 0 005.236 1.777 8.192 8.192 0 005.236-1.777c1.99-.411 3.498-2.057 3.82-4.103a8.192 8.192 0 001.224-6.613zm-10.28 11.5c-1.396 0-2.733-.352-3.903-.974l1.458-2.527a4.915 4.915 0 011.695.663c.243-.11.464-.249.663-.414l2.527 1.458a6.946 6.946 0 01-2.44 1.794zm-5.613-3.045a6.943 6.943 0 01-1.794-2.44L7.13 12.064c.11.243.249.464.414.663l-1.458 2.527zm-1.847-5.962a6.953 6.953 0 01.974-3.903l2.527 1.458a4.915 4.915 0 01-.663 1.695c.11.243.249.464.414.663L5.514 11.5a6.946 6.946 0 01-.974-1.5zm6.613-5.613c1.396 0 2.733.352 3.903.974l-1.458 2.527a4.915 4.915 0 01-1.695-.663c-.243.11-.464.249-.663.414L10.743 4.18a6.946 6.946 0 012.44-1.794zm5.613 3.045a6.943 6.943 0 011.794 2.44L16.87 11.936c-.11-.243-.249-.464-.414-.663l1.458-2.527zm1.847 5.962a6.953 6.953 0 01-.974 3.903l-2.527-1.458a4.915 4.915 0 01.663-1.695c-.11-.243-.249-.464-.414-.663L18.486 12.5a6.946 6.946 0 01.974 1.5z" />
            </svg>
        )
    },
    {
        id: 'blink',
        name: 'Blink',
        baseUrl: 'https://core.blink.new/api/v1/ai',
        model: 'anthropic/claude-sonnet-4.6',
        icon: (
            <img src="https://blink.new/blink/blink-logo-icon--dark.svg" className="w-4 h-4" alt="Blink" />
        )
    },
    {
        id: 'openrouter',
        name: 'OpenRouter',
        baseUrl: 'https://openrouter.ai/api/v1',
        model: 'google/gemini-2.0-flash-001',
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
            </svg>
        )
    },
];

export default function LlmConsolePage() {
    // Auth state
    const [user, setUser] = useState(null);
    const [authLoaded, setAuthLoaded] = useState(false);

    // Config state
    const [configLoaded, setConfigLoaded] = useState(false);
    const [isConfigured, setIsConfigured] = useState(false);
    const [editing, setEditing] = useState(false);

    const [baseUrl, setBaseUrl] = useState('');
    const [model, setModel] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [apiKeyMasked, setApiKeyMasked] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved

    // Test state
    const [testing, setTesting] = useState(false);
    const [result, setResult] = useState(null);

    // ── Load auth ──────────────────────────────────────────────────────────────
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch('/api/auth/me', { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user);
                }
            } catch { }
            setAuthLoaded(true);
        };
        fetchUser();
    }, []);

    // ── Load config ────────────────────────────────────────────────────────────
    const loadConfig = useCallback(async (loggedIn) => {
        if (loggedIn) {
            try {
                const res = await fetch('/api/llm-console/config', { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    if (data.isConfigured) {
                        setIsConfigured(true);
                        setBaseUrl(data.baseUrl);
                        setModel(data.model);
                        setApiKeyMasked(data.apiKey);
                    }
                }
            } catch { }
        } else {
            const saved = lsLoad();
            if (saved) {
                setIsConfigured(true);
                setBaseUrl(saved.baseUrl || '');
                setModel(saved.model || '');
                setApiKey(saved.apiKey || '');
                setApiKeyMasked(saved.apiKey
                    ? `${saved.apiKey.substring(0, 4)}••••••••${saved.apiKey.slice(-4)}`
                    : '');
            }
        }
        setConfigLoaded(true);
    }, []);

    useEffect(() => {
        if (authLoaded) loadConfig(!!user);
    }, [authLoaded, user, loadConfig]);

    // ── Save config ────────────────────────────────────────────────────────────
    const handleSave = async () => {
        // Basic validation
        if (!baseUrl.trim() || !model.trim()) {
            toast.error('Base URL and Model are required');
            return;
        }
        if (!isConfigured && !apiKey.trim()) {
            toast.error('API Key is required for first-time setup');
            return;
        }

        setSaving(true);
        setSaveStatus('saving');
        
        try {
            if (user) {
                const payload = {
                    baseUrl: baseUrl.trim(),
                    model: model.trim()
                };
                if (apiKey.trim()) payload.apiKey = apiKey.trim();

                const res = await fetch('/api/llm-console/config', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.error || 'Failed to save');
            } else {
                const current = lsLoad() || {};
                lsSave({ 
                    baseUrl: baseUrl.trim(), 
                    model: model.trim(), 
                    apiKey: apiKey.trim() || current.apiKey 
                });
            }

            // Sync back the global state
            await loadConfig(!!user);
            
            // Show success state
            setSaveStatus('saved');
            toast.success('Configuration synchronized');

            // Close after delay
            setTimeout(() => {
                setEditing(false);
                setSaveStatus('idle');
                setSaving(false);
                if (user) {
                    setApiKey('');
                    setShowKey(false);
                }
            }, 800);

        } catch (err) {
            toast.error(err.message || 'Save failed');
            setSaving(false);
            setSaveStatus('idle');
        }
    };

    const handleStartEdit = () => {
        // Sync state from current saved config before opening form
        if (isConfigured) {
            // Data should already be in state from loadConfig, 
            // but we ensure apiKey is cleared for the placeholder logic
            setApiKey('');
            setShowKey(false);
        }
        setEditing(true);
    };

    // ── Delete / reset config ──────────────────────────────────────────────────
    const handleReset = async () => {
        if (!confirm('Remove your saved LLM configuration?')) return;
        if (user) {
            try {
                await fetch('/api/llm-console/config', { method: 'DELETE' });
            } catch { }
        } else {
            lsClear();
        }
        setIsConfigured(false);
        setBaseUrl('');
        setModel('');
        setApiKey('');
        setApiKeyMasked('');
        setResult(null);
        setEditing(false);
        toast.success('Configuration removed');
    };

    const selectProvider = (p) => {
        setBaseUrl(p.baseUrl);
        setModel(p.model);
        toast.success(`Loaded ${p.name} defaults`);
    };

    // ── Test endpoint ──────────────────────────────────────────────────────────
    const handleTest = async () => {
        setTesting(true);
        setResult(null);
        try {
            const body = user ? {} : {
                baseUrl,
                model,
                apiKey,
            };

            const res = await fetch('/api/llm-console/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            setResult(data);
            if (data.success) {
                toast.success('Endpoint is working!');
            } else {
                toast.error(`Error ${data.statusCode}: ${data.error}`);
            }
        } catch (err) {
            setResult({ success: false, statusCode: 0, error: err.message });
            toast.error('Network error');
        } finally {
            setTesting(false);
        }
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    if (!authLoaded || !configLoaded) {
        return (
            <div className="flex flex-col gap-6">
                <HeroHeader
                    
                    breadcrumbs={[{ label: 'DASHBOARD', href: '/' }, { label: 'LLM CONSOLE' }]}
                    title="LLM"
                    badge="Console"
                    description="Test any OpenAI-compatible API endpoint in seconds."
                />
                <LoadingState message="Initializing console..."  />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 pb-12">
            <HeroHeader
                
                breadcrumbs={[{ label: 'DASHBOARD', href: '/' }, { label: 'LLM CONSOLE' }]}
                title="LLM"
                badge="Console"
                description="Test any OpenAI-compatible API endpoint. Supports custom base URL, model selection, and optional API key storage."
            />

            {/* Gradient Banner */}
            <div className="relative overflow-hidden rounded-xl border border-white/5 h-20 md:h-24">
                <div className="absolute inset-0" style={{
                    background: 'linear-gradient(135deg, #36064D 0%, #76D2DB33 30%, #DA484833 70%, #36064D 100%)',
                }} />
                <div className="absolute inset-0 pointer-events-none opacity-30" style={{
                    backgroundImage: 'linear-gradient(rgba(118,210,219,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(118,210,219,0.08) 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                }} />
                <div className="absolute -top-8 -left-8 w-40 h-40 rounded-full blur-[60px]" style={{ background: '#76D2DB22' }} />
                <div className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full blur-[60px]" style={{ background: '#DA484822' }} />
                <div className="relative z-10 h-full flex items-center px-6 md:px-8 gap-4">
                    <div className="w-10 h-10 rounded-lg border border-[#76D2DB]/40 flex items-center justify-center bg-[#76D2DB]/10 shrink-0">
                        <svg className="w-5 h-5 text-[#76D2DB]" viewBox="0 0 48 48" fill="currentColor">
                            <path d="M45.6,18.7,41,14.9V7.5a1,1,0,0,0-.6-.9L30.5,2.1h-.4l-.6.2L24,5.9,18.5,2.2,17.9,2h-.4L7.6,6.6a1,1,0,0,0-.6.9v7.4L2.4,18.7a.8.8,0,0,0-.4.8v9H2a.8.8,0,0,0,.4.8L7,33.1v7.4a1,1,0,0,0,.6.9l9.9,4.5h.4l.6-.2L24,42.1l5.5,3.7.6.2h.4l9.9-4.5a1,1,0,0,0,.6-.9V33.1l4.6-3.8a.8.8,0,0,0,.4-.7V19.4h0A.8.8,0,0,0,45.6,18.7Zm-5.1,6.8H42v1.6l-3.5,2.8-.4.3-.4-.2a1.4,1.4,0,0,0-2,.7,1.5,1.5,0,0,0,.6,2l.7.3h0v5.4l-6.6,3.1-4.2-2.8-.7-.5V25.5H27a1.5,1.5,0,0,0,0-3H25.5V9.7l.7-.5,4.2-2.8L37,9.5v5.4h0l-.7.3a1.5,1.5,0,0,0-.6,2,1.4,1.4,0,0,0,1.3.9l.7-.2.4-.2.4.3L42,20.9v1.6H40.5a1.5,1.5,0,0,0,0,3Z" />
                            <path d="M13.9,9.9a1.8,1.8,0,0,0,0,2.2l2.6,2.5v2.8l-4,4v5.2l4,4v2.8l-2.6,2.5a1.8,1.8,0,0,0,0,2.2,1.5,1.5,0,0,0,1.1.4,1.5,1.5,0,0,0,1.1-.4l3.4-3.5V29.4l-4-4V22.6l4-4V13.4L16.1,9.9A1.8,1.8,0,0,0,13.9,9.9Z" />
                            <path d="M31.5,14.6l2.6-2.5a1.8,1.8,0,0,0,0-2.2,1.8,1.8,0,0,0-2.2,0l-3.4,3.5v5.2l4,4v2.8l-4,4v5.2l3.4,3.5a1.7,1.7,0,0,0,2.2,0,1.8,1.8,0,0,0,0-2.2l-2.6-2.5V30.6l4-4V21.4l-4-4Z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-white font-black text-sm tracking-wide">OpenAI-Compatible Endpoint Tester</p>
                        <p className="text-[#76D2DB]/60 text-[10px] font-mono mt-0.5">Sends a minimal 5-token probe · Low cost · Fast feedback</p>
                    </div>
                    <div className="ml-auto flex gap-1.5 items-center opacity-70">
                        {['#76D2DB', '#F7F6E5', '#DA4848'].map(c => (
                            <span key={c} className="w-2 h-2 rounded-full" style={{ background: c }} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid lg:grid-cols-[400px_1fr] gap-6">

                {/* Left Column: Configuration */}
                <div className="space-y-4">
                    <div className="relative rounded-xl border border-[#76D2DB]/20 bg-[#0B0F1A] overflow-hidden shadow-lg">
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#76D2DB]/80 via-[#DA4848]/40 to-transparent" />

                        <div className="px-5 py-4 border-b border-[#76D2DB]/10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-sm bg-[#76D2DB] shadow-[0_0_8px_#76D2DB]" />
                                <span className="text-[10px] font-black text-[#76D2DB] uppercase tracking-[0.2em]">
                                    {isConfigured ? 'Configuration' : 'Setup Required'}
                                </span>
                            </div>
                            {isConfigured && !editing && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleStartEdit}
                                        className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border border-[#76D2DB]/30 text-[#76D2DB]/70 hover:text-[#76D2DB] hover:border-[#76D2DB]/60 rounded transition-all"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        Edit
                                    </button>
                                    <button
                                        onClick={handleReset}
                                        className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border border-[#DA4848]/30 text-[#DA4848]/60 hover:text-[#DA4848] hover:border-[#DA4848]/60 rounded transition-all"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        Reset
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="px-5 py-4 space-y-6">
                            {isConfigured && !editing ? (
                                <div className="space-y-6">
                                    <div className="p-4 rounded-lg border border-[#76D2DB]/10 bg-black/20">
                                        <h4 className="text-[9px] font-black text-[#76D2DB] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                            Endpoint Settings
                                        </h4>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-1">Base URL</label>
                                                <div className="flex items-center gap-2">
                                                    <code className="flex-1 text-[10px] font-mono text-[#76D2DB] bg-[#76D2DB]/5 border border-[#76D2DB]/10 rounded px-2.5 py-1.5 truncate">{baseUrl}</code>
                                                    <CopyBtn value={baseUrl} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-1">Model</label>
                                                <div className="flex items-center gap-2">
                                                    <code className="flex-1 text-[10px] font-mono text-[#76D2DB] bg-[#76D2DB]/5 border border-[#76D2DB]/10 rounded px-2.5 py-1.5">{model}</code>
                                                    <CopyBtn value={model} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-lg border border-[#DA4848]/10 bg-black/20">
                                        <h4 className="text-[9px] font-black text-[#DA4848] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                            API Credentials
                                        </h4>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <code className="flex-1 text-[10px] font-mono text-[#DA4848]/80 bg-[#DA4848]/5 border border-[#DA4848]/10 rounded px-2.5 py-1.5">
                                                    {user ? apiKeyMasked : (showKey ? apiKey : apiKeyMasked)}
                                                </code>
                                                <div className="flex gap-1">
                                                    {!user && (
                                                        <button onClick={() => setShowKey(v => !v)} className="p-1.5 text-slate-600 hover:text-[#76D2DB]">
                                                            {showKey ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242" /></svg> : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                                                        </button>
                                                    )}
                                                    {user ? <ApiKeyCopyBtn /> : <CopyBtn value={apiKey} />}
                                                </div>
                                            </div>
                                            {user && <p className="text-[8px] text-[#DA4848]/50 font-mono mt-2 italic">Encrypted & masked in database</p>}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Provider Dropdown (as selection list) */}
                                    <div className="p-4 rounded-lg bg-[#76D2DB]/3 border border-[#76D2DB]/10">
                                        <label className="text-[9px] font-black text-[#76D2DB]/70 uppercase tracking-[0.2em] block mb-3">Quick Sync Provider</label>
                                        <div className="flex flex-wrap gap-2">
                                            {PROVIDERS.map(p => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => selectProvider(p)}
                                                    className="flex items-center gap-2 px-3 py-2 rounded border border-white/5 bg-black/40 hover:border-[#76D2DB]/40 hover:bg-[#76D2DB]/5 transition-all group/p"
                                                >
                                                    <div className="shrink-0 text-[#76D2DB]/60 group-hover/p:text-[#76D2DB]">{p.icon}</div>
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover/p:text-slate-300">{p.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Card 1: Configuration */}
                                    <div className="p-4 rounded-lg border border-[#76D2DB]/20 bg-black/20">
                                        <h4 className="text-[9px] font-black text-[#76D2DB] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
                                            Endpoint Data
                                        </h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.1em] block mb-1.5">Base URL</label>
                                                <input
                                                    type="url"
                                                    value={baseUrl}
                                                    onChange={e => setBaseUrl(e.target.value)}
                                                    placeholder="https://api.openai.com"
                                                    className="w-full bg-black/40 border border-white/10 rounded px-3 py-2.5 text-xs text-white placeholder-gray-700 font-mono focus:border-[#76D2DB]/60 transition-all outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.1em] block mb-1.5">Model ID</label>
                                                <input
                                                    type="text"
                                                    value={model}
                                                    onChange={e => setModel(e.target.value)}
                                                    placeholder="gpt-4o, etc."
                                                    className="w-full bg-black/40 border border-white/10 rounded px-3 py-2.5 text-xs text-white placeholder-gray-700 font-mono focus:border-[#76D2DB]/60 transition-all outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card 2: Security */}
                                    <div className="p-4 rounded-lg border border-[#DA4848]/20 bg-black/20">
                                        <h4 className="text-[9px] font-black text-[#DA4848] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                            API Access
                                        </h4>
                                        <div className="relative">
                                            <input
                                                type={showKey ? 'text' : 'password'}
                                                value={apiKey}
                                                onChange={e => setApiKey(e.target.value)}
                                                placeholder={isConfigured ? '(unchanged)' : 'sk-••••••••'}
                                                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2.5 pr-10 text-xs text-white placeholder-gray-700 font-mono focus:border-[#DA4848]/60 transition-all outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowKey(v => !v)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-700 hover:text-[#76D2DB] transition-colors"
                                            >
                                                {showKey ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                                            </button>
                                        </div>
                                        <p className="text-[8px] text-slate-600 mt-2 italic font-mono">Leave blank to keep current key</p>
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded text-[10px] font-black uppercase tracking-widest bg-[#76D2DB]/10 border border-[#76D2DB]/40 text-[#76D2DB] hover:bg-[#76D2DB]/20 hover:border-[#76D2DB]/70 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(118,210,219,0.1)]"
                                        >
                                            {saveStatus === 'saving' ? (
                                                <span className="w-3 h-3 rounded-full border border-[#76D2DB]/40 border-t-[#76D2DB] animate-spin" />
                                            ) : saveStatus === 'saved' ? (
                                                <span className="flex items-center gap-2">✓ SAVED!</span>
                                            ) : (
                                                <>
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                                    Save Configuration
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => { setEditing(false); setApiKey(''); setShowKey(false); }}
                                            className="px-4 py-2.5 rounded text-[10px] font-black uppercase tracking-widest border border-gray-700 text-slate-500 hover:text-slate-300 transition-all"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {!user && (
                        <div className="rounded-xl border border-[#DA4848]/20 bg-[#DA4848]/5 px-4 py-3 flex items-start gap-3">
                            <svg className="w-4 h-4 text-[#DA4848] shrink-0 fill-current" viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            <p className="text-[9px] text-slate-500">Guest mode – Local storage only. <a href="/login" className="text-[#76D2DB] hover:underline">Sign in</a> to sync.</p>
                        </div>
                    )}
                </div>

                {/* Right Column: Test Results */}
                <div className="space-y-4">
                    <div className="relative rounded-xl border border-[#76D2DB]/20 bg-[#0B0F1A] overflow-hidden shadow-lg p-6 flex flex-col items-center gap-6">
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#DA4848]/60" />
                        {!isConfigured ? (
                            <div className="text-center py-6 opacity-40">
                                <div className="w-12 h-12 mx-auto mb-3 rounded-xl border-2 border-dashed border-[#76D2DB]/20 flex items-center justify-center text-[#76D2DB]/50">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                </div>
                                <p className="text-[10px] uppercase font-black tracking-widest">Awaiting Setup</p>
                            </div>
                        ) : (
                            <>
                                <p className="text-xs text-slate-500 text-center max-w-xs">Fire a test request to verify your endpoint and API credentials.</p>
                                <button
                                    onClick={handleTest}
                                    disabled={testing}
                                    className="w-full max-w-xs flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all bg-linear-to-br from-[#76D2DB]/15 to-[#DA4848]/10 border border-[#76D2DB]/40 text-[#76D2DB] hover:border-[#76D2DB] hover:bg-[#76D2DB]/20 disabled:opacity-50"
                                >
                                    {testing ? <span className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" /> : 'Fire Test Request'}
                                </button>
                            </>
                        )}
                    </div>

                    {result && (
                        <div className="relative rounded-xl border border-white/5 bg-[#0B0F1A] overflow-hidden shadow-2xl">
                            <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ background: result.success ? '#76D2DB' : '#DA4848' }} />
                            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-black/20">
                                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: result.success ? '#76D2DB' : '#DA4848' }}>
                                    {result.success ? '✓ Diagnostic Success' : '✗ Diagnostic Error'}
                                </span>
                                {result.statusCode > 0 && <StatusPill code={result.statusCode} />}
                            </div>

                            <div className="px-5 py-5 space-y-5">
                                {result.success ? (
                                    <>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] block mb-2">Stream Content</label>
                                            <div className="relative">
                                                <div className="bg-[#76D2DB]/5 border border-[#76D2DB]/10 rounded-lg px-4 py-3.5 font-mono text-sm text-white break-all">{result.content || <span className="opacity-30">EMPTY_BODY</span>}</div>
                                                <div className="absolute top-2 right-2"><CopyBtn value={result.content || ''} /></div>
                                            </div>
                                        </div>
                                        {result.usage && (
                                            <div className="grid grid-cols-3 gap-3">
                                                {[
                                                    { label: 'Prompt', val: result.usage.prompt_tokens },
                                                    { label: 'Completion', val: result.usage.completion_tokens },
                                                    { label: 'Total', val: result.usage.total_tokens },
                                                ].map(({ label, val }) => (
                                                    <div key={label} className="rounded bg-white/5 border border-white/5 p-3 text-center">
                                                        <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">{label}</div>
                                                        <div className="text-sm font-black font-mono text-[#76D2DB]">{val ?? '0'}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div>
                                        <label className="text-[9px] font-black text-[#DA4848]/70 uppercase tracking-[0.2em] block mb-2">Error Trace</label>
                                        <div className="bg-[#DA4848]/5 border border-[#DA4848]/20 rounded-lg px-4 py-3.5 font-mono text-xs text-[#DA4848] break-all">{result.error || 'UNHANDLED_EXCEPTION'}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
