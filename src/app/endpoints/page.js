'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

// --- Syntax Highlighter ---
function JsonHighlight({ value }) {
    if (!value) return null;
    let str = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
    const lines = str.split('\n');
    return (
        <code className="text-xs font-mono leading-relaxed">
            {lines.map((line, i) => {
                const highlighted = line
                    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
                        let cls = 'text-amber-300'; // number
                        if (/^"/.test(match)) {
                            cls = /:$/.test(match) ? 'text-blue-300' : 'text-emerald-300';
                        } else if (/true|false/.test(match)) {
                            cls = 'text-purple-400';
                        } else if (/null/.test(match)) {
                            cls = 'text-rose-400';
                        }
                        return `<span class="${cls}">${match}</span>`;
                    });
                return (
                    <div key={i} className="flex min-w-0">
                        <span className="select-none text-gray-600 w-8 shrink-0 text-right pr-3">{i + 1}</span>
                        <span dangerouslySetInnerHTML={{ __html: highlighted || '&ZeroWidthSpace;' }} />
                    </div>
                );
            })}
        </code>
    );
}

// --- Method Badge ---
function MethodBadge({ method, size = 'sm' }) {
    const map = {
        GET: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        POST: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
        PUT: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        PATCH: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
        DELETE: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    };
    const s = size === 'sm' ? 'text-[10px] px-2 py-0.5 w-14' : 'text-xs px-3 py-1 w-16';
    return (
        <span className={`${s} ${map[method] || 'bg-gray-500/15 text-gray-400 border-gray-500/30'} text-center rounded border font-semibold tracking-normal shrink-0`}>
            {method}
        </span>
    );
}

// --- Stat Card ---
function StatCard({ label, value, icon, iconBg, glowBg }) {
    return (
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/3 p-4 backdrop-blur-sm hover:border-white/20 transition-all">
            <div className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-30 ${glowBg}`} />
            <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg} border border-white/10 shrink-0`}>
                    {icon}
                </div>
                <div>
                    <p className="text-2xl font-black text-white">{value}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
                </div>
            </div>
        </div>
    );
}

