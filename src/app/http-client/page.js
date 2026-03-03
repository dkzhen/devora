'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { apiCategories } from '@/lib/api-endpoints';// ─── helpers ────────────────────────────────────────────────────────────────
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
    GET: 'text-emerald-400',
    POST: 'text-blue-400',
    PUT: 'text-amber-400',
    PATCH: 'text-purple-400',
    DELETE: 'text-red-400',
    HEAD: 'text-indigo-400',
    OPTIONS: 'text-pink-400',
};

const METHOD_BG = {
    GET: 'bg-emerald-500/15 border-emerald-500/30',
    POST: 'bg-blue-500/15 border-blue-500/30',
    PUT: 'bg-amber-500/15 border-amber-500/30',
    PATCH: 'bg-purple-500/15 border-purple-500/30',
    DELETE: 'bg-red-500/15 border-red-500/30',
    HEAD: 'bg-indigo-500/15 border-indigo-500/30',
    OPTIONS: 'bg-pink-500/15 border-pink-500/30',
};

const STATUS_COLOR = (s) => {
    if (!s) return 'text-gray-400';
    if (s < 300) return 'text-emerald-400';
    if (s < 400) return 'text-blue-400';
    if (s < 500) return 'text-amber-400';
    return 'text-red-400';
};

const STATUS_BG = (s) => {
    if (!s) return 'bg-gray-500/20 border-gray-500/30';
    if (s < 300) return 'bg-emerald-500/15 border-emerald-500/30';
    if (s < 400) return 'bg-blue-500/15 border-blue-500/30';
    if (s < 500) return 'bg-amber-500/15 border-amber-500/30';
    return 'bg-red-500/15 border-red-500/30';
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
                        className="w-3.5 h-3.5 accent-blue-500 shrink-0"
                    />
                    <input
                        value={row.key}
                        onChange={e => update(row.id, 'key', e.target.value)}
                        placeholder={placeholder[0]}
                        className="flex-1 min-w-0 bg-black/20 border border-white/8 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500/40 font-mono"
                    />
                    <input
                        value={row.val}
                        onChange={e => update(row.id, 'val', e.target.value)}
                        placeholder={placeholder[1]}
                        className="flex-1 min-w-0 bg-black/20 border border-white/8 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500/40 font-mono"
                    />
                    <button
                        onClick={() => remove(row.id)}
                        className="p-1 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            ))}
            <button onClick={add} className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-blue-400 transition-colors mt-1 pl-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14M5 12h14" />
                </svg>
                Add row
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
                            <span className="text-blue-300">{key}</span>
                            <span className="text-gray-500">{colon}</span>
                            <span className={isStr ? 'text-emerald-300' : isNum ? 'text-purple-300' : isBool || isNull ? 'text-amber-300' : 'text-gray-200'}>
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
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-[#0b1022] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                <div className="flex items-center justify-between p-5 border-b border-white/5">
                    <h3 className="text-base font-bold text-white">Manage Environments</h3>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
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
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between group ${selectedEnv === env.id ? 'bg-blue-500/15 text-blue-300 border border-blue-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
                            >
                                <span className="truncate">{env.name}</span>
                                {activeEnvId === env.id && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 ml-1" />}
                            </button>
                        ))}
                        <button onClick={addEnv} className="w-full flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-blue-400 transition-colors px-3 py-2">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14M5 12h14" /></svg>
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
                                        className="flex-1 bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/40"
                                    />
                                    <button
                                        onClick={() => onSetActive(activeLocal.id === activeEnvId ? null : activeLocal.id)}
                                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${activeLocal.id === activeEnvId ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-white/5 text-gray-400 border-white/10 hover:text-emerald-300'}`}
                                    >
                                        {activeLocal.id === activeEnvId ? '✓ Active' : 'Set Active'}
                                    </button>
                                    <button onClick={() => deleteEnv(activeLocal.id)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="grid grid-cols-2 gap-1.5 text-[10px] text-gray-600 uppercase tracking-widest px-1 mb-1">
                                        <span>Variable</span><span>Value</span>
                                    </div>
                                    {activeLocal.vars.map(v => (
                                        <div key={v.id} className="flex items-center gap-1.5 group">
                                            <input value={v.key} onChange={e => updateVar(activeLocal.id, v.id, 'key', e.target.value)} placeholder="VARIABLE" className="flex-1 bg-black/20 border border-white/8 rounded-lg px-2.5 py-1.5 text-xs text-amber-300/80 placeholder-gray-600 focus:outline-none focus:border-blue-500/40 font-mono" />
                                            <input value={v.val} onChange={e => updateVar(activeLocal.id, v.id, 'val', e.target.value)} placeholder="value" className="flex-1 bg-black/20 border border-white/8 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500/40 font-mono" />
                                            <button onClick={() => removeVar(activeLocal.id, v.id)} className="p-1 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    ))}
                                    <button onClick={() => addVar(activeLocal.id)} className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-blue-400 transition-colors mt-1 pl-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14M5 12h14" /></svg>
                                        Add variable
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-600 text-sm">
                                <svg className="w-10 h-10 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                Select or create an environment
                            </div>
                        )}
                    </div>
                </div>
                <div className="p-4 border-t border-white/5 flex gap-3">
                    <button onClick={onClose} className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/8 text-gray-300 rounded-xl text-sm font-semibold border border-white/10 transition-colors">Cancel</button>
                    <button onClick={() => { onSave(localEnvs); onClose(); }} className="flex-1 px-4 py-2 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-700/25 border border-white/10 transition-all">Save Changes</button>
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
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-[#0d1625] border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#0a1020]">
                    <h3 className="text-white font-bold tracking-tight">Import Request</h3>
                    <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-300 rounded-lg hover:bg-white/5 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-4 space-y-4">
                    <p className="text-xs text-gray-400">Paste a cURL command or a plain URL to quickly create a request.</p>
                    <textarea
                        value={raw}
                        onChange={e => { setRaw(e.target.value); setError(''); }}
                        placeholder="curl -X POST https://api.example.com -d '{...}'"
                        rows={6}
                        className="w-full bg-black/20 border border-white/10 focus:border-blue-500/40 rounded-xl px-3 py-2 text-xs text-gray-200 placeholder-gray-600 font-mono focus:outline-none resize-none transition-colors"
                        spellCheck={false}
                    />
                    {error && <p className="text-red-400 text-xs">{error}</p>}
                </div>
                <div className="p-4 border-t border-white/5 bg-[#0a1020] flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors">Cancel</button>
                    <button onClick={handleImport} disabled={!raw.trim()} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-700/25 border border-white/10 transition-colors disabled:opacity-50">
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
                    const fd = new FormData();
                    req.formData.filter(r => r.enabled && r.key).forEach(r => fd.append(r.key, r.val));
                    body = fd;
                }
            }

            const start = performance.now();
            const res = await fetch(resolvedUrl + qs, { method: req.method, headers, body });
            const elapsed = Math.round(performance.now() - start);

            const resText = await res.text();
            const contentType = res.headers.get('content-type') || '';
            const isJson = contentType.includes('json');
            const resHeaders = {};
            res.headers.forEach((val, key) => { resHeaders[key] = val; });

            const responseData = {
                status: res.status,
                statusText: res.statusText,
                time: elapsed,
                size: new Blob([resText]).size,
                body: isJson ? prettyJson(resText) : resText,
                headers: resHeaders,
                isJson,
                ok: res.ok,
            };
            setResponse(responseData);
            setResponseTab('body');

            // Add to history
            setHistory(prev => [{
                id: uid(),
                method: req.method,
                url: resolvedUrl + qs,
                status: res.status,
                time: elapsed,
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
            <div className="p-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <select
                        value={activeEnvId || ''}
                        onChange={e => setActiveEnvId(e.target.value || null)}
                        className="flex-1 bg-black/30 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-blue-500/30 appearance-none truncate"
                    >
                        <option value="">No Environment</option>
                        {environments.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                    <button
                        onClick={() => setShowEnvModal(true)}
                        title="Manage Environments"
                        className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors shrink-0"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" /></svg>
                    </button>
                </div>
            </div>

            {/* Tabs: Collections / History / Endpoints */}
            <div className="flex border-b border-white/5">
                <button onClick={() => setSidebarTab('collections')} className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${sidebarTab === 'collections' ? 'text-blue-300 border-b-2 border-blue-500 bg-blue-500/5' : 'text-gray-600 hover:text-gray-400'}`}>Collections</button>
                <button onClick={() => setSidebarTab('history')} className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${sidebarTab === 'history' ? 'text-blue-300 border-b-2 border-blue-500 bg-blue-500/5' : 'text-gray-600 hover:text-gray-400'}`}>History</button>
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
                                    <button onClick={() => setExpandedFolders(prev => ({ ...prev, [folder.id]: !prev[folder.id] }))} className="shrink-0 text-gray-500">
                                        <svg className={`w-3.5 h-3.5 transition-transform ${expandedFolders[folder.id] ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                    <svg className="w-3.5 h-3.5 text-amber-400/70 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                                    {renamingFolder === folder.id ? (
                                        <input autoFocus defaultValue={folder.name} onBlur={e => renameFolder(folder.id, e.target.value)} onKeyDown={e => e.key === 'Enter' && renameFolder(folder.id, e.target.value)} className="flex-1 bg-black/30 border border-blue-500/40 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none" />
                                    ) : (
                                        <span className="flex-1 text-xs text-gray-300 truncate cursor-pointer" onDoubleClick={() => setRenamingFolder(folder.id)}>{folder.name}</span>
                                    )}
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => addRequestToFolder(folder.id)} title="Add Request" className="p-0.5 text-gray-500 hover:text-blue-400 transition-colors">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14M5 12h14" /></svg>
                                        </button>
                                        <button onClick={() => setRenamingFolder(folder.id)} title="Rename" className="p-0.5 text-gray-500 hover:text-amber-400 transition-colors">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        </button>
                                        <button onClick={() => deleteFolder(folder.id)} title="Delete" className="p-0.5 text-gray-500 hover:text-red-400 transition-colors">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>
                                {expandedFolders[folder.id] && (
                                    <div className="ml-5 space-y-0.5 mt-0.5">
                                        {folder.requests.map(req => (
                                            <div key={req.id} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer group transition-colors ${activeRequest.id === req.id ? 'bg-blue-500/15 border border-blue-500/20' : 'hover:bg-white/4'}`} onClick={() => openRequest(req)}>
                                                <span className={`text-[10px] font-bold shrink-0 ${METHOD_COLORS[req.method] || 'text-gray-400'}`}>{req.method.slice(0, 3)}</span>
                                                {renamingRequest === req.id ? (
                                                    <input autoFocus defaultValue={req.name} onBlur={e => renameRequest(folder.id, req.id, e.target.value)} onKeyDown={e => e.key === 'Enter' && renameRequest(folder.id, req.id, e.target.value)} className="flex-1 bg-black/30 border border-blue-500/40 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none" />
                                                ) : (
                                                    <span className="flex-1 text-xs text-gray-400 truncate">{req.name}</span>
                                                )}
                                                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={(e) => { e.stopPropagation(); setRenamingRequest(req.id); }} className="p-0.5 text-gray-600 hover:text-amber-400 transition-colors">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); deleteRequestFromFolder(folder.id, req.id); }} className="p-0.5 text-gray-600 hover:text-red-400 transition-colors">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        <button onClick={addFolder} className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/4 transition-colors text-xs mt-2">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14M5 12h14" /></svg>
                            New Collection
                        </button>
                    </>
                )}

                {sidebarTab === 'history' && (
                    <>
                        {history.length === 0 && <div className="text-center py-8 text-gray-600 text-xs">No history yet</div>}
                        {history.map(h => (
                            <button key={h.id} onClick={() => { setActiveRequest(prev => ({ ...prev, method: h.method, url: h.url })); setSidebarTab('history'); }} className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white/4 transition-colors text-left group">
                                <span className={`text-[10px] font-bold shrink-0 ${METHOD_COLORS[h.method] || 'text-gray-400'}`}>{h.method.slice(0, 3)}</span>
                                <span className="flex-1 text-xs text-gray-400 truncate font-mono">{h.url}</span>
                                <span className={`text-[10px] font-bold ${STATUS_COLOR(h.status)}`}>{h.status}</span>
                            </button>
                        ))}
                        {history.length > 0 && (
                            <button onClick={() => setHistory([])} className="w-full text-center text-[11px] text-gray-600 hover:text-red-400 transition-colors py-2 mt-2">Clear History</button>
                        )}
                    </>
                )}


            </div>
        </div>
    );

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col gap-6">
            {/* ── Page Header ── */}
            <div className="relative overflow-hidden rounded-2xl">
                <div className="absolute inset-0 bg-linear-to-br from-gray-900 via-[#0d1625] to-gray-900" />
                <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-8 w-56 h-56 rounded-full bg-cyan-500/8 blur-3xl pointer-events-none" />
                <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.2) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

                <div className="relative z-10 p-5 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <nav className="flex text-xs text-blue-300/60 mb-4">
                            <a href="/" className="flex items-center gap-1 hover:text-blue-300 transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                Dashboard
                            </a>
                            <svg className="w-3 h-3 mx-2 text-blue-400/30 self-center" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            <span className="text-blue-200 font-semibold">HTTP Client</span>
                        </nav>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                            <span className="text-white">HTTP </span>
                            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 via-cyan-400 to-indigo-400">Client</span>
                        </h1>
                        <p className="text-gray-400 mt-2 text-sm max-w-xl">Send requests, inspect responses, manage collections and environments — your lightweight in-browser API workspace.</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <span className="font-semibold">Ctrl+Enter to Send</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Toolbar (controls above the workspace) ── */}
            <div className="flex flex-wrap items-center gap-3">
                {isLoggedIn && (
                    <button
                        onClick={() => setSidebarOpen(o => !o)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${sidebarOpen ? 'bg-blue-500/10 text-blue-300 border-blue-500/20' : 'bg-white/5 text-gray-400 border-white/10 hover:text-gray-200 hover:bg-white/8'}`}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                        Collections
                    </button>
                )}
                <button
                    onClick={() => { setActiveRequest(newRequest()); setResponse(null); }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/8 border border-white/10 rounded-xl text-xs text-gray-300 font-semibold transition-colors"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14M5 12h14" /></svg>
                    New Request
                </button>
                <div className="flex items-center gap-2 ml-auto">
                    {isLoggedIn && (
                        <>
                            <select
                                value={activeEnvId || ''}
                                onChange={e => setActiveEnvId(e.target.value || null)}
                                className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-blue-500/30 appearance-none max-w-40"
                            >
                                <option value="">No Environment</option>
                                {environments.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                            <button
                                onClick={() => setShowEnvModal(true)}
                                title="Manage Environments"
                                className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-colors border border-white/10"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" /></svg>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* ── HTTP Client workspace ── */}
            <div className={(isLoggedIn && sidebarOpen) ? "grid md:grid-cols-[260px_1fr] gap-4 items-start" : "flex flex-col gap-4 items-start w-full"}>

                {/* Sidebar — on mobile it's hidden/shown via state as overlay */}
                {/* Desktop: always shows as left column; Mobile: overlay drawer */}
                {isLoggedIn && sidebarOpen && (
                    <>
                        {/* Mobile backdrop */}
                        <div
                            className="fixed inset-0 bg-black/50 z-30 md:hidden"
                            onClick={() => setSidebarOpen(false)}
                        />
                        {/* Sidebar panel */}
                        <div className="fixed inset-y-0 left-0 w-64 z-40 md:static md:z-auto md:w-auto md:inset-auto bg-[#0a1020] border border-white/8 rounded-2xl overflow-hidden flex flex-col">
                            <SidebarContent />
                        </div>
                    </>
                )}

                {/* Main panel */}
                <div className="min-w-0 flex flex-col gap-3 w-full">
                    {/* Request bar */}
                    <div className="bg-[#0a1020] border border-white/8 rounded-2xl p-3 md:p-4 flex items-center gap-2">
                        {/* Method selector */}
                        <select
                            value={activeRequest.method}
                            onChange={e => updateReq({ method: e.target.value })}
                            className={`shrink-0 bg-black/30 border rounded-xl px-2.5 py-2 text-xs font-black focus:outline-none appearance-none cursor-pointer ${METHOD_BG[activeRequest.method] || 'border-white/10'} ${METHOD_COLORS[activeRequest.method] || 'text-gray-300'}`}
                        >
                            {['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>

                        {/* URL */}
                        <input
                            value={activeRequest.url}
                            onChange={e => updateReq({ url: e.target.value })}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            placeholder="https://api.example.com/endpoint"
                            className="flex-1 bg-black/20 border border-white/10 hover:border-white/15 focus:border-blue-500/40 rounded-xl px-4 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none font-mono transition-colors min-w-0"
                        />

                        {/* Save + Send */}
                        <div className="flex items-center gap-2 shrink-0">
                            {/* Import */}
                            <button
                                onClick={() => setShowImportModal(true)}
                                title="Import (cURL, URL...)"
                                className="p-2 text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-xl transition-colors border border-white/8"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            </button>

                            {/* Save — requires login */}
                            {isLoggedIn ? (
                                <div className="relative" ref={saveMenuRef}>
                                    <button
                                        onClick={() => setShowSaveMenu(p => !p)}
                                        title="Save to Collection"
                                        className="p-2 text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-xl transition-colors border border-white/8"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                                    </button>
                                    {showSaveMenu && (
                                        <div className="absolute right-0 top-full mt-1 w-52 bg-[#0c1224] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-1">
                                            {collections.length === 0 ? (
                                                <div className="px-3 py-3 text-xs text-gray-500 text-center">No collections yet. Create one in the sidebar.</div>
                                            ) : (
                                                collections.map(f => (
                                                    <button key={f.id} onClick={() => saveCurrentToFolder(f.id)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/6 hover:text-white transition-colors">
                                                        <svg className="w-3.5 h-3.5 text-amber-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                                                        {f.name}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <a href="/login" className="relative group p-2 text-gray-600 rounded-xl border border-white/8 hover:bg-amber-500/5 hover:border-amber-500/20 hover:text-amber-400 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black/80 text-amber-300 text-[10px] px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border border-amber-500/20 pointer-events-none">Login to save</span>
                                </a>
                            )}

                            <button
                                onClick={handleSend}
                                disabled={isSending || !activeRequest.url}
                                className="flex items-center gap-2 px-5 py-2 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-700/25 border border-white/10 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                            >
                                {isSending ? (
                                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                )}
                                <span className="hidden sm:inline">{isSending ? 'Sending...' : 'Send'}</span>
                            </button>
                        </div>
                    </div>


                    {/* Request tabs */}
                    <div className="bg-[#0a1020] border border-white/8 rounded-2xl overflow-hidden">
                        <div className="border-b border-white/5 px-3 md:px-4 flex items-center gap-0.5 overflow-x-auto">
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
                                        className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold capitalize transition-colors border-b-2 whitespace-nowrap ${activeTab === tab ? 'text-blue-300 border-blue-500' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
                                    >
                                        {tab}
                                        {counts[tab] > 0 && (
                                            <span className="bg-blue-500/20 text-blue-300 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                                                {counts[tab]}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Tab body */}
                        <div className="p-3 md:p-4">
                            {activeTab === 'params' && (
                                <KVTable rows={activeRequest.params} onChange={rows => updateReq({ params: rows })} placeholder={['Parameter', 'Value']} />
                            )}
                            {activeTab === 'headers' && (
                                <KVTable rows={activeRequest.headers} onChange={rows => updateReq({ headers: rows })} placeholder={['Header', 'Value']} />
                            )}
                            {activeTab === 'body' && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {['none', 'json', 'form'].map(t => (
                                            <label key={t} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors border ${activeRequest.bodyType === t ? 'bg-blue-500/15 text-blue-300 border-blue-500/30' : 'text-gray-500 border-white/8 hover:text-gray-300'}`}>
                                                <input type="radio" name="bodyType" value={t} checked={activeRequest.bodyType === t} onChange={() => updateReq({ bodyType: t })} className="sr-only" />
                                                {t === 'none' ? 'None' : t === 'json' ? 'JSON' : 'Form Data'}
                                            </label>
                                        ))}
                                    </div>
                                    {activeRequest.bodyType === 'json' && (
                                        <textarea
                                            value={activeRequest.body}
                                            onChange={e => updateReq({ body: e.target.value })}
                                            placeholder={'{\n  "key": "value"\n}'}
                                            rows={5}
                                            className="w-full bg-black/20 border border-white/8 focus:border-blue-500/30 rounded-xl px-3 py-2.5 text-xs text-gray-200 placeholder-gray-600 font-mono focus:outline-none resize-none"
                                            spellCheck={false}
                                        />
                                    )}
                                    {activeRequest.bodyType === 'form' && (
                                        <KVTable rows={activeRequest.formData} onChange={rows => updateReq({ formData: rows })} placeholder={['Field', 'Value']} />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Response card */}
                    <div className="bg-[#0a1020] border border-white/8 rounded-2xl overflow-hidden mt-4 min-h-64">
                        {!response && !isSending && (
                            <div className="flex flex-col items-center justify-center py-16 text-gray-700 select-none">
                                <svg className="w-12 h-12 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                <p className="text-sm">Hit <kbd className="px-2 py-0.5 rounded bg-white/8 text-[11px] font-mono text-gray-500 border border-white/10">Send</kbd> to get a response</p>
                                <p className="text-xs mt-1 text-gray-700">Ctrl+Enter</p>
                            </div>
                        )}
                        {isSending && (
                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                <div className="w-6 h-6 rounded-full border-2 border-blue-500/30 border-t-blue-400 animate-spin" />
                                <p className="text-xs text-gray-600">Sending request…</p>
                            </div>
                        )}
                        {response && !isSending && (
                            <>
                                {/* Response meta bar */}
                                <div className="border-b border-white/8 px-4 py-2.5 flex items-center gap-3">
                                    {response.error ? (
                                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            Error: {response.error}
                                        </span>
                                    ) : (
                                        <>
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${STATUS_BG(response.status)} ${STATUS_COLOR(response.status)}`}>
                                                {response.status} {response.statusText}
                                            </span>
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                {response.time}ms
                                            </span>
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                                {response.size < 1024 ? `${response.size} B` : `${(response.size / 1024).toFixed(1)} KB`}
                                            </span>
                                        </>
                                    )}
                                    <div className="ml-auto flex gap-0.5">
                                        {['body', 'headers'].map(t => (
                                            <button key={t} onClick={() => setResponseTab(t)} className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wide rounded-lg transition-colors ${responseTab === t ? 'bg-blue-500/15 text-blue-300 border border-blue-500/20' : 'text-gray-600 hover:text-gray-300'}`}>{t}</button>
                                        ))}
                                    </div>
                                </div>

                                {/* Response body */}
                                <div className="p-4 md:p-5 overflow-auto max-h-[32rem]">
                                    {responseTab === 'body' && !response.error && (
                                        response.isJson ? <JsonView data={response.body} /> : (
                                            <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap break-all leading-relaxed">{response.body}</pre>
                                        )
                                    )}
                                    {responseTab === 'headers' && !response.error && (
                                        <div className="space-y-1.5">
                                            {Object.entries(response.headers).map(([k, v]) => (
                                                <div key={k} className="flex gap-3 text-xs font-mono">
                                                    <span className="text-blue-300/70 shrink-0 w-40 truncate">{k}</span>
                                                    <span className="text-gray-400">{v}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

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
