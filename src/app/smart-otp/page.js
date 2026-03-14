'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';

const SERVICE_NAMES = {
    tg: 'Telegram', wa: 'WhatsApp', ig: 'Instagram', go: 'Google', vk: 'VKontakte',
    fb: 'Facebook', tw: 'Twitter/X', tt: 'TikTok', li: 'LinkedIn',
    sh: 'Shopee', la: 'Lazada', ln: 'Line', si: 'Signal', sk: 'Skype',
    sn: 'Snapchat', sp: 'Spotify', nf: 'Netflix', jg: 'Grab',
    ot: 'Other', ya: 'Yandex', am: 'Amazon', ap: 'Apple',
};



function Countdown({ endTime }) {
    const parseTime = (t) => {
        if (!t) return 0;
        // Hero SMS returns "YYYY-MM-DD HH:MM:SS" which browsers parse as local.
        // Based on logs, the API time is UTC+3. Append offset if missing.
        const iso = t.includes('+') || t.includes('Z') ? t : t.replace(' ', 'T') + '+03:00';
        return new Date(iso).getTime();
    };

    const calc = () => Math.max(0, Math.floor((parseTime(endTime) - Date.now()) / 1000));
    const [secs, setSecs] = useState(calc);

    useEffect(() => {
        if (!endTime) return;
        setSecs(calc());
        const t = setInterval(() => {
            const v = calc();
            setSecs(v);
            if (v <= 0) clearInterval(t);
        }, 1000);
        return () => clearInterval(t);
    }, [endTime]);

    if (!endTime) return null;
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    const color = secs <= 0 ? 'text-gray-500' : secs <= 30 ? 'text-red-400 animate-pulse' : secs <= 60 ? 'text-amber-400' : 'text-gray-400';
    return (
        <span className={`flex items-center gap-1 text-[10px] font-mono font-bold ${color}`}>
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {secs <= 0 ? 'Expired' : `${m}:${s}`}
        </span>
    );
}