export default function EndpointsPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [apiStats, setApiStats] = useState([]);
    const router = useRouter();

    // Playground State
    const [expandedEndpoint, setExpandedEndpoint] = useState(null);
    const [testParams, setTestParams] = useState({});
    const [testBody, setTestBody] = useState('');
    const [testHeaders, setTestHeaders] = useState([{ key: 'Content-Type', value: 'application/json', enabled: true }]);
    const [testLoading, setTestLoading] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [cleanupResult, setCleanupResult] = useState(null); // null | 'pending' | 'ok' | 'failed'
    const [requestTab, setRequestTab] = useState('body');
    const [responseTab, setResponseTab] = useState('pretty');
    const [copyDone, setCopyDone] = useState(false);
    const [history, setHistory] = useState([]);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [filterMethod, setFilterMethod] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const responseRef = useRef(null);

    useEffect(() => {
        const checkAuthAndMaintenance = async () => {
            let userRole = null;

            // Auth
            const storedUser = localStorage.getItem('user_info');
            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser);
                    userRole = parsedUser.role;
                } catch (e) { console.error(e); }
            }

            if (!userRole) {
                try {
                    const res = await fetch('/api/auth/me');
                    if (res.ok) {
                        const data = await res.json();
                        if (data.user) {
                            setUser(data.user);
                            userRole = data.user.role;
                        } else {
                            router.push('/login');
                            return;
                        }
                    } else {
                        router.push('/login');
                        return;
                    }
                } catch {
                    router.push('/login');
                    return;
                }
            }

            if (userRole !== 'ULTRA') {
                router.push('/');
                return;
            }

            fetchStats();
        };

        checkAuthAndMaintenance();
    }, [router]);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/monitoring', { credentials: 'include' });
            const data = await res.json();
            if (data.apiStats) setApiStats(data.apiStats);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch api stats:', err);
            setLoading(false);
        }
    };

    const getHitCount = (method, path) => {
        const key = `${method} ${path}`;
        const stat = apiStats.find(s => s.path === key);
        return stat ? stat.hitCount : 0;
    };

    const totalHits = apiStats.reduce((acc, s) => acc + s.hitCount, 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-xs text-gray-500 animate-pulse">Loading playground…</p>
                </div>
            </div>
        );
    }

    const apiCategories = [
        {
            category: 'Authentication', icon: '🔐',
            desc: 'Endpoints for user login, session management, and OAuth',
            endpoints: [
                { method: 'POST', path: '/api/auth/login', desc: 'Authenticate user with email and password', sampleBody: '{\n  "email": "admin@mailpulse.com",\n  "password": "your_password"\n}' },
                { method: 'POST', path: '/api/auth/logout', desc: 'Clear user session and cookies' },
                { method: 'GET', path: '/api/auth/me', desc: 'Get current authenticated user session data' },
                { method: 'GET', path: '/api/auth/google/url', desc: 'Generate Google OAuth consent URL' },
                { method: 'POST', path: '/api/auth/google/validate', desc: 'Validate Google OAuth credentials before saving' },
            ]
        },
        {
            category: 'User Management', icon: '👥',
            desc: 'Endpoints for managing system users and roles',
            endpoints: [
                { method: 'GET', path: '/api/users', desc: 'Retrieve all users' },
                { method: 'POST', path: '/api/users', desc: 'Create a new user', sampleBody: '{\n  "name": "Test User",\n  "email": "test@devora.col",\n  "password": "password123",\n  "role": "MEMBER"\n}', autoCleanupEndpoint: '/api/users/:id' },
                { method: 'PATCH', path: '/api/users/:id', desc: 'Update a user role or details' },
                { method: 'DELETE', path: '/api/users/:id', desc: 'Delete a user from the system' },
                { method: 'POST', path: '/api/user/upgrade', desc: 'Save Google OAuth configuration for PRO upgrade' },
                { method: 'PUT', path: '/api/user/profile', desc: 'Update user profile (Name & Email)', sampleBody: '{\n  "name": "New Name",\n  "email": "new.email@example.com"\n}' },
            ]
        },
        {
            category: 'Airdrops & Tasks', icon: '🪂',
            desc: 'Endpoints for managing airdrop projects and associated tasks',
            endpoints: [
                { method: 'GET', path: '/api/airdrops', desc: 'Retrieve all airdrop projects' },
                { method: 'POST', path: '/api/airdrops', desc: 'Create a new airdrop project', sampleBody: '{\n  "name": "Test Project",\n  "taskType": "Social",\n  "status": "Potential"\n}', autoCleanupEndpoint: '/api/airdrops/:id' },
                { method: 'PUT', path: '/api/airdrops/:id', desc: 'Update an existing airdrop project' },
                { method: 'DELETE', path: '/api/airdrops/:id', desc: 'Delete an airdrop project' },
                { method: 'GET', path: '/api/airdrops/:id/tasks', desc: 'Get all tasks for a specific airdrop' },
                { method: 'POST', path: '/api/airdrops/:id/tasks', desc: 'Create a new task for an airdrop' },
                { method: 'PUT', path: '/api/airdrops/:id/tasks/:taskId', desc: 'Update a specific task' },
                { method: 'DELETE', path: '/api/airdrops/:id/tasks/:taskId', desc: 'Delete a specific task' },
                { method: 'POST', path: '/api/airdrops/tasks/progress', desc: 'Update task progress status' },
            ]
        },
        {
            category: 'Airdrop Suggestions', icon: '💡',
            desc: 'Endpoints for community airdrop suggestions',
            endpoints: [
                { method: 'GET', path: '/api/airdrops/suggest', desc: 'Retrieve all pending airdrop suggestions' },
                { method: 'POST', path: '/api/airdrops/suggest', desc: 'Submit a new airdrop suggestion', sampleBody: '{\n  "name": "Test Suggestion",\n  "link": "https://example.com/test",\n  "description": "Just testing the API"\n}', autoCleanupEndpoint: '/api/airdrops/suggest/:id' },
                { method: 'PUT', path: '/api/airdrops/suggest/:id', desc: 'Approve or update a suggestion status' },
                { method: 'DELETE', path: '/api/airdrops/suggest/:id', desc: 'Reject or delete a suggestion' },
            ]
        },
        {
            category: 'Gmail Accounts', icon: '📧',
            desc: 'Endpoints for managing connected Gmail accounts and scraping',
            endpoints: [
                { method: 'GET', path: '/api/accounts', desc: 'List all connected Gmail accounts' },
                { method: 'POST', path: '/api/accounts', desc: 'Connect a new Gmail account' },
                { method: 'GET', path: '/api/accounts/:email', desc: 'Get specific account details' },
                { method: 'PUT', path: '/api/accounts/:email', desc: 'Update specific account settings' },
                { method: 'DELETE', path: '/api/accounts/:email', desc: 'Disconnect a Gmail account' },
                { method: 'GET', path: '/api/accounts/:email/messages', desc: 'Retrieve messages for a Gmail account' },
            ]
        }
    ];

    const allEndpoints = apiCategories.flatMap(c => c.endpoints);
    const totalEndpoints = allEndpoints.length;

    const methodColors = {
        GET: 'emerald', POST: 'blue', PUT: 'amber', PATCH: 'orange', DELETE: 'rose'
    };

    const handleExpand = (ep) => {
        const key = `${ep.method}-${ep.path}`;
        if (expandedEndpoint === key) {
            setExpandedEndpoint(null);
        } else {
            setExpandedEndpoint(key);
            setTestResult(null);
            setCleanupResult(null);
            setTestParams({});
            setTestBody(ep.sampleBody || '');
            setTestHeaders([{ key: 'Content-Type', value: 'application/json', enabled: true }]);
            setRequestTab(ep.sampleBody ? 'body' : 'params');
        }
    };

    const handleParamChange = (k, value) => {
        setTestParams(prev => ({ ...prev, [k]: value }));
    };

    const buildResolvedUrl = (ep) => {
        let finalPath = ep.path;
        const matches = finalPath.match(/:[a-zA-Z]+/g);
        if (matches) {
            for (let match of matches) {
                const paramName = match.substring(1);
                finalPath = finalPath.replace(match, testParams[paramName] || match);
            }
        }
        return finalPath;
    };

    const executeTest = async (ep) => {
        setTestLoading(true);
        setTestResult(null);
        setCleanupResult(null);

        let finalPath = buildResolvedUrl(ep);
        const startTime = Date.now();

        try {
            const options = { method: ep.method };

            const hdrs = {};
            testHeaders.forEach(h => {
                if (h.enabled && h.key) hdrs[h.key] = h.value;
            });
            if (Object.keys(hdrs).length > 0) options.headers = hdrs;

            if (ep.method !== 'GET' && ep.method !== 'DELETE') {
                if (!options.headers) options.headers = {};
                options.headers['Content-Type'] = 'application/json';
                if (testBody) options.body = testBody;
            }

            options.credentials = 'include';
            const res = await fetch(finalPath, options);
            const endTime = Date.now();

            let data;
            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await res.json();
            } else {
                data = await res.text();
            }

            const result = { status: res.status, data, time: endTime - startTime, method: ep.method, path: finalPath };
            setTestResult(result);
            setHistory(prev => [result, ...prev].slice(0, 20));
            setTimeout(fetchStats, 1000);

            // Auto Cleanup — awaited so we can show feedback
            if (ep.autoCleanupEndpoint && res.status >= 200 && res.status < 300) {
                let createdId = null;
                if (typeof data === 'object') {
                    createdId = data.id || data.user?.id || data.project?.id || data.suggestion?.id;
                }
                if (createdId) {
                    setCleanupResult('pending');
                    const cleanupPath = ep.autoCleanupEndpoint.replace(':id', createdId);
                    try {
                        const cleanRes = await fetch(cleanupPath, { method: 'DELETE', credentials: 'include' });
                        setCleanupResult(cleanRes.ok ? 'ok' : 'failed');
                    } catch {
                        setCleanupResult('failed');
                    }
                }
            }
        } catch (error) {
            const result = { status: 'Error', data: error.message, time: Date.now() - startTime, method: ep.method, path: finalPath };
            setTestResult(result);
            setHistory(prev => [result, ...prev].slice(0, 20));
        } finally {
            setTestLoading(false);
        }
    };

    const copyResponse = () => {
        if (!testResult) return;
        const text = typeof testResult.data === 'object'
            ? JSON.stringify(testResult.data, null, 2)
            : String(testResult.data);
        navigator.clipboard.writeText(text).then(() => {
            setCopyDone(true);
            setTimeout(() => setCopyDone(false), 2000);
        });
    };

    const statusColor = (s) => {
        if (String(s).startsWith('2')) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
        if (s === 'Error' || String(s).startsWith('5')) return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
        return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    };

    const methodFilter = ['ALL', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

    const filteredCategories = apiCategories.map(cat => ({
        ...cat,
        endpoints: cat.endpoints.filter(ep => {
            const matchesMethod = filterMethod === 'ALL' || ep.method === filterMethod;
            const matchesSearch = searchQuery === '' || ep.path.toLowerCase().includes(searchQuery.toLowerCase()) || ep.desc.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesMethod && matchesSearch;
        })
    })).filter(cat => cat.endpoints.length > 0);

    return (
        <div className="space-y-6 animate-fade-in-up pb-20">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl">
                <div className="absolute inset-0 bg-linear-to-br from-gray-900 via-[#0d1b3e] to-gray-900" />
                <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-16 -left-8 w-56 h-56 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
                <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.2) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

                <div className="relative z-10 p-8">
                    <nav className="flex text-xs text-blue-300/60 mb-3 items-center gap-2">
                        <a href="/" className="flex items-center gap-1 hover:text-blue-300 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                            Dashboard
                        </a>
                        <svg className="w-3 h-3 text-blue-400/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        <span className="text-blue-200 font-semibold">Endpoints</span>
                    </nav>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
                                <span className="text-white">Endpoints </span>
                                <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 via-indigo-400 to-purple-400">Playground</span>
                            </h1>
                            <p className="text-gray-400 text-sm max-w-xl">
                                Exclusive developer access. Monitor real-time traffic, inspect responses, and test any endpoint interactively.
                            </p>
                        </div>
                        {/* Stats Row */}
                        <div className="grid flex-1 w-full grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
                            <StatCard
                                label="Endpoints"
                                value={totalEndpoints}
                                glowBg="bg-blue-500"
                                iconBg="bg-blue-500/25"
                                icon={<svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3" /></svg>}
                            />
                            <StatCard
                                label="Total Hits"
                                value={totalHits}
                                glowBg="bg-emerald-500"
                                iconBg="bg-emerald-500/25"
                                icon={<svg className="w-5 h-5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                            />
                            <StatCard
                                label="History"
                                value={history.length}
                                glowBg="bg-purple-500"
                                iconBg="bg-purple-500/25"
                                icon={<svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                {/* Search */}
                <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search endpoints or descriptions…"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 placeholder:text-gray-600 outline-none focus:border-blue-500/50 focus:bg-white/[0.07] transition-all"
                    />
                </div>
                {/* Method Filter */}
                <div className="flex items-center gap-1.5 bg-white/3 border border-white/10 rounded-xl p-1">
                    {methodFilter.map(m => (
                        <button
                            key={m}
                            onClick={() => setFilterMethod(m)}
                            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${filterMethod === m
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                }`}
                        >
                            {m}
                        </button>
                    ))}
                </div>
                {/* History Toggle */}
                {history.length > 0 && (
                    <button
                        onClick={() => setHistoryOpen(v => !v)}
                        className="relative flex items-center gap-2 px-3 py-2 bg-purple-600/10 border border-purple-500/20 rounded-xl text-xs text-purple-300 hover:bg-purple-600/20 transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        History
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-purple-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{history.length}</span>
                    </button>
                )}
            </div>

            {/* History Panel */}
            {historyOpen && history.length > 0 && (
                <div className="bg-[#0f172a]/90 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
                    <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Request History
                        </h3>
                        <button onClick={() => { setHistory([]); setHistoryOpen(false); }} className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors">Clear All</button>
                    </div>
                    <div className="divide-y divide-white/5 max-h-64 overflow-y-auto">
                        {history.map((h, i) => (
                            <div key={i} className="flex items-center gap-3 px-5 py-2.5 hover:bg-white/3 transition-colors">
                                <MethodBadge method={h.method} />
                                <code className="text-xs text-gray-300 flex-1 truncate font-mono">{h.path}</code>
                                <span className={`text-[10px] px-2 py-0.5 rounded border ${statusColor(h.status)}`}>{h.status}</span>
                                <span className="text-[10px] text-gray-600 w-14 text-right shrink-0">{h.time}ms</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Categories */}
            {filteredCategories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-600">
                    <svg className="w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <p className="text-sm">No endpoints match your filter.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredCategories.map((cat, catIdx) => (
                        <div key={catIdx} className="bg-[#0f172a]/80 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
                            {/* Category Header */}
                            <div className="px-6 py-4 border-b border-white/5 bg-linear-to-r from-blue-900/10 to-transparent flex flex-col sm:flex-row sm:items-center gap-3">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <span className="text-xl shrink-0">{cat.icon}</span>
                                    <div className="min-w-0">
                                        <h2 className="text-sm font-bold text-white truncate">{cat.category}</h2>
                                        <p className="text-[11px] text-gray-500 truncate">{cat.desc}</p>
                                    </div>
                                </div>
                                <div className="ml-10 sm:ml-auto">
                                    <span className="inline-flex text-[10px] text-gray-600 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full shrink-0">
                                        {cat.endpoints.length} endpoint{cat.endpoints.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>

                            {/* Endpoints */}
                            <div>
                                {cat.endpoints.map((ep, idx) => {
                                    const isExpanded = expandedEndpoint === `${ep.method}-${ep.path}`;
                                    const hitCount = getHitCount(ep.method, ep.path);
                                    const pathParams = ep.path.match(/:[a-zA-Z]+/g) || [];
                                    const resolvedUrl = buildResolvedUrl(ep);

                                    return (
                                        <div key={idx} className="border-b border-white/5 last:border-0">
                                            {/* Endpoint Row */}
                                            <div
                                                className={`group px-6 py-3.5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none ${isExpanded ? 'bg-blue-500/5 border-l-2 border-l-blue-500' : 'hover:bg-white/2.5 border-l-2 border-l-transparent'}`}
                                                onClick={() => handleExpand(ep)}
                                            >
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <MethodBadge method={ep.method} />
                                                    <code className="text-sm font-mono text-gray-200 truncate">{ep.path}</code>
                                                    <span className="hidden sm:flex items-center gap-1 text-[10px] text-gray-500 bg-white/5 border border-white/10 rounded-full px-2 py-0.5 shrink-0">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                                        {hitCount}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0">
                                                    <p className="text-xs text-gray-500 max-w-[240px] truncate hidden lg:block">{ep.desc}</p>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleExpand(ep); }}
                                                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${isExpanded
                                                            ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/25'
                                                            : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
                                                            }`}
                                                    >
                                                        {isExpanded ? (
                                                            <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>Close</>
                                                        ) : (
                                                            <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Test</>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Playground Panel */}
                                            {isExpanded && (
                                                <div className="border-t border-white/5 bg-black/30">
                                                    {/* URL Bar */}
                                                    <div className="px-6 py-3 border-b border-white/5 flex items-center gap-3">
                                                        <MethodBadge method={ep.method} size="md" />
                                                        <div className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 font-mono text-xs text-gray-300 overflow-x-auto whitespace-nowrap scrollbar-thin flex items-center gap-2">
                                                            <span className="text-gray-600">localhost:3000</span>
                                                            {resolvedUrl.split('/').map((seg, j) => (
                                                                <span key={j}>
                                                                    {j > 0 && <span className="text-gray-600">/</span>}
                                                                    <span className={seg.startsWith(':') ? 'text-amber-400' : 'text-gray-300'}>{seg}</span>
                                                                </span>
                                                            ))}
                                                            {user && (
                                                                <span className="shrink-0 ml-1 flex items-center gap-1 text-[9px] text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-1.5 py-0.5 rounded font-sans font-semibold">
                                                                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                                                    {user.name || user.email} · {user.role}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => executeTest(ep)}
                                                            disabled={testLoading}
                                                            className="shrink-0 flex items-center gap-2 px-5 py-1.5 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {testLoading ? (
                                                                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                            ) : (
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                                            )}
                                                            Send
                                                        </button>
                                                    </div>

                                                    {/* Two-column Panel */}
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[300px]">
                                                        {/* Left: Request */}
                                                        <div className="border-r border-white/5 flex flex-col">
                                                            {/* Request Tabs */}
                                                            <div className="flex items-center gap-0 border-b border-white/5 px-4 pt-1">
                                                                {['params', 'headers', ...(ep.method !== 'GET' && ep.method !== 'DELETE' ? ['body'] : [])].map(tab => (
                                                                    <button
                                                                        key={tab}
                                                                        onClick={() => setRequestTab(tab)}
                                                                        className={`px-4 py-2.5 text-[11px] font-semibold capitalize border-b-2 transition-all ${requestTab === tab
                                                                            ? 'border-blue-500 text-blue-400'
                                                                            : 'border-transparent text-gray-500 hover:text-gray-300'
                                                                            }`}
                                                                    >
                                                                        {tab}
                                                                        {tab === 'body' && ep.sampleBody && <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />}
                                                                    </button>
                                                                ))}
                                                            </div>

                                                            <div className="flex-1 p-5 space-y-3 overflow-y-auto">
                                                                {/* Params Tab */}
                                                                {requestTab === 'params' && (
                                                                    <div>
                                                                        {pathParams.length > 0 ? (
                                                                            <div className="space-y-2.5">
                                                                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Path Parameters</p>
                                                                                {pathParams.map(param => {
                                                                                    const pName = param.substring(1);
                                                                                    return (
                                                                                        <div key={pName} className="flex items-center gap-2">
                                                                                            <span className="text-xs font-mono text-amber-400 w-20 shrink-0 bg-amber-400/5 border border-amber-400/20 rounded px-2 py-1 text-center">{param}</span>
                                                                                            <input
                                                                                                type="text"
                                                                                                value={testParams[pName] || ''}
                                                                                                onChange={(e) => handleParamChange(pName, e.target.value)}
                                                                                                placeholder={`Enter ${pName}…`}
                                                                                                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-gray-600 outline-none focus:border-blue-500/50 transition-all"
                                                                                            />
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex flex-col items-center justify-center h-32 text-gray-600">
                                                                                <svg className="w-6 h-6 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                                                <p className="text-xs">No path parameters</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {/* Headers Tab */}
                                                                {requestTab === 'headers' && (
                                                                    <div className="space-y-2.5">
                                                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Request Headers</p>
                                                                        {testHeaders.map((h, hIdx) => (
                                                                            <div key={hIdx} className="flex items-center gap-2">
                                                                                <button
                                                                                    onClick={() => setTestHeaders(prev => prev.map((x, i) => i === hIdx ? { ...x, enabled: !x.enabled } : x))}
                                                                                    className={`w-4 h-4 rounded shrink-0 border flex items-center justify-center transition-all ${h.enabled ? 'bg-blue-500 border-blue-500' : 'border-white/20'}`}
                                                                                >
                                                                                    {h.enabled && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                                                                </button>
                                                                                <input
                                                                                    value={h.key}
                                                                                    onChange={e => setTestHeaders(prev => prev.map((x, i) => i === hIdx ? { ...x, key: e.target.value } : x))}
                                                                                    placeholder="Header name"
                                                                                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-blue-300 font-mono placeholder:text-gray-600 outline-none focus:border-blue-500/50 transition-all"
                                                                                />
                                                                                <input
                                                                                    value={h.value}
                                                                                    onChange={e => setTestHeaders(prev => prev.map((x, i) => i === hIdx ? { ...x, value: e.target.value } : x))}
                                                                                    placeholder="Value"
                                                                                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-300 font-mono placeholder:text-gray-600 outline-none focus:border-blue-500/50 transition-all"
                                                                                />
                                                                                <button
                                                                                    onClick={() => setTestHeaders(prev => prev.filter((_, i) => i !== hIdx))}
                                                                                    className="text-gray-600 hover:text-rose-400 transition-colors shrink-0"
                                                                                >
                                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                                                </button>
                                                                            </div>
                                                                        ))}
                                                                        <button
                                                                            onClick={() => setTestHeaders(prev => [...prev, { key: '', value: '', enabled: true }])}
                                                                            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors mt-1"
                                                                        >
                                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                                                            Add Header
                                                                        </button>
                                                                    </div>
                                                                )}

                                                                {/* Body Tab */}
                                                                {requestTab === 'body' && (ep.method === 'POST' || ep.method === 'PUT' || ep.method === 'PATCH') && (
                                                                    <div className="space-y-2">
                                                                        <div className="flex items-center justify-between">
                                                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Request Body (JSON)</p>
                                                                            <div className="flex items-center gap-2">
                                                                                {ep.autoCleanupEndpoint && (
                                                                                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
                                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                                        Auto-cleanup
                                                                                    </span>
                                                                                )}
                                                                                {ep.sampleBody && (
                                                                                    <button
                                                                                        onClick={() => setTestBody(ep.sampleBody)}
                                                                                        className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                                                                                    >
                                                                                        Load Sample
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <textarea
                                                                            value={testBody}
                                                                            onChange={(e) => setTestBody(e.target.value)}
                                                                            rows={10}
                                                                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-xs text-gray-300 font-mono outline-none focus:border-blue-500/50 resize-y transition-all"
                                                                            placeholder="{}"
                                                                            spellCheck={false}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Right: Response */}
                                                        <div className="flex flex-col">
                                                            {/* Response Tabs + Meta */}
                                                            <div className="flex items-center border-b border-white/5 px-4 pt-1">
                                                                {['pretty', 'raw'].map(tab => (
                                                                    <button
                                                                        key={tab}
                                                                        onClick={() => setResponseTab(tab)}
                                                                        className={`px-4 py-2.5 text-[11px] font-semibold capitalize border-b-2 transition-all ${responseTab === tab
                                                                            ? 'border-blue-500 text-blue-400'
                                                                            : 'border-transparent text-gray-500 hover:text-gray-300'
                                                                            }`}
                                                                    >
                                                                        {tab}
                                                                    </button>
                                                                ))}
                                                                {testResult && (
                                                                    <div className="ml-auto flex items-center gap-2 py-1.5">
                                                                        <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${statusColor(testResult.status)}`}>
                                                                            {testResult.status}
                                                                        </span>
                                                                        <span className="text-[10px] text-gray-500">{testResult.time}ms</span>
                                                                        <button
                                                                            onClick={copyResponse}
                                                                            className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
                                                                        >
                                                                            {copyDone ? (
                                                                                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                                            ) : (
                                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                                                            )}
                                                                            {copyDone ? 'Copied!' : 'Copy'}
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Response Body */}
                                                            <div ref={responseRef} className="flex-1 bg-[#070d1a] min-h-[250px] overflow-auto p-4">
                                                                {testLoading ? (
                                                                    <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-3">
                                                                        <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                                                                        <p className="text-xs animate-pulse">Waiting for response…</p>
                                                                    </div>
                                                                ) : testResult ? (
                                                                    responseTab === 'pretty' ? (
                                                                        <JsonHighlight value={testResult.data} />
                                                                    ) : (
                                                                        <pre className="text-xs font-mono text-gray-400 whitespace-pre-wrap break-all">
                                                                            {typeof testResult.data === 'object'
                                                                                ? JSON.stringify(testResult.data, null, 2)
                                                                                : String(testResult.data)}
                                                                        </pre>
                                                                    )
                                                                ) : (
                                                                    <div className="flex flex-col items-center justify-center h-full text-gray-700 gap-2">
                                                                        <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                                        <p className="text-xs">Hit <span className="text-blue-500 font-semibold">Send</span> to see the response</p>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Auto-Cleanup Banner */}
                                                            {cleanupResult && (
                                                                <div className={`flex items-center gap-2 px-4 py-2.5 border-t text-xs font-medium ${cleanupResult === 'pending' ? 'border-blue-500/20 bg-blue-500/5 text-blue-400' :
                                                                    cleanupResult === 'ok' ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' :
                                                                        'border-rose-500/20 bg-rose-500/5 text-rose-400'
                                                                    }`}>
                                                                    {cleanupResult === 'pending' ? (
                                                                        <div className="w-3.5 h-3.5 border-2 border-current/40 border-t-current rounded-full animate-spin shrink-0" />
                                                                    ) : cleanupResult === 'ok' ? (
                                                                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                    ) : (
                                                                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                                                    )}
                                                                    {cleanupResult === 'pending' && 'Cleaning up test data…'}
                                                                    {cleanupResult === 'ok' && 'Test data auto-deleted from DB ✓'}
                                                                    {cleanupResult === 'failed' && 'Auto-cleanup failed — data may remain in DB'}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
