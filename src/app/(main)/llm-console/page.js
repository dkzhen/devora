'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { HeroHeader, LoadingState } from '@/components/HeroHeader';

// ── Local-storage helpers ──────────────────────────────────────────────────────
const LS_KEY = 'llm_console_config';

function lsLoad() {
    try {
        const raw = localStorage.getItem(LS_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function lsSave(data) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch { }
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
            : 'bg-gray-500/15 text-gray-400 border-gray-500/30';
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


// ── Main Component ─────────────────────────────────────────────────────────────
export default function LlmConsolePage() {
    // Auth state
    const [user, setUser] = useState(null);
    const [authLoaded, setAuthLoaded] = useState(false);

    // Config state
    const [configLoaded, setConfigLoaded] = useState(false);
    const [isConfigured, setIsConfigured] = useState(false);
    const [editing, setEditing] = useState(false); // editing panel open

    const [baseUrl, setBaseUrl] = useState('');
    const [model, setModel] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [apiKeyMasked, setApiKeyMasked] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [saving, setSaving] = useState(false);

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
        if (!baseUrl.trim() || !model.trim() || !apiKey.trim()) {
            toast.error('All fields are required');
            return;
        }
        setSaving(true);
        try {
            if (user) {
                const res = await fetch('/api/llm-console/config', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ baseUrl: baseUrl.trim(), model: model.trim(), apiKey: apiKey.trim() }),
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.error || 'Failed to save');
                toast.success('Config saved to database');
            } else {
                lsSave({ baseUrl: baseUrl.trim(), model: model.trim(), apiKey: apiKey.trim() });
                toast.success('Config saved locally');
            }
            await loadConfig(!!user);
            setEditing(false);
            setApiKey('');
            setShowKey(false);
        } catch (err) {
            toast.error(err.message || 'Save failed');
        } finally {
            setSaving(false);
        }
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
                    colorTheme="cyberpunk"
                    breadcrumbs={[{ label: 'DASHBOARD', href: '/' }, { label: 'LLM CONSOLE' }]}
                    title="LLM"
                    badge="Console"
                    description="Test any OpenAI-compatible API endpoint in seconds."
                />
                <LoadingState message="Initializing console..." colorTheme="cyberpunk" />
            </div>
        );
    }

    const ACCENT = '#76D2DB';
    const ACCENT2 = '#DA4848';
    const BG = '#0B0F1A';

    return (
        <div className="flex flex-col gap-6 pb-12">
            {/* ── Hero Header ─────────────────────────────────────────────── */}
            <HeroHeader
                colorTheme="cyberpunk"
                breadcrumbs={[{ label: 'DASHBOARD', href: '/' }, { label: 'LLM CONSOLE' }]}
                title="LLM"
                badge="Console"
                description="Test any OpenAI-compatible API endpoint. Supports custom base URL, model selection, and optional API key storage."
                actionContent={
                    <div className="flex items-center gap-2">
                        {/* Auth badge */}
                        {user ? (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border border-[#76D2DB]/30 text-[#76D2DB] rounded bg-[#76D2DB]/5">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                DB Storage
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border border-gray-600/40 text-gray-400 rounded bg-gray-800/30">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                Local Storage
                            </span>
                        )}
                    </div>
                }
            />

            {/* ── Gradient Banner ─────────────────────────────────────────── */}
            <div className="relative overflow-hidden rounded-xl border border-white/5 h-20 md:h-24">
                <div className="absolute inset-0" style={{
                    background: 'linear-gradient(135deg, #36064D 0%, #76D2DB33 30%, #DA484833 70%, #36064D 100%)',
                }} />
                <div className="absolute inset-0 pointer-events-none opacity-30" style={{
                    backgroundImage: 'linear-gradient(rgba(118,210,219,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(118,210,219,0.08) 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                }} />
                {/* floating shapes */}
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
                    {/* color strip */}
                    <div className="ml-auto flex gap-1.5 items-center opacity-70">
                        {['#76D2DB', '#F7F6E5', '#DA4848'].map(c => (
                            <span key={c} className="w-2 h-2 rounded-full" style={{ background: c }} />
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Main Grid ───────────────────────────────────────────────── */}
            <div className="grid lg:grid-cols-[400px_1fr] gap-6">

                {/* ── LEFT — Config Panel ──────────────────────────────────── */}
                <div className="space-y-4">

                    {/* Config card */}
                    <div className="relative rounded-xl border border-[#76D2DB]/20 bg-[#0B0F1A] overflow-hidden" style={{ boxShadow: '0 0 30px rgba(118,210,219,0.04)' }}>
                        {/* left accent strip */}
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
                                        onClick={() => { setEditing(true); setApiKey(''); setShowKey(false); }}
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

                        <div className="px-5 py-4 space-y-4">
                            {/* Show saved config (read-only) */}
                            {isConfigured && !editing ? (
                                <div className="space-y-3">
                                    {/* Base URL */}
                                    <div>
                                        <label className="text-[9px] font-black text-[#76D2DB]/60 uppercase tracking-[0.2em] block mb-1.5">Base URL</label>
                                        <div className="flex items-center gap-2">
                                            <code className="flex-1 text-[11px] font-mono text-gray-300 bg-[#76D2DB]/5 border border-[#76D2DB]/15 rounded px-3 py-2 truncate">{baseUrl}</code>
                                            <CopyBtn value={baseUrl} />
                                        </div>
                                    </div>

                                    {/* Model */}
                                    <div>
                                        <label className="text-[9px] font-black text-[#76D2DB]/60 uppercase tracking-[0.2em] block mb-1.5">Model</label>
                                        <div className="flex items-center gap-2">
                                            <code className="flex-1 text-[11px] font-mono text-gray-300 bg-[#76D2DB]/5 border border-[#76D2DB]/15 rounded px-3 py-2">{model}</code>
                                            <CopyBtn value={model} />
                                        </div>
                                    </div>

                                    {/* API Key (masked) */}
                                    <div>
                                        <label className="text-[9px] font-black text-[#76D2DB]/60 uppercase tracking-[0.2em] block mb-1.5">API Key</label>
                                        <div className="flex items-center gap-2">
                                            <code className="flex-1 text-[11px] font-mono text-gray-300 bg-[#76D2DB]/5 border border-[#76D2DB]/15 rounded px-3 py-2">
                                                {user
                                                    ? apiKeyMasked
                                                    : showKey ? apiKey : apiKeyMasked
                                                }
                                            </code>
                                            <div className="flex gap-1.5">
                                                {/* show/hide for guests only */}
                                                {!user && (
                                                    <button
                                                        onClick={() => setShowKey(v => !v)}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest border border-[#76D2DB]/25 text-[#76D2DB]/60 hover:text-[#76D2DB] hover:border-[#76D2DB]/50 rounded transition-all"
                                                    >
                                                        {showKey ? (
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                                        ) : (
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                        )}
                                                    </button>
                                                )}
                                                {/* copy: guests use plain key, logged-in fetch raw from server */}
                                                {user ? (
                                                    <ApiKeyCopyBtn />
                                                ) : (
                                                    <CopyBtn value={apiKey} label="Copy" />
                                                )}
                                            </div>
                                        </div>
                                        {user && (
                                            <p className="text-[9px] text-[#DA4848]/60 font-mono mt-1">🔐 Key encrypted in database — display always masked</p>
                                        )}
                                    </div>

                                </div>
                            ) : (
                                /* Edit / setup form */
                                <div className="space-y-4">
                                    {/* Quick Connect */}
                                    <div>
                                        <label className="text-[9px] font-black text-[#76D2DB]/70 uppercase tracking-[0.2em] block mb-2.5">
                                            Quick Connect
                                        </label>
                                        <div className="grid grid-cols-5 gap-2">
                                            {PROVIDERS.map(p => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => selectProvider(p)}
                                                    title={p.name}
                                                    className="group flex flex-col items-center gap-1.5 p-2 rounded-lg border border-[#76D2DB]/10 bg-[#76D2DB]/3 hover:bg-[#76D2DB]/10 hover:border-[#76D2DB]/40 transition-all"
                                                >
                                                    <div className="w-8 h-8 rounded-md border border-[#76D2DB]/20 bg-black/40 flex items-center justify-center text-[#76D2DB]/60 group-hover:text-[#76D2DB] group-hover:border-[#76D2DB]/40 transition-all">
                                                        {p.icon}
                                                    </div>
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 group-hover:text-[#76D2DB]/80">{p.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Base URL */}
                                    <div>
                                        <label className="text-[9px] font-black text-[#76D2DB]/70 uppercase tracking-[0.2em] block mb-1.5">
                                            Base URL
                                        </label>
                                        <input
                                            id="llm-base-url"
                                            type="url"
                                            value={baseUrl}
                                            onChange={e => setBaseUrl(e.target.value)}
                                            placeholder="https://api.openai.com"
                                            className="w-full bg-black/40 border border-[#76D2DB]/20 rounded px-3 py-2.5 text-xs text-white placeholder-gray-600 font-mono focus:outline-none focus:border-[#76D2DB]/60 focus:shadow-[0_0_12px_rgba(118,210,219,0.1)] transition-all"
                                        />
                                        <p className="text-[9px] text-gray-600 mt-1 font-mono">/chat/completions will be appended automatically</p>
                                    </div>

                                    {/* Model */}
                                    <div>
                                        <label className="text-[9px] font-black text-[#76D2DB]/70 uppercase tracking-[0.2em] block mb-1.5">
                                            Model
                                        </label>
                                        <input
                                            id="llm-model"
                                            type="text"
                                            value={model}
                                            onChange={e => setModel(e.target.value)}
                                            placeholder="gpt-4o, llama-3.1-70b, etc."
                                            className="w-full bg-black/40 border border-[#76D2DB]/20 rounded px-3 py-2.5 text-xs text-white placeholder-gray-600 font-mono focus:outline-none focus:border-[#76D2DB]/60 focus:shadow-[0_0_12px_rgba(118,210,219,0.1)] transition-all"
                                        />
                                    </div>

                                    {/* API Key */}
                                    <div>
                                        <label className="text-[9px] font-black text-[#76D2DB]/70 uppercase tracking-[0.2em] block mb-1.5">
                                            API Key
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="llm-api-key"
                                                type={showKey ? 'text' : 'password'}
                                                value={apiKey}
                                                onChange={e => setApiKey(e.target.value)}
                                                placeholder="sk-••••••••••••••••"
                                                className="w-full bg-black/40 border border-[#76D2DB]/20 rounded px-3 py-2.5 pr-10 text-xs text-white placeholder-gray-600 font-mono focus:outline-none focus:border-[#76D2DB]/60 focus:shadow-[0_0_12px_rgba(118,210,219,0.1)] transition-all"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowKey(v => !v)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-[#76D2DB] transition-colors"
                                            >
                                                {showKey ? (
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                                ) : (
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                )}
                                            </button>
                                        </div>
                                        <p className="text-[9px] text-gray-600 mt-1 font-mono">
                                            {user ? '🔐 Will be encrypted in database' : '📦 Will be saved in localStorage'}
                                        </p>
                                    </div>

                                    {/* Buttons */}
                                    <div className="flex gap-2 pt-1">
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded text-[10px] font-black uppercase tracking-widest bg-[#76D2DB]/10 border border-[#76D2DB]/40 text-[#76D2DB] hover:bg-[#76D2DB]/20 hover:border-[#76D2DB]/70 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(118,210,219,0.1)]"
                                        >
                                            {saving ? (
                                                <span className="w-3 h-3 rounded-full border border-[#76D2DB]/40 border-t-[#76D2DB] animate-spin" />
                                            ) : (
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                            )}
                                            {saving ? 'Saving...' : 'Save Config'}
                                        </button>
                                        {editing && (
                                            <button
                                                onClick={() => { setEditing(false); setApiKey(''); setShowKey(false); }}
                                                className="px-4 py-2.5 rounded text-[10px] font-black uppercase tracking-widest border border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-600 transition-all"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sign-in nudge for guests */}
                    {!user && (
                        <div className="relative rounded-xl border border-[#DA4848]/20 bg-[#DA4848]/5 px-4 py-3 flex items-start gap-3">
                            <svg className="w-4 h-4 text-[#DA4848] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            <div>
                                <p className="text-[10px] font-black text-[#DA4848] uppercase tracking-widest">Guest mode – Local storage only</p>
                                <p className="text-[9px] text-gray-500 mt-0.5">
                                    <a href="/login" className="text-[#76D2DB] hover:underline">Sign in</a> to encrypt &amp; sync your config in the database.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Request preview */}
                    {isConfigured && !editing && (
                        <div className="rounded-xl border border-[#76D2DB]/10 bg-[#0B0F1A] overflow-hidden">
                            <div className="px-5 py-3 border-b border-[#76D2DB]/10 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-sm bg-[#DA4848] shadow-[0_0_6px_#DA4848]" />
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Request Preview</span>
                            </div>
                            <pre className="px-5 py-4 text-[10px] font-mono text-gray-400 overflow-x-auto leading-relaxed whitespace-pre-wrap break-all">
                                {`POST ${baseUrl.replace(/\/+$/, '')}/chat/completions
Authorization: Bearer ${apiKeyMasked || '••••••••'}

{
  "model": "${model || '<model>'}",
  "messages": [{"role": "user", "content": "Hello"}],
  "temperature": 0,
  "max_tokens": 5
}`}
                            </pre>
                        </div>
                    )}
                </div>

                {/* ── RIGHT — Test & Result Panel ──────────────────────────── */}
                <div className="space-y-4">
                    {/* Test button */}
                    <div className="relative rounded-xl border border-[#76D2DB]/20 bg-[#0B0F1A] overflow-hidden" style={{ boxShadow: '0 0 30px rgba(118,210,219,0.04)' }}>
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#DA4848]/80 via-[#76D2DB]/40 to-transparent" />

                        <div className="px-5 py-4 border-b border-[#76D2DB]/10 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-sm bg-[#DA4848] shadow-[0_0_8px_#DA4848]" />
                            <span className="text-[10px] font-black text-[#DA4848] uppercase tracking-[0.2em]">Endpoint Test</span>
                        </div>

                        <div className="px-5 py-6 flex flex-col items-center gap-5">
                            {!isConfigured ? (
                                <div className="text-center py-4">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-xl border-2 border-dashed border-[#76D2DB]/20 flex items-center justify-center bg-[#76D2DB]/3">
                                        <svg className="w-7 h-7 text-[#76D2DB]/30" viewBox="0 0 48 48" fill="currentColor">
                                            <path d="M45.6,18.7,41,14.9V7.5a1,1,0,0,0-.6-.9L30.5,2.1h-.4l-.6.2L24,5.9,18.5,2.2,17.9,2h-.4L7.6,6.6a1,1,0,0,0-.6.9v7.4L2.4,18.7a.8.8,0,0,0-.4.8v9H2a.8.8,0,0,0,.4.8L7,33.1v7.4a1,1,0,0,0,.6.9l9.9,4.5h.4l.6-.2L24,42.1l5.5,3.7.6.2h.4l9.9-4.5a1,1,0,0,0,.6-.9V33.1l4.6-3.8a.8.8,0,0,0,.4-.7V19.4h0A.8.8,0,0,0,45.6,18.7Z" />
                                        </svg>
                                    </div>
                                    <p className="text-[11px] font-bold text-gray-500">Configure your API credentials first</p>
                                </div>
                            ) : (
                                <>
                                    <p className="text-xs text-gray-500 text-center max-w-xs">
                                        Sends <code className="text-[#76D2DB] bg-[#76D2DB]/10 px-1 rounded">Hello</code> with{' '}
                                        <code className="text-[#76D2DB] bg-[#76D2DB]/10 px-1 rounded">max_tokens: 5</code> to verify connectivity.
                                    </p>
                                    <button
                                        onClick={handleTest}
                                        disabled={testing || !isConfigured}
                                        className="relative w-full max-w-xs flex items-center justify-center gap-3 px-6 py-3.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                                        style={{
                                            background: testing ? 'rgba(118,210,219,0.05)' : 'linear-gradient(135deg, rgba(118,210,219,0.15), rgba(218,72,72,0.1))',
                                            border: '2px solid',
                                            borderColor: testing ? '#76D2DB66' : '#76D2DB99',
                                            color: '#76D2DB',
                                            boxShadow: testing ? 'none' : '0 0 20px rgba(118,210,219,0.15)',
                                        }}
                                    >
                                        {testing ? (
                                            <>
                                                <span className="w-4 h-4 rounded border border-[#76D2DB]/40 border-t-[#76D2DB] animate-spin" />
                                                Testing endpoint...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                Fire Test Request
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Results */}
                    {result && (
                        <div className="relative rounded-xl border overflow-hidden" style={{
                            borderColor: result.success ? '#76D2DB33' : '#DA484833',
                            background: '#0B0F1A',
                            boxShadow: result.success ? '0 0 30px rgba(118,210,219,0.06)' : '0 0 30px rgba(218,72,72,0.06)',
                        }}>
                            <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{
                                background: result.success
                                    ? 'linear-gradient(to bottom, #76D2DB, transparent)'
                                    : 'linear-gradient(to bottom, #DA4848, transparent)',
                            }} />

                            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: result.success ? '#76D2DB15' : '#DA484815' }}>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: result.success ? '#76D2DB' : '#DA4848' }}>
                                        {result.success ? '✓ Success' : '✗ Error'}
                                    </span>
                                    {result.statusCode > 0 && <StatusPill code={result.statusCode} />}
                                </div>
                                {result.model && (
                                    <span className="text-[9px] font-mono text-gray-600 bg-gray-800/50 px-2 py-1 rounded">{result.model}</span>
                                )}
                            </div>

                            <div className="px-5 py-4 space-y-4">
                                {result.success ? (
                                    <>
                                        {result.content !== null && result.content !== undefined && (
                                            <div>
                                                <label className="text-[9px] font-black text-[#76D2DB]/60 uppercase tracking-[0.2em] block mb-2">Response Content</label>
                                                <div className="relative">
                                                    <div className="bg-[#76D2DB]/5 border border-[#76D2DB]/15 rounded px-4 py-3 font-mono text-sm text-white min-h-[48px] break-all">
                                                        {result.content || <span className="text-gray-600">(empty string)</span>}
                                                    </div>
                                                    <div className="absolute top-2 right-2">
                                                        <CopyBtn value={result.content || ''} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {result.usage && (
                                            <div className="grid grid-cols-3 gap-3">
                                                {[
                                                    { label: 'Prompt', val: result.usage.prompt_tokens },
                                                    { label: 'Completion', val: result.usage.completion_tokens },
                                                    { label: 'Total', val: result.usage.total_tokens },
                                                ].map(({ label, val }) => (
                                                    <div key={label} className="rounded bg-[#76D2DB]/5 border border-[#76D2DB]/10 px-3 py-2 text-center">
                                                        <div className="text-[9px] text-gray-600 uppercase tracking-widest mb-0.5">{label}</div>
                                                        <div className="text-sm font-black font-mono text-[#76D2DB]">{val ?? '—'}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div>
                                        <label className="text-[9px] font-black text-[#DA4848]/70 uppercase tracking-[0.2em] block mb-2">Error Message</label>
                                        <div className="bg-[#DA4848]/5 border border-[#DA4848]/20 rounded px-4 py-3 font-mono text-xs text-[#DA4848]/90 break-all">
                                            {result.error || 'Unknown error'}
                                        </div>
                                        {result.raw && (
                                            <details className="mt-3">
                                                <summary className="text-[9px] text-gray-600 cursor-pointer hover:text-gray-400 font-mono uppercase tracking-widest select-none">
                                                    Raw Response
                                                </summary>
                                                <pre className="mt-2 text-[9px] font-mono text-gray-600 bg-black/30 rounded p-3 overflow-x-auto whitespace-pre-wrap break-all">
                                                    {JSON.stringify(result.raw, null, 2)}
                                                </pre>
                                            </details>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Info cards */}
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            {
                                title: 'Low-Token Probe',
                                desc: 'Uses max_tokens: 5 to minimize cost while validating connectivity.',
                                color: '#76D2DB',
                                icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            },
                            {
                                title: 'OpenAI-Compatible',
                                desc: 'Works with any API implementing the /chat/completions spec.',
                                color: '#DA4848',
                                icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            },
                        ].map(c => (
                            <div key={c.title} className="rounded-xl border p-4" style={{ borderColor: `${c.color}20`, background: `${c.color}05` }}>
                                <div className="mb-2" style={{ color: `${c.color}99` }}>{c.icon}</div>
                                <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: c.color }}>{c.title}</p>
                                <p className="text-[9px] text-gray-600 leading-relaxed">{c.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