function StatusBadge({ status }) {
    const map = {
        STATUS_WAIT_CODE: { label: 'Waiting', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
        STATUS_WAIT_RETRY: { label: 'Retry', cls: 'bg-orange-500/15 text-orange-400 border-orange-500/25' },
        STATUS_WAIT_RESEND: { label: 'Resending', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/25' },
        STATUS_CANCEL: { label: 'Cancelled', cls: 'bg-red-500/15 text-red-400 border-red-500/25' },
        STATUS_OK: { label: 'OTP Received', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
        // Handling numeric statuses from history/setStatus
        '1': { label: 'SMS Sent', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
        '3': { label: 'Resend Requested', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/25' },
        '6': { label: 'Success', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
        '4': { label: 'Success', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
        '8': { label: 'Cancelled', cls: 'bg-red-500/15 text-red-400 border-red-500/25' },
    };
    const info = map[status] || { label: status || 'Unknown', cls: 'bg-gray-500/15 text-gray-400 border-gray-500/25' };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${info.cls}`}>
            {(status === 'STATUS_WAIT_CODE' || status === '1') && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
            {info.label}
        </span>
    );
}

export default function SmartOTP() {
    const [apiKey, setApiKey] = useState('');
    const [savedKey, setSavedKey] = useState('');
    const [balance, setBalance] = useState(null);
    const [tab, setTab] = useState('buy');
    const [countries, setCountries] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedCountryName, setSelectedCountryName] = useState('');
    const [selectedCountryDial, setSelectedCountryDial] = useState('');
    const [countrySearch, setCountrySearch] = useState('');
    const [countryOpen, setCountryOpen] = useState(false);
    const [services, setServices] = useState([]);
    const [serviceSearch, setServiceSearch] = useState('');

    const getServiceName = (code) => {
        const fromApi = services.find(s => s.code === code);
        if (fromApi) return fromApi.name;
        return SERVICE_NAMES[code] || code?.toUpperCase() || 'Unknown';
    };
    const [loadingServices, setLoadingServices] = useState(false);
    const [loadingCountries, setLoadingCountries] = useState(false);
    const [selectedService, setSelectedService] = useState(null);
    const [prices, setPrices] = useState([]);
    const [loadingPrices, setLoadingPrices] = useState(false);
    const [operators, setOperators] = useState([]);
    const [selectedOperator, setSelectedOperator] = useState(null);
    const [maxPrice, setMaxPrice] = useState('');
    const [fixedPrice, setFixedPrice] = useState(false);
    const [buyingId, setBuyingId] = useState(null);
    const [activations, setActivations] = useState([]);
    const [loadingActivations, setLoadingActivations] = useState(false);
    const [otpMap, setOtpMap] = useState({});
    const [smsMap, setSmsMap] = useState({}); // id → [{ id, phoneFrom, code, text, date }]
    const [receivingIds, setReceivingIds] = useState({});
    const [copiedId, setCopiedId] = useState(null); // for animated copy buttons
    const [pollingIds, setPollingIds] = useState({});
    const [history, setHistory] = useState([]);
    const [isFetchingHistory, setIsFetchingHistory] = useState(false);
    const pollRefs = useRef({});
    const countryRef = useRef(null);

    const [showKeyInput, setShowKeyInput] = useState(false);
    const [isConfiguring, setIsConfiguring] = useState(false);

    const fetchConfig = useCallback(async () => {
        try {
            const res = await fetch('/api/smart-otp/config');
            const data = await res.json();
            if (data.apiKey) {
                setSavedKey(data.apiKey);
                setApiKey(data.apiKey);
            } else {
                setSavedKey('');
                setApiKey('');
            }
        } catch (err) {
            console.error('Failed to fetch config:', err);
        }
    }, []);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    // Close country dropdown on outside click
    useEffect(() => {
        const handler = (e) => { if (countryRef.current && !countryRef.current.contains(e.target)) setCountryOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const fetchHero = useCallback(async (path, options = {}) => {
        try {
            const res = await fetch(path, options);
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                if (res.status === 401) setSavedKey('');
                throw new Error(data.error || `HTTP ${res.status}`);
            }
            return await res.json();
        } catch (err) {
            console.error(`Fetch error [${path}]:`, err);
            throw err;
        }
    }, []);

    const fetchBalance = useCallback(async () => {
        if (!savedKey) return;
        try {
            const res = await fetch('/api/smart-otp/balance');
            const data = await res.json();
            if (data.balance !== undefined) setBalance(data.balance);
            else {
                if (res.status === 401) setSavedKey('');
                toast.error(data.error || 'Failed to fetch balance');
            }
        } catch { toast.error('Network error fetching balance'); }
    }, [savedKey]);

    const fetchCountries = useCallback(async () => {
        if (!savedKey) return;
        setLoadingCountries(true);
        try {
            const res = await fetch('/api/smart-otp/countries');
            const data = await res.json();
            if (data.countries) setCountries(data.countries);
            else toast.error(data.error || 'Failed to load countries');
        } catch { toast.error('Network error loading countries'); }
        finally { setLoadingCountries(false); }
    }, [savedKey]);

    const fetchServices = useCallback(async (country) => {
        if (!savedKey || !country) return;
        setLoadingServices(true);
        setServices([]);
        setSelectedService(null);
        setPrices([]);
        setOperators([]);
        setSelectedOperator(null);
        try {
            const res = await fetch(`/api/smart-otp/services?country=${country}`);
            const data = await res.json();
            if (data.services) setServices(data.services);
            else toast.error(data.error || 'Failed to load services');
        } catch { toast.error('Network error loading services'); }
        finally { setLoadingServices(false); }
    }, [savedKey]);

    const fetchOperators = useCallback(async (country) => {
        if (!savedKey || !country) return;
        try {
            const res = await fetch(`/api/smart-otp/operators?country=${country}`);
            const data = await res.json();
            if (data.operators) setOperators(data.operators);
        } catch { /* silent, operators are optional */ }
    }, [savedKey]);

    const fetchPrices = useCallback(async (service) => {
        if (!savedKey || !service || !selectedCountry) return;
        setLoadingPrices(true);
        setPrices([]);
        try {
            const res = await fetch(`/api/smart-otp/prices?service=${service}&country=${selectedCountry}`);
            const data = await res.json();
            if (data.prices) setPrices(data.prices);
            else toast.error(data.error || 'Failed to load prices');
        } catch { toast.error('Network error loading prices'); }
        finally { setLoadingPrices(false); }
    }, [savedKey, selectedCountry]);

    const handleSelectService = (svc) => {
        setSelectedService(svc);
        fetchPrices(svc.code);
    };

    const fetchActivations = useCallback(async () => {
        if (!savedKey) return;
        setLoadingActivations(true);
        try {
            const res = await fetch('/api/smart-otp/activations');
            const data = await res.json();
            const apiList = Array.isArray(data.activations) ? data.activations : [];
            setActivations(prev => {
                const apiIds = new Set(apiList.map(a => String(a.id ?? a.activationId)));
                const localOnly = prev.filter(a => !apiIds.has(String(a.id)));
                return [...apiList.map(a => ({
                    ...a,
                    id: String(a.id ?? a.activationId),
                    phone: a.phoneNumber ?? a.phone,
                })), ...localOnly];
            });
        } catch { /* silent */ }
        finally { setLoadingActivations(false); }
    }, [savedKey]);

    const fetchHistory = useCallback(async () => {
        if (!savedKey) return;
        setIsFetchingHistory(true);
        try {
            const res = await fetch('/api/smart-otp/history');
            const data = await res.json();
            setHistory(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('History fetch error:', err);
            setHistory([]);
        } finally {
            setIsFetchingHistory(false);
        }
    }, [savedKey]);

    useEffect(() => {
        if (!savedKey) return;
        fetchBalance();
        fetchCountries();
        fetchActivations();
        fetchHistory();
    }, [savedKey]);

    useEffect(() => {
        if (tab === 'orders') fetchActivations();
        if (tab === 'history') fetchHistory();
    }, [tab, fetchActivations, fetchHistory]);

    useEffect(() => {
        if (selectedCountry) {
            fetchServices(selectedCountry);
            fetchOperators(selectedCountry);
        }
    }, [selectedCountry]);

    const handleSaveKey = async () => {
        if (!apiKey.trim()) return toast.error('API Key is required');
        setIsConfiguring(true);
        try {
            const res = await fetch('/api/smart-otp/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey: apiKey.trim() })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('API Key saved successfully!');
                await fetchConfig();
                setShowKeyInput(false);
                fetchBalance();
            } else {
                toast.error(data.error || 'Failed to save API Key');
            }
        } catch {
            toast.error('Network error saving API Key');
        } finally {
            setIsConfiguring(false);
        }
    };

    const handleDestroyKey = async () => {
        if (!confirm('Are you sure you want to destroy this API Key? This will reset your connection.')) return;
        try {
            const res = await fetch('/api/smart-otp/config', { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                toast.success('API Key destroyed');
                setSavedKey('');
                setApiKey('');
                setTab('buy');
            } else {
                toast.error(data.error || 'Failed to destroy key');
            }
        } catch {
            toast.error('Network error destroying key');
        }
    };

    const handleBuyNumber = async (service, cost, operator = null) => {
        if (!selectedCountry) return toast.error('Select a country first');
        const buyKey = `${service}:${cost}:${operator}`;
        setBuyingId(buyKey);
        try {
            const body = { service, country: selectedCountry };
            if (operator) body.operator = operator;
            if (maxPrice) body.maxPrice = maxPrice;
            if (fixedPrice) body.fixedPrice = true;
            const res = await fetch('/api/smart-otp/number', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (data.id && data.phone) {
                toast.success(`Number purchased: ${data.phone}`);
                setActivations(prev => [...prev, {
                    id: data.id,
                    phone: data.phone,
                    serviceCode: service,
                    activationCost: data.cost ?? cost,
                    activationOperator: data.operator,
                    activationEndTime: data.endTime,
                    activationStatus: 'STATUS_WAIT_CODE',
                }]);
                setOtpMap(prev => ({ ...prev, [data.id]: null }));
                startPolling(data.id);
                setTab('orders');
                await fetchBalance();
            } else {
                toast.error(data.error || 'Failed to buy number');
            }
        } catch { toast.error('Network error'); }
        finally { setBuyingId(null); }
    };

    const startPolling = (id) => {
        if (pollRefs.current[id]) return;
        setPollingIds(prev => ({ ...prev, [id]: true }));
        pollRefs.current[id] = setInterval(async () => {
            try {
                const res = await fetch(`/api/smart-otp/number?id=${id}`);
                const data = await res.json();
                if (data.status === 'STATUS_OK') {
                    setOtpMap(prev => ({ ...prev, [id]: data.sms }));
                    setActivations(prev => prev.map(a => a.id === id ? { ...a, activationStatus: 'STATUS_OK', smsCode: data.sms } : a));
                    stopPolling(id);
                    toast.success(`OTP received: ${data.sms}`);
                } else if (data.status === 'STATUS_CANCEL') {
                    setActivations(prev => prev.map(a => a.id === id ? { ...a, activationStatus: 'STATUS_CANCEL' } : a));
                    stopPolling(id);
                }
            } catch { /* silent */ }
        }, 5000);
    };

    const stopPolling = (id) => {
        if (pollRefs.current[id]) {
            clearInterval(pollRefs.current[id]);
            delete pollRefs.current[id];
        }
        setPollingIds(prev => { const n = { ...prev }; delete n[id]; return n; });
    };

    useEffect(() => () => Object.keys(pollRefs.current).forEach(stopPolling), []);

    const handleCancel = async (id) => {
        try {
            await fetch(`/api/smart-otp/number?id=${id}`, { method: 'DELETE' });
            stopPolling(id);
            setActivations(prev => prev.map(a => a.id === id ? { ...a, activationStatus: 'STATUS_CANCEL' } : a));
            await fetchBalance();
            toast.success('Activation cancelled');
        } catch { toast.error('Failed to cancel'); }
    };

    const handleSetStatus = async (id, status) => {
        try {
            await fetch('/api/smart-otp/status', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status }),
            });
            toast.success('Status updated');
            if (status === 3) {
                stopPolling(id);
                setActivations(prev => prev.filter(a => a.id !== id));
            }
        } catch { toast.error('Failed to update status'); }
    };

    const copyToClipboard = (text, key) => {
        navigator.clipboard.writeText(text);
        setCopiedId(key || text);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleReceiveSms = async (id) => {
        setReceivingIds(prev => ({ ...prev, [id]: true }));
        try {
            const res = await fetch(`/api/smart-otp/fetch-sms?id=${id}&size=10&page=1`);
            const data = await res.json();
            if (data.data && Array.isArray(data.data)) {
                setSmsMap(prev => ({ ...prev, [id]: data.data }));
                const latest = data.data[0];
                if (latest?.code) {
                    setOtpMap(prev => ({ ...prev, [id]: latest.code }));
                    setActivations(prev => prev.map(a => a.id === id ? { ...a, activationStatus: 'STATUS_OK', smsCode: latest.code } : a));
                    toast.success(`OTP: ${latest.code}`);
                } else {
                    toast('No SMS received yet', { icon: '⌛' });
                }
            } else {
                toast.error(data.error || 'Failed to fetch SMS');
            }
        } catch { toast.error('Network error fetching SMS'); }
        finally { setReceivingIds(prev => { const n = { ...prev }; delete n[id]; return n; }); }
    };

    const filteredServices = services.filter(s => {
        const displayName = s.name || getServiceName(s.code);
        return displayName.toLowerCase().includes(serviceSearch.toLowerCase()) ||
            (s.code || '').toLowerCase().includes(serviceSearch.toLowerCase());
    });

    const filteredPrices = selectedOperator
        ? prices.filter(p => p.operator === selectedOperator)
        : prices;

    const INTERNAL_TABS = [
        { id: 'buy', label: 'Marketplace', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg> },
        { id: 'orders', label: 'Active Orders', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>, badge: (Array.isArray(activations) ? activations : []).filter(a => a.activationStatus === 'STATUS_WAIT_CODE').length },
        { id: 'history', label: 'History', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
        { id: 'api', label: 'API Keys', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg> },
    ];

    return (
        <div className="flex flex-col gap-6 min-h-screen text-white">
            {/* ── Gradient Hero Header ── */}
            <div className="relative overflow-hidden rounded-3xl shrink-0 border border-white/5 shadow-2xl">
                {/* Latar Belakang Dasar */}
                <div className="absolute inset-0 bg-linear-to-br from-gray-900 via-[#080d1a] to-[#080d1a]" />

                {/* Glow Effects */}
                <div className="absolute -top-16 -right-16 w-80 h-80 rounded-full bg-violet-600/10 blur-[100px] pointer-events-none" />
                <div className="absolute -bottom-16 -left-8 w-64 h-64 rounded-full bg-rose-500/10 blur-[80px] pointer-events-none" />

                {/* Tekstur Grid */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.2) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

                {/* Konten Utama */}
                <div className="relative z-10 p-5 md:p-8 flex flex-row items-center justify-between gap-3">
                    <div>
                        {/* Breadcrumb Nav */}
                        <nav className="flex text-[11px] font-medium text-violet-400/60 mb-3 items-center gap-2">
                            <a href="/" className="flex items-center gap-1.5 hover:text-violet-300 transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                Dashboard
                            </a>
                            <svg className="w-3 h-3 text-violet-500/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                            <span className="text-violet-200">Smart OTP</span>
                        </nav>

                        {/* Title */}
                        <h1 className="text-xl md:text-3xl font-black tracking-tight leading-none">
                            <span className="text-white">Smart </span>
                            <span className="text-transparent bg-clip-text bg-linear-to-r from-violet-400 via-rose-400 to-pink-400 drop-shadow-sm">
                                OTP
                            </span>
                        </h1>

                        {/* Subtitle */}
                        <p className="text-gray-400 mt-2 text-[11px] md:text-[13px] max-w-xl leading-relaxed font-medium">Rent virtual phone numbers to receive OTP codes via Hero SMS API. Fast, secure, and developer-friendly.</p>
                    </div>

                    {/* Quick Stats or Action could go here, for now keeping it clean */}
                </div>
            </div>
            <div className="flex flex-col lg:flex-row gap-4 md:gap-6 items-start">
                {/* ── Internal Sidebar ── */}
                {savedKey && (
                    <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-6 lg:sticky lg:top-8">
                        <nav className="flex flex-col gap-1">
                            {INTERNAL_TABS.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setTab(t.id)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all border ${tab === t.id ? 'bg-[#111827] text-violet-400 border-[#1F2937] shadow-lg shadow-violet-500/5' : 'text-gray-400 border-transparent hover:bg-white/5 hover:text-gray-200'}`}
                                >
                                    <span className={tab === t.id ? 'text-violet-400' : 'text-gray-500'}>{t.icon}</span>
                                    {t.label}
                                    {t.badge > 0 && (
                                        <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-violet-600 text-[10px] font-bold text-white flex items-center justify-center">{t.badge}</span>
                                    )}
                                </button>
                            ))}
                        </nav>

                        {/* Balance Card at bottom of sidebar */}
                        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-4 shadow-xl space-y-3">
                            <div>
                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                                    Your Balance
                                    <button onClick={() => fetchBalance()} className="p-1 hover:text-violet-400 transition-colors" title="Refresh">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                    </button>
                                </div>
                                <div className="text-2xl font-bold text-white flex items-baseline gap-1">
                                    {balance !== null ? (
                                        <>
                                            <span className="text-violet-400">$</span>
                                            <span>{Number(balance).toFixed(2)}</span>
                                        </>
                                    ) : (
                                        <div className="w-16 h-8 bg-white/5 animate-pulse rounded-lg" />
                                    )}
                                </div>
                            </div>
                        </div>
                    </aside>
                )}

                <main className={`flex-1 w-full min-w-0 ${!savedKey ? 'max-w-6xl mx-auto' : ''}`}>

                    {/* ── Modern Centered Setup Screen ── */}
                    {!savedKey && (
                        <div className="py-2 md:py-4">
                            <div className="bg-[#111827] border border-[#1f2937] rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                                {/* Hero Section */}
                                <div className="bg-linear-to-br from-[#1a1f2e] to-[#0b0f1a] p-6 md:p-10 border-b border-[#1f2937] relative overflow-hidden text-center group">
                                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.1] pointer-events-none group-hover:opacity-15 transition-opacity">
                                        <svg className="w-full max-w-lg" viewBox="0 0 159 25" fill="currentColor">
                                            <path d="M150.281 0.571289C155.985 0.571289 158.996 3.04315 158.14 7.60659H155.034C155.668 4.65937 153.291 3.36006 150.091 3.36006C146.795 3.36006 144.608 4.94458 144.608 7.2263C144.608 9.53971 146.351 10.3954 149.774 11.3144C154.179 12.4552 156.619 14.1348 156.619 17.4623C156.619 21.899 152.721 24.5927 147.048 24.5927C141.566 24.5927 138.143 22.2476 138.714 17.4623H141.756C141.566 20.3145 143.467 21.8039 147.46 21.8039C151.105 21.8039 153.45 20.2194 153.45 17.8426C153.45 15.656 151.865 14.7053 148.094 13.6912C143.784 12.5503 141.439 10.9975 141.439 7.66997C141.439 3.45513 145.179 0.571289 150.281 0.571289Z" /><path d="M141.749 1.01514L136.996 24.1492H133.953L136.457 11.6315C137.059 8.58917 137.439 6.78281 137.851 5.00814C136.71 7.19479 135.411 9.53989 134.207 11.6315L127.077 24.1492H124.256L122.323 11.6315C121.879 8.81101 121.562 6.78281 121.372 4.5011C120.992 6.46591 120.453 9.06453 119.946 11.6315L117.379 24.1492H114.337L119.09 1.01514H123.622C124.636 8.62087 125.429 14.135 126.411 20.4731C128.819 16.0048 133.51 7.67015 137.154 1.01514H141.749Z" /><path d="M108.93 0.571289C114.634 0.571289 117.645 3.04315 116.789 7.60659H113.683C114.317 4.65937 111.94 3.36006 108.74 3.36006C105.444 3.36006 103.257 4.94458 103.257 7.2263C103.257 9.53971 105 10.3954 108.423 11.3144C112.828 12.4552 115.268 14.1348 115.268 17.4623C115.268 21.899 111.37 24.5927 105.697 24.5927C100.215 24.5927 96.7922 22.2476 97.3626 17.4623H100.405C100.215 20.3145 102.116 21.8039 106.109 21.8039C109.754 21.8039 112.099 20.2194 112.099 17.8426C112.099 15.656 110.514 14.7053 106.743 13.6912C102.433 12.5503 100.088 10.9975 100.088 7.66997C100.088 3.45513 103.827 0.571289 108.93 0.571289Z" /><path d="M97.9473 13.0098C97.5396 15.5007 96.6786 17.6523 95.3652 19.4639C94.0745 21.2527 92.3985 22.6222 90.3379 23.5732C88.2773 24.5242 85.9226 25 83.2734 25C82.9715 25 82.6744 24.9928 82.3828 24.9805L85.5781 13.9521L98.002 12.6123C97.9842 12.7438 97.9683 12.8766 97.9473 13.0098ZM82.791 13.9521L82.0967 24.9658C80.1019 24.8526 78.3543 24.446 76.8535 23.7432C75.0646 22.9053 73.6943 21.7051 72.7432 20.1426C71.9187 18.7881 71.4515 17.212 71.3418 15.415C71.0222 15.728 70.6841 16.0139 70.3262 16.2705L73.6543 24.3887H61.5957L59.7275 17.0859H59.252L59.4219 20.1768L58.7764 24.3887H47.8047L49.5303 13.4072L82.791 13.9521ZM26.9678 13.0391L25.1846 24.3887H13.8057L14.8584 17.6973H13.4316L12.3789 24.3887H1L2.84473 12.6445L26.9678 13.0391ZM46.8984 13.3643L46.5947 15.2852H38.4766L38.2725 16.6445H48.1572L46.9346 24.3887H26.0449L27.8252 13.0527L46.8984 13.3643ZM86.7666 0.0126953C88.9804 0.0868142 90.9068 0.512493 92.5459 1.29102C94.3575 2.12889 95.7393 3.34062 96.6904 4.92578C97.6641 6.48824 98.1514 8.35647 98.1514 10.5303C98.1514 11.1798 98.102 11.8517 98.0107 12.5469L86.0615 11.208L86.7666 0.0126953ZM15.0625 7.30273H16.4893L17.542 0.611328H28.9219L27.1123 12.1211L2.86523 12.5146L4.73633 0.611328H16.1152L15.0625 7.30273ZM49.2441 8.35645H39.5635L39.3594 9.71484H47.4785L47.1475 11.7949L27.9746 12.1064L29.7812 0.611328H50.4678L49.2441 8.35645ZM86.5195 0.00390625L83.2744 11.208L49.79 11.752L51.542 0.611328H64.7549C67.9931 0.611331 70.4166 1.22253 72.0244 2.44531C73.0555 3.21869 73.7597 4.22829 74.1387 5.47266C75.4192 3.70942 77.0597 2.36058 79.0605 1.42676C81.0986 0.47567 83.4318 7.81947e-06 86.0586 0C86.2136 1.3071e-06 86.3672 0.000633398 86.5195 0.00390625ZM60.7129 11.4131H61.3926C61.6189 11.413 61.8113 11.3563 61.9697 11.2432C62.1281 11.1299 62.2186 10.9713 62.2412 10.7676L62.4795 9.34082V9.23926C62.4795 8.85436 62.2526 8.66213 61.7998 8.66211H61.1543L60.7129 11.4131Z" /></svg>
                                    </div>
                                    <div className="flex flex-col items-center justify-center space-y-4 relative z-10">
                                        <div className="p-4 bg-violet-600/20 border-2 border-violet-500/30 rounded-[2rem] shadow-2xl shadow-violet-500/20">
                                            <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                                        </div>
                                        <div className="space-y-1">
                                            <h2 className="text-2xl font-black text-white tracking-tighter">Connect Hero SMS</h2>
                                            <p className="text-xs text-gray-400 font-medium">Elevate your automation with premium virtual numbers.</p>
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest">v2.0 Stable</span>
                                            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                System Ready
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Centered Guide Area */}
                                <div className="p-6 md:p-10 space-y-12 bg-[#0d121f]">
                                    {/* Guidelines Area */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
                                        {/* English Section */}
                                        <section className="space-y-6">
                                            <div className="flex items-center gap-3 text-violet-400 uppercase tracking-[0.2em] font-black text-[9px]">
                                                <span className="w-6 h-px bg-violet-400/30" />
                                                English Guide
                                            </div>
                                            <ul className="space-y-4">
                                                {[
                                                    'Go to hero-sms.com and login to your dashboard',
                                                    'Navigate to settings or account section to find your API Key',
                                                    'Never share your key with anyone for security purposes'
                                                ].map((text, i) => (
                                                    <li key={i} className="flex gap-4 text-xs text-gray-300 leading-relaxed group">
                                                        <span className="shrink-0 w-6 h-6 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-gray-500 group-hover:border-violet-500/50 group-hover:text-violet-400 transition-all">{i + 1}</span>
                                                        {text}
                                                    </li>
                                                ))}
                                            </ul>
                                        </section>

                                        {/* Indonesian Section */}
                                        <section className="space-y-6">
                                            <div className="flex items-center gap-3 text-rose-400 uppercase tracking-[0.2em] font-black text-[9px]">
                                                Panduan Indonesia
                                                <span className="w-6 h-px bg-rose-400/30" />
                                            </div>
                                            <ul className="space-y-4">
                                                {[
                                                    'Kunjungi hero-sms.com dan masuk ke akun Anda',
                                                    'Buka menu profil/pengaturan untuk menemukan API Key',
                                                    'Jangan bagikan key Anda kepada orang lain'
                                                ].map((text, i) => (
                                                    <li key={i} className="flex gap-4 text-xs text-gray-300 leading-relaxed group">
                                                        <span className="shrink-0 w-6 h-6 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-gray-500 group-hover:border-rose-500/50 group-hover:text-rose-400 transition-all">{i + 1}</span>
                                                        {text}
                                                    </li>
                                                ))}
                                            </ul>
                                        </section>
                                    </div>

                                    {/* Divider */}
                                    <div className="h-px bg-linear-to-r from-transparent via-[#1f2937] to-transparent max-w-2xl mx-auto" />

                                    {/* Input Area */}
                                    <div className="flex flex-col items-center justify-center pt-2">
                                        <div className="w-full max-w-sm space-y-4 text-center">
                                            <div className="space-y-2">
                                                <h3 className="text-lg font-bold text-white tracking-tight">Paste your API Key</h3>
                                                <p className="text-xs text-gray-500 font-medium tracking-wide">Securely encrypted using AES-256 standards.</p>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="relative group">
                                                    <div className="absolute inset-0 bg-violet-600/10 blur-2xl opacity-0 group-focus-within:opacity-100 transition-all duration-500" />
                                                    <input
                                                        type="password"
                                                        value={apiKey}
                                                        onChange={e => setApiKey(e.target.value)}
                                                        onKeyDown={e => e.key === 'Enter' && handleSaveKey()}
                                                        placeholder="••••••••••••••••"
                                                        className="relative w-full bg-[#0B0F1A] border-2 border-[#1f2937] focus:border-violet-500/50 rounded-xl px-6 py-3 text-center font-mono text-base text-white placeholder-gray-800 outline-none transition-all shadow-inner"
                                                    />
                                                </div>
                                                
                                                <button
                                                    onClick={handleSaveKey}
                                                    disabled={isConfiguring || !apiKey.trim()}
                                                    className="w-full py-3 bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-30 disabled:grayscale text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-violet-900/40 transition-all hover:-translate-y-0.5 active:scale-95"
                                                >
                                                    {isConfiguring ? 'Initializing...' : 'Initialize Connection'}
                                                </button>

                                                <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest">
                                                    <span className="text-violet-500/50 mr-2">●</span>
                                                    Encrypted Session Active
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {savedKey && (
                        <>
                            {/* ── MARKETPLACE VIEW ── */}
                            {tab === 'buy' && (
                                <div className="flex flex-col xl:flex-row gap-6 h-full">
                                    {/* Selection Panel (Left) */}
                                    <div className="xl:w-[320px] flex flex-col gap-4 shrink-0 h-full">
                                        <div className="bg-[#111827] border border-[#1F2937] rounded-3xl p-5 shadow-2xl flex flex-col gap-5">
                                            {/* Country Picker */}
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Country</label>
                                                <div className="relative" ref={countryRef}>
                                                    <button
                                                        onClick={() => { setCountryOpen(o => !o); setCountrySearch(''); }}
                                                        className={`w-full flex items-center gap-3 bg-[#0B0F1A]/50 border rounded-2xl px-4 py-3 cursor-pointer transition-all ${countryOpen ? 'border-violet-500/50 ring-2 ring-violet-500/10' : 'border-[#1F2937] hover:border-gray-700'}`}
                                                    >
                                                        {selectedCountry ? (
                                                            <img
                                                                src={`https://cdn.hero-sms.com/assets/img/country/${selectedCountry}.svg`}
                                                                className="w-5 h-5 rounded-md object-cover"
                                                                alt=""
                                                                onError={(e) => e.target.style.display = 'none'}
                                                            />
                                                        ) : (
                                                            <div className="w-5 h-5 rounded-md bg-gray-800 flex items-center justify-center">
                                                                <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" /></svg>
                                                            </div>
                                                        )}
                                                        <span className={`flex-1 text-sm truncate text-left ${selectedCountryName ? 'text-white font-medium' : 'text-gray-500'}`}>
                                                            {selectedCountryName}{selectedCountryDial && <span className="ml-2 text-violet-400 font-mono text-xs">{selectedCountryDial}</span>}
                                                            {!selectedCountryName && 'Select Country'}
                                                        </span>
                                                        <svg className={`w-4 h-4 text-gray-500 transition-transform ${countryOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                    </button>

                                                    {countryOpen && (
                                                        <div className="absolute z-50 mt-2 w-full bg-[#111827] border border-[#1F2937] rounded-2xl shadow-3xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                            <div className="p-2 border-b border-[#1F2937]">
                                                                <div className="relative">
                                                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                                                    <input autoFocus type="text" value={countrySearch} onChange={e => setCountrySearch(e.target.value)} placeholder="Search..." className="w-full bg-[#0B0F1A]/50 border border-[#1F2937] rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/40" />
                                                                </div>
                                                            </div>
                                                            <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                                                {countries.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase())).map(c => (
                                                                    <button key={c.id} onClick={() => { setSelectedCountry(c.id); setSelectedCountryName(c.name); setSelectedCountryDial(c.dial); setCountryOpen(false); setCountrySearch(''); }}
                                                                        className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-violet-500/5 flex items-center justify-between ${selectedCountry === c.id ? 'text-violet-400 font-semibold bg-violet-500/10' : 'text-gray-300'}`}>
                                                                        <div className="flex items-center gap-3">
                                                                            <img
                                                                                src={`https://cdn.hero-sms.com/assets/img/country/${c.id}.svg`}
                                                                                className="w-4 h-4 rounded-sm object-cover"
                                                                                alt=""
                                                                                onError={(e) => e.target.style.display = 'none'}
                                                                            />
                                                                            <span>{c.name}</span>
                                                                        </div>
                                                                        {c.dial && <span className="text-[10px] font-mono text-gray-500">{c.dial}</span>}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Service Search & List */}
                                            {selectedCountry && (
                                                <div className="flex flex-col gap-3 min-h-0">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Service</label>
                                                        <div className="relative">
                                                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                                            <input type="text" value={serviceSearch} onChange={e => setServiceSearch(e.target.value)} placeholder="Search service..." className="w-full bg-[#0B0F1A]/50 border border-[#1F2937] rounded-2xl pl-9 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/40" />
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col gap-2 overflow-y-auto max-h-[400px] custom-scrollbar pr-1">
                                                        {loadingServices ? (
                                                            <div className="space-y-2">
                                                                {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 bg-white/5 animate-pulse rounded-2xl" />)}
                                                            </div>
                                                        ) : filteredServices.length === 0 ? (
                                                            <div className="py-8 text-center text-gray-500 text-sm">No services found</div>
                                                        ) : (
                                                            filteredServices.map(s => {
                                                                const name = s.name || getServiceName(s.code);
                                                                const isSelected = selectedService?.code === s.code;
                                                                return (
                                                                    <button
                                                                        key={s.code}
                                                                        onClick={() => handleSelectService(s)}
                                                                        className={`group w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all border ${isSelected ? 'bg-[#1a1f2e] border-[#8B5CF6] shadow-[0_0_20px_rgba(139,92,246,0.1)] text-white' : 'bg-transparent border-transparent hover:bg-white/5 text-gray-400 hover:text-gray-200'}`}
                                                                    >
                                                                        <div className={`w-10 h-10 rounded-full bg-white border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-[#8B5CF6]/50' : 'border-[#1F2937] group-hover:border-gray-700'}`}>
                                                                            <img
                                                                                src={`https://cdn.hero-sms.com/assets/img/service/${s.code}0.webp`}
                                                                                className="w-full h-full object-contain p-1.5"
                                                                                alt=""
                                                                                onError={(e) => {
                                                                                    e.target.parentElement.innerHTML = `<span class="text-[10px] font-black text-violet-400 uppercase">${s.code?.slice(0, 2)}</span>`;
                                                                                 }}
                                                                            />
                                                                        </div>
                                                                        <span className="text-sm font-semibold truncate">{name}</span>
                                                                        {isSelected && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.5)]" />}
                                                                    </button>
                                                                );
                                                            })
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Details Panel (Right) */}
                                    <div className="flex-1 bg-[#111827] border border-[#1F2937] rounded-3xl overflow-hidden shadow-2xl flex flex-col min-h-[500px]">
                                        {!selectedCountry ? (
                                            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4">
                                                <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center">
                                                    <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" /></svg>
                                                </div>
                                                <div className="space-y-2">
                                                    <h3 className="text-xl font-bold text-white">Select a Country</h3>
                                                    <p className="text-gray-500 max-w-xs text-sm">Choose a country from the left panel to browse available OTP services.</p>
                                                </div>
                                            </div>
                                        ) : !selectedService ? (
                                            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4 bg-[#0B0F1A]/20">
                                                <div className="w-20 h-20 rounded-3xl bg-violet-500/5 border border-violet-500/10 flex items-center justify-center">
                                                    <svg className="w-10 h-10 text-violet-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                </div>
                                                <div className="space-y-2">
                                                    <h3 className="text-xl font-bold text-white">Choose a Service</h3>
                                                    <p className="text-gray-500 max-w-xs text-sm font-medium">We have <span className="text-violet-400">{filteredServices.length}</span> services available in {selectedCountryName}.</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Marketplace Header */}
                                                <div className="px-8 py-6 border-b border-[#1F2937] bg-[#111827]/50">
                                                    <div className="flex items-center justify-between mb-8">
                                                        <div className="flex items-center gap-5">
                                                            <div className="w-16 h-16 rounded-full bg-white border border-[#1F2937] flex items-center justify-center shadow-inner overflow-hidden">
                                                                <img
                                                                    src={`https://cdn.hero-sms.com/assets/img/service/${selectedService.code}0.webp`}
                                                                    className="w-full h-full object-contain p-3"
                                                                    alt=""
                                                                    onError={(e) => {
                                                                        e.target.parentElement.innerHTML = `<span class="text-xl font-black text-violet-400 uppercase">${selectedService.code?.slice(0, 2)}</span>`;
                                                                    }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <h2 className="text-2xl font-bold text-white tracking-tight">{selectedService.name || getServiceName(selectedService.code)}</h2>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <div className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-gray-500 uppercase tracking-widest">{selectedService.code}</div>
                                                                    <div className="w-1 h-1 rounded-full bg-gray-700" />
                                                                    <div className="text-xs text-gray-400 font-medium">Available in {selectedCountryName}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 bg-[#0B0F1A] border border-[#1F2937] p-1.5 rounded-2xl">
                                                            <div className="flex items-center gap-2 px-3">
                                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Fixed Price</span>
                                                                <button onClick={() => setFixedPrice(f => !f)} className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${fixedPrice ? 'bg-violet-600' : 'bg-gray-700'}`}>
                                                                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${fixedPrice ? 'translate-x-5' : 'translate-x-0'}`} />
                                                                </button>
                                                            </div>
                                                            <div className="w-px h-6 bg-[#1F2937]" />
                                                            <div className="flex items-center gap-3 px-3">
                                                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Max Price</label>
                                                                <div className="relative">
                                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-600 text-[10px] font-bold">$</span>
                                                                    <input type="text" inputMode="decimal" value={maxPrice} onChange={e => { if (/^[0-9]*\.?[0-9]*$/.test(e.target.value)) setMaxPrice(e.target.value); }} placeholder="Any" className="w-16 bg-[#111827] border border-[#1F2937] rounded-lg pl-5 pr-2 py-1 text-xs text-white font-mono placeholder-gray-700 focus:outline-none focus:border-violet-500/40" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Provider Buttons */}
                                                    {operators.length > 0 && (
                                                        <div className="flex flex-wrap gap-2">
                                                            <button
                                                                onClick={() => setSelectedOperator(null)}
                                                                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all border ${selectedOperator === null ? 'bg-violet-500/10 border-violet-500/30 text-violet-400' : 'bg-[#0B0F1A] border-[#1F2937] text-gray-500 hover:text-gray-300 hover:border-gray-700'}`}
                                                            >
                                                                All Providers
                                                            </button>
                                                            {operators.map(op => (
                                                                <button
                                                                    key={op}
                                                                    onClick={() => setSelectedOperator(op === selectedOperator ? null : op)}
                                                                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all border ${selectedOperator === op ? 'bg-violet-500/10 border-violet-500/30 text-violet-400' : 'bg-[#0B0F1A] border-[#1F2937] text-gray-500 hover:text-gray-300 hover:border-gray-700'}`}
                                                                >
                                                                    {op}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Availability Area Content */}
                                                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                                                    {loadingPrices ? (
                                                        <div className="space-y-4">
                                                            {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-white/5 animate-pulse rounded-2xl" />)}
                                                        </div>
                                                    ) : filteredPrices.length === 0 ? (
                                                        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                                                            <p className="text-gray-400 font-medium">No inventory available for this filter.</p>
                                                            <p className="text-gray-600 text-xs">Try selecting a different provider or removing the price cap.</p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {/* Table Header Wrapper for Rows */}
                                                            <div className="grid grid-cols-[1fr_1fr_160px] px-6 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                                                <span>Price</span>
                                                                <span>In Stock</span>
                                                                <span className="text-right">Action</span>
                                                            </div>

                                                            {filteredPrices.map((p, i) => {
                                                                const key = `${selectedService.code}:${p.cost}:${p.operator}`;
                                                                const isBuying = buyingId === key;
                                                                return (
                                                                    <div key={i} className="grid grid-cols-[1fr_1fr_160px] items-center px-6 py-4 bg-[#0B0F1A]/50 border border-[#1F2937] hover:border-gray-700 rounded-2xl transition-all group">
                                                                        <div className="flex flex-col">
                                                                            <div className="text-lg font-bold text-emerald-400 flex items-baseline gap-1">
                                                                                <span className="text-xs opacity-50">$</span>
                                                                                {Number(p.cost).toFixed(4)}
                                                                            </div>
                                                                            {p.operator && <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">{p.operator}</div>}
                                                                        </div>
                                                                        <div className="flex items-center gap-3">
                                                                            <div className={`w-2 h-2 rounded-full ${p.count > 100 ? 'bg-emerald-500' : p.count > 10 ? 'bg-amber-500' : 'bg-red-500'} shadow-[0_0_8px_rgba(34,197,94,0.3)]`} />
                                                                            <span className="text-white font-semibold">{p.count.toLocaleString()}</span>
                                                                            <span className="text-gray-600 text-xs lowercase">available</span>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <button
                                                                                onClick={() => handleBuyNumber(selectedService.code, p.cost, p.operator)}
                                                                                disabled={isBuying}
                                                                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                                                                            >
                                                                                {isBuying ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Buy Number'}
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ── ACTIVE ORDERS VIEW ── */}
                            {tab === 'orders' && (
                                <div className="bg-[#111827] border border-[#1F2937] rounded-3xl overflow-hidden shadow-2xl flex flex-col min-h-[500px]">
                                    <div className="px-8 py-6 border-b border-[#1F2937] bg-[#111827]/50 flex items-center justify-between">
                                        <div className="space-y-1">
                                            <h2 className="text-xl font-bold text-white tracking-tight">Active Orders</h2>
                                            <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">Manage your current virtual numbers</p>
                                        </div>
                                        <button
                                            onClick={fetchActivations}
                                            disabled={loadingActivations}
                                            className="flex items-center gap-2 px-4 py-2 bg-[#0B0F1A] border border-[#1F2937] hover:border-gray-700 text-gray-400 hover:text-white rounded-xl text-xs font-bold transition-all"
                                        >
                                            <svg className={`w-3.5 h-3.5 ${loadingActivations ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                            Sync Orders
                                        </button>
                                    </div>

                                    <div className="flex-1 p-6 md:p-8">
                                        {activations.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                                <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-gray-600">
                                                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                                </div>
                                                <h3 className="text-lg font-bold text-white">No active orders found</h3>
                                                <p className="text-sm text-gray-500 max-w-xs">You don't have any numbers rented at the moment. Browse the marketplace to get started.</p>
                                                <button onClick={() => setTab('buy')} className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-bold transition-all active:scale-95 shadow-lg shadow-violet-500/10">
                                                    Visit Marketplace
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-4">
                                                {activations.map(a => {
                                                    const otp = otpMap[a.id] || a.smsCode;
                                                    const isPolling = pollingIds[a.id];
                                                    const isCancelled = a.activationStatus === 'STATUS_CANCEL';
                                                    const isDone = a.activationStatus === 'STATUS_OK';
                                                    return (
                                                        <div key={a.id} className={`group bg-[#0B0F1A]/50 border border-[#1F2937] hover:border-violet-500/20 rounded-3xl p-6 transition-all ${isCancelled ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                                                            <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center">
                                                                {/* Service Info */}
                                                                <div className="flex items-center gap-4 shrink-0">
                                                                    <div className="w-14 h-14 rounded-full bg-white border border-[#1F2937] flex items-center justify-center overflow-hidden">
                                                                        <img
                                                                            src={`https://cdn.hero-sms.com/assets/img/service/${a.serviceCode}0.webp`}
                                                                            className="w-full h-full object-contain p-2"
                                                                            alt=""
                                                                            onError={(e) => {
                                                                                e.target.parentElement.innerHTML = `<span class="text-xs font-black text-violet-400 uppercase">${a.serviceCode?.slice(0, 2)}</span>`;
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="font-bold text-white">{getServiceName(a.serviceCode)}</h4>
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            <StatusBadge status={a.activationStatus} />
                                                                            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{a.activationOperator}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Number Details */}
                                                                <div className="flex-1 flex flex-col md:flex-row gap-8">
                                                                    <div className="space-y-1.5">
                                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Phone Number</span>
                                                                        <div className="flex items-center gap-3">
                                                                            {/* Flag + dial code prefix */}
                                                                            {(() => {
                                                                                const phone = String(a.phoneNumber || a.phone || '');
                                                                                const clean = phone.replace(/\D/g, '');
                                                                                const matched = countries && [3, 2, 1].reduce((f, l) => f || countries.find(c => c.dial && c.dial.replace('+', '') === clean.substring(0, l)) || null, null);
                                                                                return matched ? (
                                                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                                                        <img src={`https://cdn.hero-sms.com/assets/img/country/${matched.id}.svg`} className="w-5 h-4 rounded-sm object-cover" alt={matched.name} onError={e => e.target.style.display='none'} />
                                                                                        <span className="text-xs font-bold text-gray-500">{matched.dial}</span>
                                                                                    </div>
                                                                                ) : null;
                                                                            })()}
                                                                            {/* Display local number (stripped of country code) */}
                                                                            <span className="text-xl font-mono font-bold text-white tracking-widest">
                                                                                {(() => {
                                                                                    const phone = String(a.phoneNumber || a.phone || '');
                                                                                    const clean = phone.replace(/\D/g, '');
                                                                                    const matched = countries && [3, 2, 1].reduce((f, l) => f || countries.find(c => c.dial && c.dial.replace('+', '') === clean.substring(0, l)) || null, null);
                                                                                    const dialLen = matched ? matched.dial.replace('+', '').length : 0;
                                                                                    const local = dialLen > 0 ? clean.substring(dialLen) : clean;
                                                                                    // Format: (XXX) XXX XXXX or group in 3s
                                                                                    if (local.length < 4) return local;
                                                                                    const first = local.substring(0, 3);
                                                                                    const rest = local.substring(3).match(/.{1,3}/g)?.join(' ') || '';
                                                                                    return `(${first}) ${rest}`;
                                                                                })()}
                                                                            </span>
                                                                            <button
                                                                                onClick={() => copyToClipboard(String(a.phoneNumber || a.phone), `phone-${a.id}`)}
                                                                                className="p-2 bg-white/5 hover:bg-emerald-500/10 text-gray-500 hover:text-emerald-400 rounded-lg transition-all"
                                                                                title="Copy full number"
                                                                            >
                                                                                {copiedId === `phone-${a.id}` ? (
                                                                                    <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                                                                ) : (
                                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                                                                )}
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex flex-col justify-center">
                                                                        <div className="flex items-center gap-4">
                                                                            <div className="space-y-1">
                                                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Cost</span>
                                                                                <span className="text-emerald-400 font-bold">${Number(a.activationCost).toFixed(3)}</span>
                                                                            </div>
                                                                            <div className="w-px h-6 bg-[#1F2937]" />
                                                                            <div className="space-y-1">
                                                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Time Left</span>
                                                                                <Countdown endTime={a.activationEndTime} />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* OTP / Polling */}
                                                                <div className="w-full xl:w-auto shrink-0">
                                                                    {otp ? (
                                                                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-5 py-3 flex items-center gap-4">
                                                                            <div className="space-y-0.5">
                                                                                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">OTP Received</span>
                                                                                <span className="text-2xl font-mono font-black text-emerald-400 tracking-[0.2em]">{otp}</span>
                                                                            </div>
                                                                            <button onClick={() => copyToClipboard(otp)} className="p-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl transition-all shadow-lg shadow-emerald-500/10">
                                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                                                            </button>
                                                                        </div>
                                                                    ) : isPolling ? (
                                                                        <div className="flex items-center gap-4 px-6 py-4 bg-violet-500/5 border border-violet-500/20 rounded-2xl">
                                                                            <div className="relative">
                                                                                <div className="w-3 h-3 rounded-full bg-violet-500 animate-ping absolute inset-0" />
                                                                                <div className="w-3 h-3 rounded-full bg-violet-600 relative" />
                                                                            </div>
                                                                            <span className="text-xs font-bold text-violet-400 uppercase tracking-widest">Waiting for SMS...</span>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex gap-2">
                                                                            {!isDone && (
                                                                                <>
                                                                                    <button
                                                                                        onClick={() => handleReceiveSms(a.id)}
                                                                                        disabled={receivingIds[a.id]}
                                                                                        className="px-5 py-2.5 bg-[#1a1f2e] border border-violet-500/30 text-violet-400 rounded-xl text-xs font-bold hover:bg-violet-500/10 transition-all shadow-lg shadow-violet-500/5 disabled:opacity-50 flex items-center gap-2"
                                                                                    >
                                                                                        {receivingIds[a.id] ? (
                                                                                            <><svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8v8z" /></svg>Fetching...</>
                                                                                        ) : 'Receive SMS'}
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => handleCancel(a.id)}
                                                                                        className="px-5 py-2.5 bg-red-500/5 border border-red-500/20 text-red-500 hover:bg-red-500/10 rounded-xl text-xs font-bold transition-all"
                                                                                    >
                                                                                        Cancel
                                                                                    </button>
                                                                                </>
                                                                            )}
                                                                            {isDone && (
                                                                                <button
                                                                                    onClick={() => handleSetStatus(a.id, 3)}
                                                                                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/10"
                                                                                >
                                                                                    Complete Order
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                    </div>
                                                                </div>

                                                                {/* SMS messages panel — shown after clicking Receive SMS */}
                                                                {smsMap[a.id] && smsMap[a.id].length > 0 && (
                                                                    <div className="mt-4 border-t border-white/5 pt-4 space-y-2">
                                                                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-3">Received Messages</p>
                                                                        {smsMap[a.id].map((msg, mi) => (
                                                                            <div key={msg.id || mi} className="bg-black/20 border border-white/5 rounded-xl px-4 py-3 flex items-start gap-3">
                                                                                <div className="shrink-0 w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                                                                                    <svg className="w-3.5 h-3.5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                                                                </div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{msg.phoneFrom || 'Unknown'}</span>
                                                                                        {msg.code && <span className="px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black rounded-lg tracking-widest">{msg.code}</span>}
                                                                                    </div>
                                                                                    <p className="text-xs text-gray-300 leading-relaxed">{msg.text}</p>
                                                                                </div>
                                                                                {msg.code && (
                                                                                    <button onClick={() => copyToClipboard(msg.code, `sms-${msg.id || mi}`)} className="shrink-0 p-1.5 bg-white/5 hover:bg-emerald-500/10 text-gray-500 hover:text-emerald-400 rounded-lg transition-all" title="Copy code">
                                                                                        {copiedId === `sms-${msg.id || mi}` ? (<svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>) : (<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>)}
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ── HISTORY VIEW ── */}
                            {tab === 'history' && (
                                <div className="space-y-4">
                                    <div className="bg-[#111827] border border-[#1F2937] rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">

                                        {/* Header */}
                                        <div className="flex items-center justify-between mb-6">
                                            <div>
                                                <h3 className="text-xl font-bold text-white mb-1">Activation History</h3>
                                                <p className="text-xs text-gray-500 font-medium">All timestamps shown in WIB (UTC+7)</p>
                                            </div>
                                            <button
                                                onClick={fetchHistory}
                                                disabled={isFetchingHistory}
                                                className="flex items-center gap-2 px-4 py-2 bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 border border-violet-500/20 rounded-2xl transition-all active:scale-95 disabled:opacity-50 text-xs font-bold"
                                                title="Refresh History"
                                            >
                                                <svg className={`w-4 h-4 ${isFetchingHistory ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                                Refresh
                                            </button>
                                        </div>

                                        {/* Content */}
                                        {isFetchingHistory && history.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                                <div className="w-12 h-12 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
                                                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Fetching your history...</p>
                                            </div>
                                        ) : history.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
                                                <svg className="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                <p className="text-sm font-black text-gray-500 uppercase tracking-[0.2em]">No history found</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {history.map((h, i) => {
                                                    // Convert UTC+3 → UTC+7 for display
                                                    let displayDate = '—';
                                                    let displayTime = '';
                                                    const isRecent = h.date === '0000-00-00 00:00:00' || !h.date;
                                                    if (isRecent) {
                                                        displayDate = 'Just now';
                                                    } else {
                                                        try {
                                                            const parsed = new Date(h.date.replace(' ', 'T') + '+03:00');
                                                            displayDate = parsed.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' });
                                                            displayTime = parsed.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB';
                                                        } catch {
                                                            displayDate = h.date?.split(' ')[0] || '—';
                                                            displayTime = h.date?.split(' ')[1] || '';
                                                        }
                                                    }

                                                    // Infer country from phone prefix using countries state (already has dial + id)
                                                    const rawPhone = String(h.phone || '');
                                                    const clean = rawPhone.replace(/\D/g, '');
                                                    // Match longest prefix first (3-digit codes take priority over 1-digit)
                                                    let matchedCountry = null;
                                                    if (countries && countries.length > 0) {
                                                        matchedCountry = [3, 2, 1].reduce((found, len) => {
                                                            if (found) return found;
                                                            const prefix = clean.substring(0, len);
                                                            return countries.find(c => c.dial && c.dial.replace('+', '') === prefix) || null;
                                                        }, null);
                                                    }
                                                    const countryFlagUrl = matchedCountry ? `https://cdn.hero-sms.com/assets/img/country/${matchedCountry.id}.svg` : null;

                                                    // Format phone like: +62 (838) 381 895 93
                                                    const formatPhone = (c) => {
                                                        if (!c || c.length < 4) return c ? `+${c}` : '—';
                                                        const d = c.replace(/\D/g, '');
                                                        if (d.length <= 6) return `+${d}`;
                                                        const cc = d.substring(0, 2);
                                                        const rest = d.substring(2);
                                                        const parts = rest.match(/.{1,3}/g) || [rest];
                                                        return `+${cc} (${parts[0]}) ${parts.slice(1).join(' ')}`;
                                                    };

                                                    // Status config
                                                    const statusMap = {
                                                        '6': { label: 'Success', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
                                                        '4': { label: 'Success', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
                                                        '8': { label: 'Cancelled', cls: 'bg-red-500/10 text-red-400 border-red-500/20', dot: 'bg-red-400' },
                                                        '1': { label: 'SMS Sent', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-400 animate-ping' },
                                                        '3': { label: 'Resending', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20', dot: 'bg-blue-400' },
                                                    };
                                                    const statusInfo = statusMap[h.status] || { label: `Status ${h.status}`, cls: 'bg-gray-500/10 text-gray-400 border-gray-500/20', dot: 'bg-gray-400' };

                                                    return (
                                                        <div key={h.id || i}
                                                            className="group bg-[#0B0F1A] border border-white/6 hover:border-white/10 rounded-2xl px-5 py-4 transition-all hover:bg-[#0d1220]">
                                                            <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">

                                                                {/* Date + ID */}
                                                                <div className="shrink-0 min-w-[100px]">
                                                                    <p className="text-xs font-bold text-white">{displayDate}</p>
                                                                    {displayTime && <p className="text-[10px] text-gray-500 font-mono mt-0.5">{displayTime}</p>}
                                                                    <p className="text-[9px] text-gray-700 font-mono mt-1">#{h.id}</p>
                                                                </div>

                                                                {/* Phone + flag */}
                                                                <div className="flex items-center gap-2 flex-1 min-w-[140px]">
                                                                    {countryFlagUrl && (
                                                                        <img
                                                                            src={countryFlagUrl}
                                                                            className="w-5 h-4 rounded-sm object-cover shrink-0"
                                                                            alt={matchedCountry?.name || ''}
                                                                            onError={(e) => e.target.style.display = 'none'}
                                                                        />
                                                                    )}
                                                                    <span className="font-mono text-sm font-bold text-violet-400 tracking-wide">
                                                                        {formatPhone(rawPhone)}
                                                                    </span>
                                                                </div>

                                                                {/* SMS */}
                                                                <div className="flex-1 min-w-0 hidden md:block">
                                                                    {h.sms ? (
                                                                        <p className="text-xs text-gray-300 italic truncate max-w-xs">{h.sms}</p>
                                                                    ) : (
                                                                        <p className="text-[10px] text-gray-600 font-semibold uppercase tracking-widest">No SMS</p>
                                                                    )}
                                                                </div>

                                                                {/* Cost */}
                                                                <div className="shrink-0 text-right">
                                                                    <span className={`text-sm font-black font-mono ${Number(h.cost) > 0 ? 'text-emerald-400' : 'text-gray-600'}`}>
                                                                        ${Number(h.cost).toFixed(3)}
                                                                    </span>
                                                                </div>

                                                                {/* Status */}
                                                                <div className="shrink-0">
                                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${statusInfo.cls}`}>
                                                                        <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                                                                        {statusInfo.label}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* SMS (mobile) */}
                                                            {h.sms && (
                                                                <div className="md:hidden mt-2 ml-0 px-3 py-2 bg-white/3 rounded-xl border border-white/5">
                                                                    <p className="text-xs text-gray-300 italic">{h.sms}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ── API KEYS VIEW ── */}
                            {tab === 'api' && (
                                <div className="space-y-6">
                                    <div className="bg-[#111827] border border-[#1F2937] rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-8 opacity-5">
                                            <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                                        </div>

                                        <div className="relative z-10">
                                            <div className="flex items-center justify-between mb-8">
                                                <div>
                                                    <h3 className="text-xl font-bold text-white mb-1">Hero SMS Config</h3>
                                                    <p className="text-sm text-gray-500">Manage your Hero SMS integration and API keys securely.</p>
                                                </div>
                                                {!showKeyInput && (
                                                    <button
                                                        onClick={() => { setShowKeyInput(true); setApiKey(''); }}
                                                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-all text-gray-300 hover:text-white"
                                                    >
                                                        Change Key
                                                    </button>
                                                )}
                                            </div>

                                            <div className="space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Provider</label>
                                                        <div className="bg-[#0B0F1A] border border-[#1F2937] rounded-2xl px-4 py-3 flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 font-black text-xs">H</div>
                                                            <span className="text-sm font-semibold text-white">Hero SMS (hero-sms.com)</span>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">API Key Status</label>
                                                        <div className="bg-[#0B0F1A] border border-[#1F2937] rounded-2xl px-4 py-3 flex items-center gap-3">
                                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                            <span className="text-sm font-semibold text-white">Active & Connected</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Current API Key</label>

                                                    {showKeyInput ? (
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="password"
                                                                value={apiKey}
                                                                onChange={e => setApiKey(e.target.value)}
                                                                placeholder="Enter your new Hero SMS API key..."
                                                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500/50 font-mono"
                                                            />
                                                            <button
                                                                onClick={handleSaveKey}
                                                                disabled={isConfiguring}
                                                                className="px-6 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-violet-600/20"
                                                            >
                                                                {isConfiguring ? 'Saving...' : 'Save Key'}
                                                            </button>
                                                            <button
                                                                onClick={() => setShowKeyInput(false)}
                                                                className="px-4 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl font-bold text-sm transition-all"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="bg-[#0B0F1A] border border-[#1F2937] rounded-2xl px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                                                            <div className="font-mono text-gray-400 tracking-wider">
                                                                {savedKey}
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">ENCRYPTED</span>
                                                                <button
                                                                    onClick={handleDestroyKey}
                                                                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 rounded-lg text-xs font-bold transition-all"
                                                                >
                                                                    Destroy Key
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── Placeholder for Settings (if still needed) ── */}
                            {['settings'].includes(tab) && (
                                <div className="bg-[#111827] border border-[#1F2937] rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[400px] space-y-4">
                                    <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-gray-700">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-white">Settings View</h3>
                                        <p className="text-sm text-gray-500 max-w-xs">General settings are being consolidated. Most Hero SMS settings are now in the API Keys tab.</p>
                                    </div>
                                    <button onClick={() => setTab('buy')} className="px-6 py-2 bg-[#0B0F1A] border border-[#1F2937] text-gray-400 hover:text-white rounded-xl text-xs font-bold transition-all mt-4">
                                        Back to Marketplace
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}
