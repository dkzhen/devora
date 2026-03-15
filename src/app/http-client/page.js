'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { apiCategories } from '@/lib/api-endpoints';
import { HeroHeader, LoadingState } from '@/components/HeroHeader';
// ─── helpers ────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);

// ─── cURL parser ─────────────────────────────────────────────────────────────
const parseCurl = (raw) => {
    const req = newRequest();
    raw = raw.trim().replace(/\\\n/g, ' ');
    if (!raw.startsWith('curl')) return null;

    // URL
    const urlMatch = raw.match(/curl\s+(?:-[A-Za-z]+\s+[^'"\s]+\s+)*['"]?(https?:\/\/[^'"\s]+)['"]?/);
    const bareUrl = raw.match(/curl\s+['"]?(https?:\/\/[^'"\s]+)['"]?/);
    req.url = (urlMatch || bareUrl)?.[1] || '';

    // Method
    const methodMatch = raw.match(/-X\s+([A-Z]+)/);
    if (methodMatch) req.method = methodMatch[1];

    // Headers
    const headerMatches = [...raw.matchAll(/-H\s+['"]([^:]+):\s*([^'"]+)['"]/g)];
    if (headerMatches.length) {
        req.headers = headerMatches.map(m => ({ id: uid(), key: m[1].trim(), val: m[2].trim(), enabled: true }));
        req.headers.push({ id: uid(), key: '', val: '', enabled: true });
    }

    // Body
    const bodyMatch = raw.match(/(?:--data(?:-raw|-urlencode)?|-d)\s+['"]([^'"]+)['"]/);
    if (bodyMatch) {
        req.bodyType = 'json';
        req.method = req.method === 'GET' ? 'POST' : req.method;
        req.body = bodyMatch[1];
    }

    return req.url ? req : null;
};

const parseUrl = (raw) => {
    const req = newRequest();
    try {
        const url = new URL(raw.trim());
        req.url = url.origin + url.pathname;
        if (url.searchParams.size > 0) {
            req.params = [];
            url.searchParams.forEach((val, key) => req.params.push({ id: uid(), key, val, enabled: true }));
            req.params.push({ id: uid(), key: '', val: '', enabled: true });
        }
        return req;
    } catch { return null; }
};

const METHOD_COLORS = {
    GET: 'text-[#76D2DB]',
    POST: 'text-[#F7F6E5]',
    PUT: 'text-amber-400',
    PATCH: 'text-purple-400',
    DELETE: 'text-[#DA4848]',
    HEAD: 'text-indigo-400',
    OPTIONS: 'text-pink-400',
};

const METHOD_BG = {
    GET: 'bg-[#76D2DB]/10 border-[#76D2DB]/30',
    POST: 'bg-[#F7F6E5]/10 border-[#F7F6E5]/30',
    PUT: 'bg-amber-500/15 border-amber-500/30',
    PATCH: 'bg-purple-500/15 border-purple-500/30',
    DELETE: 'bg-[#DA4848]/15 border-[#DA4848]/30',
    HEAD: 'bg-indigo-500/15 border-indigo-500/30',
    OPTIONS: 'bg-pink-500/15 border-pink-500/30',
};

const STATUS_COLOR = (s) => {
    if (!s) return 'text-gray-500';
    if (s < 300) return 'text-[#76D2DB]';
    if (s < 400) return 'text-[#F7F6E5]';
    if (s < 500) return 'text-amber-400';
    return 'text-[#DA4848]';
};

const STATUS_BG = (s) => {
    if (!s) return 'bg-gray-500/20 border-gray-500/30';
    if (s < 300) return 'bg-[#76D2DB]/15 border-[#76D2DB]/30';
    if (s < 400) return 'bg-[#F7F6E5]/15 border-[#F7F6E5]/30';
    if (s < 500) return 'bg-amber-500/15 border-amber-500/30';
    return 'bg-[#DA4848]/15 border-[#DA4848]/30';
};

const interpolateEnv = (str, vars) => {
    if (!str) return str;
    return str.replace(/\{\{(\w+)\}\}/g, (_, k) => {
        const found = vars.find(v => v.key === k);
        return found ? found.val : `{{${k}}}`;
    });
};

const prettyJson = (str) => {
    try { return JSON.stringify(JSON.parse(str), null, 2); }
    catch { return str; }
};

const newRequest = () => ({
    id: uid(), name: 'Untitled Request', method: 'GET', url: '',
    params: [{ id: uid(), key: '', val: '', enabled: true }],
    headers: [{ id: uid(), key: '', val: '', enabled: true }],
    bodyType: 'none', body: '',
    formData: [{ id: uid(), key: '', val: '', enabled: true }],
});

// ─── KV table ───────────────────────────────────────────────────────────────
function KVTable({ rows, onChange, placeholder = ['Key', 'Value'] }) {
    const add = () => onChange([...rows, { id: uid(), key: '', val: '', enabled: true }]);
    const remove = (id) => onChange(rows.filter(r => r.id !== id));
    const update = (id, field, value) => onChange(rows.map(r => r.id === id ? { ...r, [field]: value } : r));

    return (
        <div className="space-y-1.5">
            {rows.map((row) => (
                <div key={row.id} className="flex items-center gap-1.5 group">
                    <input
                        type="checkbox"
                        checked={row.enabled}
                        onChange={e => update(row.id, 'enabled', e.target.checked)}
                        className="w-3.5 h-3.5 accent-[#76D2DB] shrink-0"
                    />
                    <input
                        value={row.key}
                        onChange={e => update(row.id, 'key', e.target.value)}
                        placeholder={placeholder[0]}
                        className="flex-1 min-w-0 bg-[#36064D]/50 backdrop-blur-md border border-[#DA4848]/30 rounded-lg px-2.5 py-1.5 text-xs text-[#F7F6E5] placeholder-gray-600 focus:outline-none focus:border-[#76D2DB]/50 font-mono"
                    />
                    <input
                        value={row.val}
                        onChange={e => update(row.id, 'val', e.target.value)}
                        placeholder={placeholder[1]}
                        className="flex-1 min-w-0 bg-[#36064D]/50 backdrop-blur-md border border-[#DA4848]/30 rounded-lg px-2.5 py-1.5 text-xs text-[#F7F6E5] placeholder-gray-600 focus:outline-none focus:border-[#76D2DB]/50 font-mono"
                    />
                    <button
                        onClick={() => remove(row.id)}
                        className="p-1 text-gray-600 hover:text-[#DA4848] opacity-0 group-hover:opacity-100 -opacity"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            ))}
            <button onClick={add} className="flex items-center gap-1.5 text-[11px] text-[#76D2DB]/60 hover:text-[#76D2DB] mt-1 pl-1 font-black uppercase tracking-widest">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 5v14M5 12h14" />
                </svg>
                ADD FIELD
            </button>
        </div>
    );
}

// ─── JSON viewer ─────────────────────────────────────────────────────────────
function JsonView({ data }) {
    const pretty = prettyJson(data);
    return (
        <pre className="text-xs leading-relaxed font-mono text-gray-300 whitespace-pre-wrap break-all">
            {pretty.split('\n').map((line, i) => {
                const keyMatch = line.match(/^(\s*)("[\w\s]+")(: )(.*)$/);
                if (keyMatch) {
                    const [, indent, key, colon, val] = keyMatch;
                    const isStr = val.startsWith('"');
                    const isNum = !isNaN(parseFloat(val.replace(/,$/, '')));
                    const isBool = val.startsWith('true') || val.startsWith('false');
                    const isNull = val.startsWith('null');
                    return (
                        <span key={i} className="block">
                            {indent}
                            <span className="text-[#76D2DB]">{key}</span>
                            <span className="text-gray-500">{colon}</span>
                            <span className={isStr ? 'text-[#F7F6E5]' : isNum ? 'text-[#DA4848]' : isBool || isNull ? 'text-amber-300' : 'text-gray-200'}>
                                {val}
                            </span>
                        </span>
                    );
                }
                return <span key={i} className="block">{line}</span>;
            })}
        </pre>
    );
}

// ─── Env Modal ───────────────────────────────────────────────────────────────
function EnvModal({ envs, activeEnvId, onClose, onSave, onSetActive }) {
    const [localEnvs, setLocalEnvs] = useState(JSON.parse(JSON.stringify(envs)));
    const [selectedEnv, setSelectedEnv] = useState(() => localEnvs[0]?.id || null);

    const addEnv = () => {
        const newEnv = { id: uid(), name: 'New Environment', vars: [{ id: uid(), key: '', val: '' }] };
        setLocalEnvs(prev => [...prev, newEnv]);
        setSelectedEnv(newEnv.id);
    };
    const deleteEnv = (id) => {
        setLocalEnvs(prev => prev.filter(e => e.id !== id));
        setSelectedEnv(prev => prev === id ? localEnvs[0]?.id : prev);
    };
    const updateEnvName = (id, name) => setLocalEnvs(prev => prev.map(e => e.id === id ? { ...e, name } : e));
    const updateVars = (id, vars) => setLocalEnvs(prev => prev.map(e => e.id === id ? { ...e, vars } : e));
    const addVar = (id) => setLocalEnvs(prev => prev.map(e => e.id === id ? { ...e, vars: [...e.vars, { id: uid(), key: '', val: '' }] } : e));
    const removeVar = (envId, varId) => setLocalEnvs(prev => prev.map(e => e.id === envId ? { ...e, vars: e.vars.filter(v => v.id !== varId) } : e));
    const updateVar = (envId, varId, field, value) =>
        setLocalEnvs(prev => prev.map(e => e.id === envId ? { ...e, vars: e.vars.map(v => v.id === varId ? { ...v, [field]: value } : v) } : e));

    const activeLocal = localEnvs.find(e => e.id === selectedEnv);

    return (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
            <div className="relative bg-[#36064D]/60 backdrop-blur-xl border border-[#DA4848]/40 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between p-5 border-b border-[#DA4848]/20">
                    <h3 className="text-base font-black text-[#F7F6E5] tracking-tight uppercase">Manage Environments</h3>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-[#76D2DB] hover:bg-[#76D2DB]/10 rounded-lg">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="flex flex-1 overflow-hidden">
                    {/* Env list */}
                    <div className="w-48 shrink-0 border-r border-white/5 p-3 space-y-1 overflow-y-auto">
                        {localEnvs.map(env => (
                            <button
                                key={env.id}
                                onClick={() => setSelectedEnv(env.id)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-tight flex items-center justify-between group ${selectedEnv === env.id ? 'bg-[#76D2DB]/15 text-[#76D2DB] border border-[#76D2DB]/20' : 'text-gray-500 hover:bg-[#76D2DB]/5 hover:text-[#F7F6E5]'}`}
                            >
                                <span className="truncate">{env.name}</span>
                                {activeEnvId === env.id && <span className="w-1.5 h-1.5 rounded-full bg-[#76D2DB] shrink-0 ml-1" />}
                            </button>
                        ))}
                        <button onClick={addEnv} className="w-full flex items-center gap-1.5 text-[11px] font-black uppercase text-gray-600 hover:text-[#76D2DB] px-3 py-2">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v14M5 12h14" /></svg>
                            New Env
                        </button>
                    </div>
                    {/* Env detail */}
                    <div className="flex-1 p-4 overflow-y-auto">
                        {activeLocal ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <input
                                        value={activeLocal.name}
                                        onChange={e => updateEnvName(activeLocal.id, e.target.value)}
                                        className="flex-1 bg-transparent border border-[#DA4848]/30 focus:border-[#76D2DB]/60 rounded-xl px-3 py-2 text-sm text-[#F7F6E5] focus:outline-none"
                                    />
                                    <button
                                        onClick={() => onSetActive(activeLocal.id === activeEnvId ? null : activeLocal.id)}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${activeLocal.id === activeEnvId ? 'bg-[#76D2DB]/20 text-[#76D2DB] border-[#76D2DB]/40' : 'bg-[#76D2DB]/5 text-gray-500 border-[#DA4848]/20 hover:text-[#76D2DB] hover:border-[#76D2DB]/30'}`}
                                    >
                                        {activeLocal.id === activeEnvId ? 'Active' : 'Set Active'}
                                    </button>
                                    <button onClick={() => deleteEnv(activeLocal.id)} className="p-2 text-gray-600 hover:text-[#DA4848] hover:bg-[#DA4848]/10 rounded-xl">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="grid grid-cols-2 gap-1.5 text-[9px] font-black text-gray-600 uppercase tracking-widest px-1 mb-1">
                                        <span>Variable</span><span>Value</span>
                                    </div>
                                    {activeLocal.vars.map(v => (
                                        <div key={v.id} className="flex items-center gap-1.5 group">
                                            <input value={v.key} onChange={e => updateVar(activeLocal.id, v.id, 'key', e.target.value)} placeholder="VARIABLE" className="flex-1 bg-transparent border border-[#DA4848]/30 focus:border-[#76D2DB]/60 rounded-lg px-2.5 py-1.5 text-xs text-[#76D2DB] placeholder-gray-700 focus:outline-none font-mono" />
                                            <input value={v.val} onChange={e => updateVar(activeLocal.id, v.id, 'val', e.target.value)} placeholder="value" className="flex-1 bg-transparent border border-[#DA4848]/30 focus:border-[#76D2DB]/60 rounded-lg px-2.5 py-1.5 text-xs text-[#F7F6E5] placeholder-gray-700 focus:outline-none font-mono" />
                                            <button onClick={() => removeVar(activeLocal.id, v.id)} className="p-1 text-gray-600 hover:text-[#DA4848] opacity-0 group-hover:opacity-100 -opacity">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    ))}
                                    <button onClick={() => addVar(activeLocal.id)} className="flex items-center gap-1.5 text-[11px] font-black uppercase text-gray-600 hover:text-[#76D2DB] mt-1 pl-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v14M5 12h14" /></svg>
                                        Add variable
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-700 text-sm">
                                <svg className="w-10 h-10 mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                <span className="font-bold tracking-widest uppercase text-[10px]">Select or create an environment</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="p-4 border-t border-[#DA4848]/20 flex gap-3">
                    <button onClick={onClose} className="flex-1 px-4 py-3 bg-[#DA4848]/5 hover:bg-[#DA4848]/10 text-[#DA4848] rounded-xl text-xs font-black uppercase tracking-widest border border-[#DA4848]/20">Cancel</button>
                    <button onClick={() => { onSave(localEnvs); onClose(); }} className="flex-1 px-4 py-3 bg-linear-to-r from-[#76D2DB] to-[#F7F6E5]/80 hover:from-[#76D2DB]/90 hover:to-[#F7F6E5] text-[#DA4848] rounded-xl text-xs font-black uppercase tracking-widest">Save Changes</button>
                </div>
            </div>
        </div>
    );
}

// ─── Import Modal ────────────────────────────────────────────────────────────
function ImportModal({ onClose, onImport }) {
    const [raw, setRaw] = useState('');
    const [error, setError] = useState('');

    const handleImport = () => {
        const text = raw.trim();
        if (!text) return;
        let req = parseCurl(text);
        if (!req) req = parseUrl(text);
        if (req) {
            onImport(req);
            onClose();
        } else {
            setError('Could not parse cURL or URL. Please check the format.');
        }
    };

    return (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
            <div className="relative bg-[#36064D]/60 backdrop-blur-xl border border-[#DA4848]/40 rounded-2xl w-full max-w-xl flex flex-col overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-[#DA4848]/20 bg-[#09090b]">
                    <h3 className="text-[#F7F6E5] font-black tracking-widest uppercase text-sm">Import Request</h3>
                    <button onClick={onClose} className="p-1 text-gray-500 hover:text-[#76D2DB] rounded-lg hover:bg-[#76D2DB]/10">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-4 space-y-4">
                    <p className="text-[10px] uppercase font-black tracking-widest text-gray-600">Paste a cURL command or a plain URL to quickly create a request.</p>
                    <textarea
                        value={raw}
                        onChange={e => { setRaw(e.target.value); setError(''); }}
                        placeholder="curl -X POST https://api.example.com -d '{...}'"
                        rows={6}
                        className="w-full bg-transparent border border-[#DA4848]/20 focus:border-[#76D2DB]/40 rounded-xl px-3 py-2 text-xs text-[#F7F6E5] placeholder-gray-700 font-mono focus:outline-none resize-none"
                        spellCheck={false}
                    />
                    {error && <p className="text-[#DA4848] text-[10px] font-black uppercase tracking-widest">{error}</p>}
                </div>
                <div className="p-4 border-t border-[#DA4848]/20 bg-[#09090b] flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-[#F7F6E5]">Cancel</button>
                    <button onClick={handleImport} disabled={!raw.trim()} className="px-6 py-2 bg-[#76D2DB] hover:bg-[#76D2DB]/90 text-[#DA4848] rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30">
                        Import
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function HttpClientPage() {
    const router = typeof window !== 'undefined' ? null : null; // handled via window.location
    const [user, setUser] = useState(null);
    const [userLoading, setUserLoading] = useState(true);
    const [collections, setCollections] = useState([]);
    const [history, setHistory] = useState([]);
    const [environments, setEnvironments] = useState([]);
    const [activeEnvId, setActiveEnvId] = useState(null);
    const [activeRequest, setActiveRequest] = useState(() => newRequest());
    const [response, setResponse] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const [activeTab, setActiveTab] = useState('params');
    const [responseTab, setResponseTab] = useState('body');
    const [showEnvModal, setShowEnvModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        // Default to OPEN on desktop, CLOSED on mobile
        if (window.innerWidth >= 768) setSidebarOpen(true);
    }, []);
    const [expandedFolders, setExpandedFolders] = useState({});
    const [renamingFolder, setRenamingFolder] = useState(null);
    const [renamingRequest, setRenamingRequest] = useState(null);
    const [showSaveMenu, setShowSaveMenu] = useState(false);
    const [sidebarTab, setSidebarTab] = useState('collections'); // 'collections' | 'history' | 'endpoints'
    const saveMenuRef = useRef(null);

    // Fetch logged-in user and data
    useEffect(() => {
        fetch('/api/auth/me')
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                setUser(data?.user || null);
                setUserLoading(false);

                if (data?.user) {
                    // Fetch HTTP client data from DB
                    fetch('/api/http-client')
                        .then(r => r.ok ? r.json() : null)
                        .then(hdata => {
                            if (hdata?.data) {
                                if (hdata.data.collections) setCollections(hdata.data.collections);
                                if (hdata.data.environments) setEnvironments(hdata.data.environments);
                                if (hdata.data.activeEnvId) setActiveEnvId(hdata.data.activeEnvId);
                                if (hdata.data.history) setHistory(hdata.data.history);
                            }
                        })
                        .catch(err => console.error('Error fetching http client data:', err));
                }
            })
            .catch(() => setUserLoading(false));
    }, []);

    const isLoggedIn = !!user;

    // Persist to Database on changes (debounced)
    useEffect(() => {
        if (!isLoggedIn || userLoading) return;

        const timer = setTimeout(() => {
            fetch('/api/http-client', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ collections, environments, activeEnvId, history }),
            }).catch(err => console.error('Error saving http client data:', err));
        }, 1000); // 1s debounce

        return () => clearTimeout(timer);
    }, [collections, environments, activeEnvId, history, isLoggedIn, userLoading]);

    // Close save menu on outside click
    useEffect(() => {
        const handler = (e) => { if (saveMenuRef.current && !saveMenuRef.current.contains(e.target)) setShowSaveMenu(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const activeEnv = environments.find(e => e.id === activeEnvId);
    const envVars = activeEnv?.vars || [];

    // ── Send Request ──
    const handleSend = useCallback(async () => {
        const req = activeRequest;
        const resolvedUrl = interpolateEnv(req.url, envVars);
        if (!resolvedUrl) return;

        setIsSending(true);
        setResponse(null);

        try {
            // Build query string from enabled params
            const enabledParams = req.params.filter(p => p.enabled && p.key);
            const qs = enabledParams.length ? '?' + enabledParams.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(interpolateEnv(p.val, envVars))}`).join('&') : '';

            // Build headers
            const headers = {};
            req.headers.filter(h => h.enabled && h.key).forEach(h => {
                headers[h.key] = interpolateEnv(h.val, envVars);
            });

            // Build body
            let body;
            if (req.method !== 'GET' && req.method !== 'HEAD') {
                if (req.bodyType === 'json' && req.body.trim()) {
                    headers['Content-Type'] = 'application/json';
                    body = req.body;
                } else if (req.bodyType === 'form') {
                    const params = new URLSearchParams();
                    req.formData.filter(r => r.enabled && r.key).forEach(r => params.append(r.key, r.val));
                    body = params.toString();
                    headers['Content-Type'] = 'application/x-www-form-urlencoded';
                }
            }

            const proxyRes = await fetch('/api/http-client/proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: resolvedUrl + qs,
                    method: req.method,
                    headers,
                    body
                })
            });

            const data = await proxyRes.json();
            if (data.error) throw new Error(data.error);

            const contentType = data.headers['content-type'] || data.headers['Content-Type'] || '';
            const isJson = contentType.toLowerCase().includes('json');

            const responseData = {
                status: data.status,
                statusText: data.statusText,
                time: data.time,
                size: new Blob([data.body]).size,
                body: isJson ? prettyJson(data.body) : data.body,
                headers: data.headers,
                isJson,
                ok: data.ok,
            };
            setResponse(responseData);
            setResponseTab('body');

            // Add to history
            setHistory(prev => [{
                id: uid(),
                method: req.method,
                url: resolvedUrl + qs,
                status: data.status,
                time: data.time,
                ts: Date.now(),
            }, ...prev].slice(0, 30));

        } catch (err) {
            setResponse({ error: err.message || 'Network Error', status: null });
        } finally {
            setIsSending(false);
        }
    }, [activeRequest, envVars]);

    // Keyboard shortcut: Ctrl+Enter to send
    useEffect(() => {
        const handler = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleSend(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handleSend]);

    const updateReq = (patch) => setActiveRequest(prev => ({ ...prev, ...patch }));

    // ── Collections ──
    const addFolder = () => {
        const f = { id: uid(), name: 'New Folder', requests: [] };
        setCollections(prev => [...prev, f]);
        setExpandedFolders(prev => ({ ...prev, [f.id]: true }));
        setRenamingFolder(f.id);
    };

    const deleteFolder = (fid) => setCollections(prev => prev.filter(f => f.id !== fid));

    const renameFolder = (fid, name) => {
        setCollections(prev => prev.map(f => f.id === fid ? { ...f, name } : f));
        setRenamingFolder(null);
    };

    const addRequestToFolder = (fid) => {
        const req = newRequest();
        setCollections(prev => prev.map(f => f.id === fid ? { ...f, requests: [...f.requests, req] } : f));
        setActiveRequest(req);
        setExpandedFolders(prev => ({ ...prev, [fid]: true }));
        setRenamingRequest(req.id);
    };

    const deleteRequestFromFolder = (fid, rid) => {
        setCollections(prev => prev.map(f => f.id === fid ? { ...f, requests: f.requests.filter(r => r.id !== rid) } : f));
    };

    const renameRequest = (fid, rid, name) => {
        setCollections(prev => prev.map(f => f.id === fid ? { ...f, requests: f.requests.map(r => r.id === rid ? { ...r, name } : r) } : f));
        setRenamingRequest(null);
    };

    const openRequest = (req) => {
        setActiveRequest({ ...req });
        if (window.innerWidth < 768) setSidebarOpen(false);
    };

    const saveCurrentToFolder = (fid) => {
        setCollections(prev => prev.map(f => f.id === fid ? {
            ...f,
            requests: [...f.requests.filter(r => r.id !== activeRequest.id), { ...activeRequest }]
        } : f));
        setShowSaveMenu(false);
    };

    // ─── Sidebar ─────────────────────────────────────────────────────────────
    const SidebarContent = () => (
        <div className="flex flex-col h-full text-sm">
            {/* Env switcher */}
            <div className="p-3 border-b border-[#DA4848]/20">
                <div className="flex items-center gap-2">
                    <select
                        value={activeEnvId || ''}
                        onChange={e => setActiveEnvId(e.target.value || null)}
                        className="flex-1 bg-[#DA4848]/30 border border-[#DA4848]/20 rounded-lg px-2.5 py-1.5 text-xs text-[#F7F6E5] font-bold focus:outline-none focus:border-[#76D2DB]/30 appearance-none truncate"
                    >
                        <option value="">No Environment</option>
                        {environments.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                    <button
                        onClick={() => setShowEnvModal(true)}
                        title="Manage Environments"
                        className="p-1.5 text-gray-600 hover:text-[#76D2DB] hover:bg-[#76D2DB]/10 rounded-lg shrink-0"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" /></svg>
                    </button>
                </div>
            </div>

            {/* Tabs: Collections / History / Endpoints */}
            <div className="flex border-b border-[#DA4848]/20">
                <button onClick={() => setSidebarTab('collections')} className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest ${sidebarTab === 'collections' ? 'text-[#76D2DB] border-b-2 border-[#76D2DB] bg-[#76D2DB]/5' : 'text-gray-600 hover:text-gray-400'}`}>Collections</button>
                <button onClick={() => setSidebarTab('history')} className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest ${sidebarTab === 'history' ? 'text-[#76D2DB] border-b-2 border-[#76D2DB] bg-[#76D2DB]/5' : 'text-gray-600 hover:text-gray-400'}`}>History</button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {sidebarTab === 'collections' && (
                    <>
                        {collections.length === 0 && (
                            <div className="text-center py-8 text-gray-600 text-xs">
                                <svg className="w-8 h-8 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                                No collections yet
                            </div>
                        )}
                        {collections.map(folder => (
                            <div key={folder.id} className="mb-1">
                                <div className="flex items-center gap-1 px-1 py-1.5 rounded-lg hover:bg-white/4 group">
                                    <button onClick={() => setExpandedFolders(prev => ({ ...prev, [folder.id]: !prev[folder.id] }))} className="shrink-0 text-gray-600 hover:text-[#76D2DB]">
                                        <svg className={`w-3.5 h-3.5 ${expandedFolders[folder.id] ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                    <svg className="w-3.5 h-3.5 text-[#76D2DB]/60 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                                    {renamingFolder === folder.id ? (
                                        <input autoFocus defaultValue={folder.name} onBlur={e => renameFolder(folder.id, e.target.value)} onKeyDown={e => e.key === 'Enter' && renameFolder(folder.id, e.target.value)} className="flex-1 bg-transparent focus:bg-[#36064D]/10 rounded-lg px-2 py-0.5 text-xs text-[#F7F6E5] focus:outline-none" />
                                    ) : (
                                        <span className="flex-1 text-[11px] font-black uppercase tracking-tight text-[#F7F6E5] group-hover:text-[#76D2DB] truncate cursor-pointer" onDoubleClick={() => setRenamingFolder(folder.id)}>{folder.name}</span>
                                    )}
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 -opacity">
                                        <button onClick={() => addRequestToFolder(folder.id)} title="Add Request" className="p-0.5 text-gray-500 hover:text-blue-400">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14M5 12h14" /></svg>
                                        </button>
                                        <button onClick={() => setRenamingFolder(folder.id)} title="Rename" className="p-0.5 text-gray-500 hover:text-amber-400">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        </button>
                                        <button onClick={() => deleteFolder(folder.id)} title="Delete" className="p-0.5 text-gray-500 hover:text-red-400">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>
                                {expandedFolders[folder.id] && (
                                    <div className="ml-5 space-y-0.5 mt-0.5">
                                        {folder.requests.map(req => (
                                            <div key={req.id} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer group ${activeRequest.id === req.id ? 'bg-blue-500/15 border border-blue-500/20' : 'hover:bg-white/4'}`} onClick={() => openRequest(req)}>
                                                <span className={`text-[10px] font-bold shrink-0 ${METHOD_COLORS[req.method] || 'text-gray-400'}`}>{req.method.slice(0, 3)}</span>
                                                {renamingRequest === req.id ? (
                                                    <input autoFocus defaultValue={req.name} onBlur={e => renameRequest(folder.id, req.id, e.target.value)} onKeyDown={e => e.key === 'Enter' && renameRequest(folder.id, req.id, e.target.value)} className="flex-1 bg-black/30 border border-blue-500/40 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none" />
                                                ) : (
                                                    <span className="flex-1 text-xs text-gray-400 truncate">{req.name}</span>
                                                )}
                                                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 -opacity">
                                                    <button onClick={(e) => { e.stopPropagation(); setRenamingRequest(req.id); }} className="p-0.5 text-gray-600 hover:text-amber-400">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); deleteRequestFromFolder(folder.id, req.id); }} className="p-0.5 text-gray-600 hover:text-red-400">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        <button onClick={addFolder} className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-gray-600 hover:text-[#76D2DB] hover:bg-[#76D2DB]/5 text-[10px] font-black uppercase tracking-widest mt-2">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v14M5 12h14" /></svg>
                            New Collection
                        </button>
                    </>
                )}

                {sidebarTab === 'history' && (
                    <>
                        {history.length === 0 && <div className="text-center py-8 text-gray-700 text-[10px] font-black uppercase tracking-widest opacity-30">No history yet</div>}
                        {history.map(h => (
                            <button key={h.id} onClick={() => { setActiveRequest(prev => ({ ...prev, method: h.method, url: h.url })); }} className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-[#76D2DB]/5 text-left group active:scale-[0.98]">
                                <span className={`text-[9px] font-black shrink-0 w-8 ${METHOD_COLORS[h.method] || 'text-gray-600'}`}>{h.method.slice(0, 3)}</span>
                                <span className="flex-1 text-[11px] text-gray-500 truncate font-mono group-hover:text-gray-300">{h.url}</span>
                                <span className={`text-[9px] font-black ${STATUS_COLOR(h.status)}`}>{h.status}</span>
                            </button>
                        ))}
                        {history.length > 0 && (
                            <button onClick={() => setHistory([])} className="w-full text-center text-[9px] font-black uppercase tracking-widest text-gray-700 hover:text-[#DA4848] py-3 mt-2 border-t border-[#76D2DB]/5">Clear History</button>
                        )}
                    </>
                )}
            </div>
        </div>
    );

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col gap-6 text-[#F7F6E5] min-h-screen">
            {/* ── Page Header ── */}
            <HeroHeader
                colorTheme="cyberpunk"
                title="HTTP"
                badge="Client"
                description="Send requests, inspect responses, manage collections and environments — your high-performance Cyberpunk API workspace."
                breadcrumbs={[
                    { label: 'Dashboard', href: '/', },
                    { label: 'HTTP Client' }
                ]}

            />

            {userLoading ? (
                <div className="py-24">
                    <LoadingState message="Connecting to neural interface..." colorTheme="cyberpunk" />
                </div>
            ) : (
                <>
                    {/* ── Toolbar (controls above the workspace) ── */}
                    <div className="flex flex-wrap items-center gap-3 px-4">
                {isLoggedIn && (
                    <button
                        onClick={() => setSidebarOpen(o => !o)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${sidebarOpen ? 'bg-[#76D2DB]/10 text-[#76D2DB] border-[#76D2DB]/30 ' : 'bg-[#36064D]/40 text-gray-500 border-[#DA4848]/20 hover:text-[#76D2DB] hover:bg-[#76D2DB]/5 hover:border-[#76D2DB]/30'}`}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        COLLECTIONS
                    </button>
                )}
                <button
                    onClick={() => { setActiveRequest(newRequest()); setResponse(null); }}
                    className="flex items-center gap-2 px-3 py-2 bg-transparent hover:bg-[#DA4848]/40 border border-[#DA4848]/20 rounded-xl text-[10px] text-gray-500 hover:text-[#76D2DB] font-black uppercase tracking-widest"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v14M5 12h14" /></svg>
                    NEW REQUEST
                </button>
                <button
                    onClick={() => setShowImportModal(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-transparent hover:bg-[#76D2DB]/20 border border-[#76D2DB]/20 rounded-xl text-[10px] text-gray-500 hover:text-[#76D2DB] font-black uppercase tracking-widest"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    IMPORT
                </button>
                {isLoggedIn && (
                    <div className="relative" ref={saveMenuRef}>
                        <button
                            onClick={() => setShowSaveMenu(p => !p)}
                            className="flex items-center gap-2 px-3 py-2 bg-transparent hover:bg-[#DA4848]/20 border border-[#DA4848]/20 rounded-xl text-[10px] text-gray-500 hover:text-[#DA4848] font-black uppercase tracking-widest"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                            SAVE
                        </button>
                        {showSaveMenu && (
                            <div className="absolute left-0 top-full mt-2 w-52 bg-[#36064D]/95 backdrop-blur-2xl border border-[#DA4848]/20 rounded-2xl z-200 overflow-hidden py-1">
                                {collections.length === 0 ? (
                                    <div className="px-3 py-3 text-[10px] font-black uppercase text-gray-700 text-center">No collections yet</div>
                                ) : (
                                    collections.map(f => (
                                        <button key={f.id} onClick={() => saveCurrentToFolder(f.id)} className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold uppercase text-gray-400 hover:bg-[#DA4848]/10 hover:text-[#DA4848] text-left">
                                            <svg className="w-4 h-4 text-[#F7F6E5]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                                            {f.name}
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}
                <div className="flex items-center gap-2 ml-auto">
                    {isLoggedIn && (
                        <>
                            <select
                                value={activeEnvId || ''}
                                onChange={e => setActiveEnvId(e.target.value || null)}
                                className="bg-[#DA4848]/40 border border-[#76D2DB]/20 rounded-xl px-3 py-2 text-[10px] font-black uppercase text-[#F7F6E5] focus:outline-none focus:border-[#76D2DB]/50 appearance-none max-w-40"
                            >
                                <option value="">No Environment</option>
                                {environments.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                            <button
                                onClick={() => setShowEnvModal(true)}
                                title="Manage Environments"
                                className="p-2 text-gray-600 hover:text-[#76D2DB] hover:bg-[#76D2DB]/10 rounded-xl border border-[#76D2DB]/20"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" /></svg>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* ── HTTP Client workspace ── */}
            <div className="max-w-[1700px] mx-auto w-full px-4 md:px-8 pb-12 mt-6">
                <div className={(isLoggedIn && sidebarOpen) ? "grid md:grid-cols-[300px_1fr] gap-8 items-start" : "flex flex-col gap-8 items-start w-full"}>

                    {/* Sidebar */}
                    {isLoggedIn && sidebarOpen && (
                        <div className="hidden md:flex flex-col bg-[#36064D]/60 backdrop-blur-md border border-[#DA4848]/30 rounded-3xl overflow-hidden h-fit ring-1 ring-white/5">
                            <SidebarContent />
                        </div>
                    )}

                    {/* Mobile Sidebar Overlay */}
                    {isLoggedIn && sidebarOpen && (
                        <div className="md:hidden fixed inset-0 z-50">
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
                            <div className="absolute inset-y-0 left-0 w-72 bg-[#36064D]/90 backdrop-blur-2xl border-r border-[#DA4848]/30 flex flex-col">
                                <SidebarContent />
                            </div>
                        </div>
                    )}

                    {/* Main panel */}
                    <div className="min-w-0 flex flex-col gap-6 w-full">
                        {/* Request bar */}
                        <div className="bg-[#36064D]/30 backdrop-blur-md border border-[#DA4848]/40 rounded-2xl p-3 md:p-4 flex items-center gap-2 ring-1 ring-white/5">
                            <select
                                value={activeRequest.method}
                                onChange={e => updateReq({ method: e.target.value })}
                                className={`px-3 md:px-4 py-2 md:py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest border cursor-pointer focus:outline-none ${METHOD_BG[activeRequest.method]}`}
                            >
                                {Object.keys(METHOD_BG).map(m => (
                                    <option key={m} value={m} className="bg-[#09090b] text-[#F7F6E5] uppercase font-black">{m}</option>
                                ))}
                            </select>
                            <div className="flex-1 relative group">
                                <input
                                    value={activeRequest.url}
                                    onChange={e => updateReq({ url: e.target.value })}
                                    onKeyDown={e => e.key === 'Enter' && (e.ctrlKey || e.metaKey) && handleSend()}
                                    placeholder="https://api.example.com/endpoint"
                                    className="w-full bg-transparent border border-[#DA4848]/20 focus:border-[#76D2DB]/50 rounded-xl px-4 py-2 md:py-3 text-[11px] md:text-sm text-[#F7F6E5] placeholder-gray-700 font-mono focus:outline-none"
                                />
                            </div>
                            <button
                                onClick={handleSend}
                                disabled={isSending || !activeRequest.url}
                                className={`flex items-center gap-2 px-6 md:px-10 py-2 md:py-3 bg-linear-to-r from-[#76D2DB] to-[#76D2DB]/80 hover:from-[#76D2DB] hover:to-[#F7F6E5] text-black rounded-xl text-[10px] md:text-xs font-black uppercase tracking-[0.2em] hover: disabled:opacity-30 disabled:shadow-none group overflow-hidden relative`}
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    {isSending ? (
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    ) : (
                                        <svg className="w-4 h-4 group-" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    )}
                                    <span className="hidden md:inline">{isSending ? 'Sending...' : 'Send'}</span>
                                </span>
                                <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full" />
                            </button>
                        </div>

                        {/* Request tabs */}
                        <div className="bg-[#36064D]/25 backdrop-blur-md border border-[#DA4848]/30 rounded-2xl overflow-hidden ring-1 ring-white/5">
                            <div className="border-b border-[#DA4848]/20 px-4 flex items-center gap-0.5 overflow-x-auto bg-[#36064D]/5 backdrop-blur-sm">
                                {['params', 'headers', 'body'].map(tab => {
                                    const counts = {
                                        params: activeRequest.params.filter(p => p.enabled && p.key).length,
                                        headers: activeRequest.headers.filter(h => h.enabled && h.key).length,
                                        body: activeRequest.bodyType !== 'none' ? 1 : 0,
                                    };
                                    return (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 whitespace-nowrap ${activeTab === tab ? 'text-[#76D2DB] border-[#76D2DB] bg-[#76D2DB]/5' : 'text-gray-600 border-transparent hover:text-gray-400'}`}
                                        >
                                            {tab}
                                            {counts[tab] > 0 && (
                                                <span className="bg-[#76D2DB]/20 text-[#76D2DB] text-[9px] font-black px-1.5 py-0.5 rounded">
                                                    {counts[tab]}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="p-5 md:p-8">
                                {activeTab === 'params' && <KVTable rows={activeRequest.params} onChange={rows => updateReq({ params: rows })} placeholder={['PARAMETER', 'VALUE']} />}
                                {activeTab === 'headers' && <KVTable rows={activeRequest.headers} onChange={rows => updateReq({ headers: rows })} placeholder={['HEADER', 'VALUE']} />}
                                {activeTab === 'body' && (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {['none', 'json', 'form'].map(t => (
                                                <label key={t} className={`flex items-center gap-3 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer border ${activeRequest.bodyType === t ? 'bg-[#76D2DB]/10 text-[#76D2DB] border-[#76D2DB]/40 ' : 'text-gray-600 border-[#DA4848]/20 hover:text-gray-400'}`}>
                                                    <input type="radio" value={t} checked={activeRequest.bodyType === t} onChange={() => updateReq({ bodyType: t })} className="sr-only" />
                                                    {t === 'none' ? 'None' : t === 'json' ? 'JSON' : 'Form Data'}
                                                </label>
                                            ))}
                                        </div>
                                        {activeRequest.bodyType === 'json' && (
                                            <textarea
                                                value={activeRequest.body}
                                                onChange={e => updateReq({ body: e.target.value })}
                                                placeholder={'{\n  "key": "value"\n}'}
                                                rows={12}
                                                className="w-full bg-transparent border border-[#DA4848]/30 focus:border-[#76D2DB]/60 rounded-xl px-4 py-4 text-xs text-[#F7F6E5] placeholder-gray-800 font-mono focus:outline-none resize-none"
                                                spellCheck={false}
                                            />
                                        )}
                                        {activeRequest.bodyType === 'form' && <KVTable rows={activeRequest.formData} onChange={rows => updateReq({ formData: rows })} placeholder={['FIELD', 'VALUE']} />}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Response card */}
                        <div className="bg-[#36064D]/30 backdrop-blur-md border border-[#DA4848]/30 rounded-3xl overflow-hidden min-h-[450px] ring-1 ring-white/5">
                            {!response && !isSending && (
                                <div className="flex flex-col items-center justify-center py-24 text-gray-700">
                                    <svg className="w-24 h-24 mb-6 opacity-5 text-[#76D2DB]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                    <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-30">Uplink Stable • Ready for Engage</p>
                                    <div className="mt-8 flex items-center gap-3 px-5 py-2.5 bg-[#76D2DB]/5 border border-[#DA4848]/20 rounded-2xl">
                                        <span className="text-[9px] font-black text-gray-700 tracking-widest">PRESS CTRL+ENTER TO ENGAGE</span>
                                    </div>
                                </div>
                            )}
                            {isSending && (
                                <div className="flex flex-col items-center justify-center py-24">
                                    <LoadingState message="Intercepting Data Stream..." colorTheme="cyberpunk" />
                                </div>
                            )}
                            {response && !isSending && (
                                <div className="">
                                    <div className="border-b border-[#DA4848]/20 px-6 py-5 flex items-center gap-4 bg-white/5">
                                        {response.error ? (
                                            <span className="flex items-center gap-3 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] bg-[#DA4848]/20 text-[#DA4848] border border-[#DA4848]/40">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                {response.error}
                                            </span>
                                        ) : (
                                            <>
                                                <span className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${STATUS_BG(response.status)} ${STATUS_COLOR(response.status)}`}>
                                                    {response.status} {response.statusText}
                                                </span>
                                                <div className="h-5 w-[1px] bg-[#76D2DB]/10 mx-2" />
                                                <div className="flex items-center gap-6">
                                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#76D2DB]/50">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        {response.time}ms
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#76D2DB]/50">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2" /></svg>
                                                        {response.size < 1024 ? `${response.size} B` : `${(response.size / 1024).toFixed(1)} KB`}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                        <div className="ml-auto flex gap-2 p-1.5 bg-black/20 rounded-2xl border border-white/5">
                                            {['body', 'headers'].map(t => (
                                                <button 
                                                    key={t} 
                                                    onClick={() => setResponseTab(t)} 
                                                    className={`px-6 py-2.5 text-[9px] font-black uppercase tracking-[0.2em] rounded-xl ${responseTab === t ? 'bg-[#76D2DB]/20 text-[#76D2DB] border border-[#76D2DB]/40 ' : 'text-gray-600 hover:text-gray-400'}`}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-6 md:p-10 overflow-auto max-h-[45rem] bg-transparent custom-scrollbar">
                                        {responseTab === 'body' && !response.error && (
                                            response.isJson ? <JsonView data={response.body} /> : (
                                                <pre className="text-sm font-mono text-gray-400 whitespace-pre-wrap break-all leading-relaxed bg-black/20 p-6 rounded-2xl border border-white/5">{response.body}</pre>
                                            )
                                        )}
                                        {responseTab === 'headers' && !response.error && (
                                            <div className="space-y-4">
                                                {Object.entries(response.headers).map(([k, v]) => (
                                                    <div key={k} className="flex gap-8 text-[11px] font-mono border-b border-white/5 pb-4 last:border-0 group">
                                                        <span className="text-[#76D2DB]/60 shrink-0 w-64 font-black uppercase tracking-tight group-hover:text-[#76D2DB]">{k}</span>
                                                        <span className="text-gray-500 break-all select-all">{v}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            </div> {/* End Response Card */}
                        </div> {/* End Main panel */}
                    </div> {/* End Grid */}
                </div> {/* End Workspace Container */}
                </>
            )}

            {showEnvModal && (
                <EnvModal
                    envs={environments}
                    activeEnvId={activeEnvId}
                    onClose={() => setShowEnvModal(false)}
                    onSave={setEnvironments}
                    onSetActive={setActiveEnvId}
                />
            )}

            {showImportModal && (
                <ImportModal
                    onClose={() => setShowImportModal(false)}
                    onImport={(req) => { setActiveRequest(req); setShowImportModal(false); }}
                />
            )}
        </div>
    );
}
