'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { HeroHeader, LoadingState } from '@/components/HeroHeader';
import LoadingImage from '@/components/LoadingImage';

// ========== UTILITY COMPONENTS ==========
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
    const color = secs <= 0 ? 'text-gray-500' : secs <= 30 ? 'text-[#FFF799] animate-pulse' : secs <= 60 ? 'text-[#80C60C]' : 'text-gray-400';
    return (
        <span className={`font-mono text-xs ${color}`}>
            {secs <= 0 ? 'Expired' : `${m}:${s}`}
        </span>
    );
}

function StatusBadge({ status }) {
    const map = {
        STATUS_WAIT_CODE: { label: 'Waiting', cls: 'bg-[#FFF799]/10 text-[#FFF799] border-[#FFF799]/25' },
        STATUS_WAIT_RETRY: { label: 'Retry', cls: 'bg-[#4C8CE4]/15 text-[#4C8CE4] border-[#4C8CE4]/25' },
        STATUS_WAIT_RESEND: { label: 'Resending', cls: 'bg-[#80C60C]/15 text-[#80C60C] border-[#80C60C]/25' },
        STATUS_CANCEL: { label: 'Cancelled', cls: 'bg-[#406093]/15 text-[#406093] border-[#406093]/25' },
        STATUS_OK: { label: 'OTP Received', cls: 'bg-[#80C60C]/15 text-[#80C60C] border-[#80C60C]/25' },
        '1': { label: 'SMS Sent', cls: 'bg-[#FFF799]/15 text-[#FFF799] border-[#FFF799]/25' },
        '3': { label: 'Resend Requested', cls: 'bg-[#80C60C]/15 text-[#80C60C] border-[#80C60C]/25' },
        '6': { label: 'Success', cls: 'bg-[#80C60C]/15 text-[#80C60C] border-[#80C60C]/25' },
        '4': { label: 'Success', cls: 'bg-[#80C60C]/15 text-[#80C60C] border-[#80C60C]/25' },
        '8': { label: 'Cancelled', cls: 'bg-[#406093]/15 text-[#406093] border-[#406093]/25' },
    };
    const info = map[status] || { label: status || 'Unknown', cls: 'bg-gray-500/15 text-gray-400 border-gray-500/25' };
    return (
        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${info.cls}`}>
            {(status === 'STATUS_WAIT_CODE' || status === '1') && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
            {info.label}
        </span>
    );
}

// ========== MAIN COMPONENT ==========
export default function HeroSMSClient() {
    const [apiKey, setApiKey] = useState('');
    const [savedKey, setSavedKey] = useState('');
    const [configLoaded, setConfigLoaded] = useState(false);
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
    const [smsMap, setSmsMap] = useState({});
    const [receivingIds, setReceivingIds] = useState({});
    const [copiedId, setCopiedId] = useState(null);
    const [pollingIds, setPollingIds] = useState({});
    const [history, setHistory] = useState([]);
    const [isFetchingHistory, setIsFetchingHistory] = useState(false);
    const pollRefs = useRef({});
    const countryRef = useRef(null);

    const [showKeyInput, setShowKeyInput] = useState(false);
    const [isConfiguring, setIsConfiguring] = useState(false);

    const fetchConfig = useCallback(async () => {
        try {
            const res = await fetch('/api/herosms-client/config');
            const data = await res.json();
            if (data.apiKey) {
                setSavedKey(data.apiKey);
                setApiKey(data.apiKey);
            } else {
                setSavedKey('');
                setApiKey('');
                setTab('api');
            }
        } catch (err) {
            console.error('Failed to fetch config:', err);
        } finally {
            setConfigLoaded(true);
        }
    }, []);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

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
            const res = await fetch('/api/herosms-client/balance');
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
            const res = await fetch('/api/herosms-client/countries');
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
            const res = await fetch(`/api/herosms-client/services?country=${country}`);
            const data = await res.json();
            if (data.services) setServices(data.services);
            else toast.error(data.error || 'Failed to load services');
        } catch { toast.error('Network error loading services'); }
        finally { setLoadingServices(false); }
    }, [savedKey]);

    const fetchOperators = useCallback(async (country) => {
        if (!savedKey || !country) return;
        try {
            const res = await fetch(`/api/herosms-client/operators?country=${country}`);
            const data = await res.json();
            if (data.operators) setOperators(data.operators);
        } catch { /* silent, operators are optional */ }
    }, [savedKey]);

    const fetchPrices = useCallback(async (service) => {
        if (!savedKey || !service || !selectedCountry) return;
        setLoadingPrices(true);
        setPrices([]);
        try {
            const res = await fetch(`/api/herosms-client/prices?service=${service}&country=${selectedCountry}`);
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
            const res = await fetch('/api/herosms-client/activations');
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
            const res = await fetch('/api/herosms-client/history');
            const data = await res.json();
            setHistory(data || []);
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
            const res = await fetch('/api/herosms-client/config', {
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
            const res = await fetch('/api/herosms-client/config', { method: 'DELETE' });
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
            const res = await fetch('/api/herosms-client/number', {
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
                const res = await fetch(`/api/herosms-client/number?id=${id}`);
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
            await fetch(`/api/herosms-client/number?id=${id}`, { method: 'DELETE' });
            stopPolling(id);
            setActivations(prev => prev.map(a => a.id === id ? { ...a, activationStatus: 'STATUS_CANCEL' } : a));
            await fetchBalance();
            toast.success('Activation cancelled');
        } catch { toast.error('Failed to cancel'); }
    };

    const handleSetStatus = async (id, status) => {
        try {
            await fetch('/api/herosms-client/status', {
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
            const res = await fetch(`/api/herosms-client/fetch-sms?id=${id}&size=10&page=1`);
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
        {
            id: 'buy', label: 'Marketplace', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
        },
        {
            id: 'orders', label: 'Active Orders', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>, badge: (Array.isArray(activations) ? activations : []).filter(a => a.activationStatus === 'STATUS_WAIT_CODE').length
        },
        {
            id: 'history', label: 'History', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        },
        { id: 'api', label: 'API Keys', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg> },
    ];

    return (
        <div className="flex flex-col gap-6 text-[#FFF799] min-h-screen">
            {/* ── Hero Header ── */}
            <HeroHeader
                colorTheme="herosms"
                breadcrumbs={[
                    { label: 'DASHBOARD', href: '/' },
                    { label: 'HEROSMS CLIENT' }
                ]}
                title="HeroSMS"
                badge="Client"
                description="Advanced OTP service powered by Hero SMS API."
            />

            {/* ── Main Content Area ── */}
            <div className="max-w-[1700px] mx-auto w-full px-4 md:px-8 pb-12 mt-6">
                {!configLoaded ? (
                    <LoadingState message="Initializing connection..." colorTheme="herosms" />
                ) : loadingCountries && savedKey ? (
                    <LoadingState message="Loading services..." colorTheme="herosms" />
                ) : (
                    <div className="space-y-6">
                        {/* ── Tab Navigation (Cyberpunk Style) ── */}
                        {savedKey && (
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 border-b border-[#406093]/20 pb-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    {INTERNAL_TABS.map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setTab(t.id)}
                                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2 ${tab === t.id
                                                ? 'bg-[#4C8CE4]/10 border-[#4C8CE4] text-[#4C8CE4] shadow-[0_0_20px_rgba(76,140,228,0.2)]'
                                                : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300 hover:bg-[#406093]/10'
                                                }`}
                                        >
                                            <span className="opacity-70">{t.icon}</span>
                                            {t.label}
                                            {t.badge > 0 && (
                                                <span className="ml-1 px-1.5 py-0.5 bg-[#DA4848] text-[9px] text-white rounded-md animate-pulse">
                                                    {t.badge}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {balance !== null && (
                                    <div className="flex items-center gap-4 px-5 py-2.5 bg-[#80C60C]/5 border border-[#80C60C]/20 rounded-2xl shadow-[0_0_20px_rgba(128,198,12,0.05)]">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[9px] font-black text-[#80C60C]/60 uppercase tracking-[0.2em] mb-0.5">Available Credits</span>
                                            <span className="text-xl font-black text-[#80C60C] font-mono tracking-tighter">${balance.toFixed(4)}</span>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-[#80C60C]/10 border border-[#80C60C]/20 flex items-center justify-center text-[#80C60C]">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── MARKETPLACE TAB ── */}
                        {savedKey && tab === 'buy' && (
                            <div className="grid lg:grid-cols-[380px_1fr] gap-6">

                                {/* Selection Panel (Left) - Cyberpunk OTP Style */}
                                <div className="space-y-4">

                                    {/* Country Picker */}
                                    <div className="space-y-2">
                                        < label className="flex items-center gap-2 text-xs font-bold text-[#4C8CE4] uppercase tracking-wider">
                                            < span className="w-1 h-1 rounded-full bg-[#4C8CE4] animate-pulse" />
                                            Country Selection
                                        </label >
                                        <div ref={countryRef} className="relative">
                                            < button
                                                onClick={() => { setCountryOpen(o => !o); setCountrySearch(''); }
                                                }
                                                className={`w-full flex items-center gap-3 bg-[#0B0F1A] border-2 rounded-2xl px-4 py-3.5 cursor-pointer transition-all ${countryOpen
                                                    ? 'border-[#4C8CE4] shadow-[0_0_15px_rgba(76,140,228,0.3)]'
                                                    : 'border-[#406093]/30 hover:border-[#406093]/60'
                                                    }`}
                                            >
                                                {selectedCountry ? (
                                                    <div className="w-6 h-6 rounded overflow-hidden">
                                                        <LoadingImage
                                                            src={`https://cdn.hero-sms.com/assets/img/country/${selectedCountry}.svg`}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                            containerClassName="w-full h-full"
                                                            spinnerClassName="w-3 h-3 rounded-full border border-[#4C8CE4]/30 border-t-[#4C8CE4] animate-spin"
                                                            fallback={
                                                                <div className="w-full h-full flex items-center justify-center bg-[#4C8CE4]/10 text-[10px] font-black text-[#4C8CE4] uppercase">
                                                                    {selectedCountry?.slice(0, 2) || '??'}
                                                                </div>
                                                            }
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-6 h-6 rounded bg-[#406093]/20 flex items-center justify-center">
                                                        <svg className="w-4 h-4 text-[#406093]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    </div>
                                                )}
                                                <div className="flex-1 text-left">
                                                    <div className="text-sm font-bold text-white">{selectedCountryName || 'Select Country'}</div>
                                                    {selectedCountryDial && <span className="text-xs font-mono text-[#4C8CE4]">{selectedCountryDial}</span>}
                                                </div>
                                                <svg className={`w-4 h-4 text-[#406093] transition-transform ${countryOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                                            </button>

                                            {countryOpen && (
                                                <div className="absolute z-50 w-full mt-2 bg-[#0B0F1A] border-2 border-[#4C8CE4]/40 rounded-2xl shadow-[0_0_30px_rgba(76,140,228,0.2)] max-h-80 overflow-hidden">
                                                    < div className="p-3 border-b border-[#406093]/30">
                                                        < div className="relative">
                                                            < svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#406093]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                                            < input value={countrySearch} onChange={e => setCountrySearch(e.target.value)} placeholder="Search country..." className="w-full bg-[#0B0F1A] border border-[#406093]/30 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#4C8CE4]" />
                                                        </div >
                                                    </div >
                                                    <div className="overflow-y-auto max-h-64">
                                                        {
                                                            countries.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase())).map(c => (
                                                                <button
                                                                    key={c.id}
                                                                    onClick={() => { setSelectedCountry(c.id); setSelectedCountryName(c.name); setSelectedCountryDial(c.dial); setCountryOpen(false); setCountrySearch(''); }}
                                                                    className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between ${selectedCountry === c.id
                                                                        ? 'text-[#4C8CE4] font-bold bg-[#4C8CE4]/10'
                                                                        : 'text-gray-300 hover:bg-[#406093]/10 hover:text-white'
                                                                        }`}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-5 h-5 rounded overflow-hidden">
                                                                            <LoadingImage
                                                                                src={`https://cdn.hero-sms.com/assets/img/country/${c.id}.svg`}
                                                                                alt={c.name}
                                                                                className="w-full h-full object-cover"
                                                                                containerClassName="w-full h-full"
                                                                                spinnerClassName="w-3 h-3 rounded-full border border-[#4C8CE4]/30 border-t-[#4C8CE4] animate-spin"
                                                                                fallback={
                                                                                    <div className="w-full h-full flex items-center justify-center bg-[#4C8CE4]/10 text-[10px] font-black text-[#4C8CE4] uppercase">
                                                                                        {c.id?.slice(0, 2) || '??'}
                                                                                    </div>
                                                                                }
                                                                            />
                                                                        </div>
                                                                        <span>{c.name}</span>
                                                                    </div>
                                                                    {c.dial && <span className="text-xs text-gray-500 font-mono">{c.dial}</span>}
                                                                </button>
                                                            ))
                                                        }
                                                    </div >
                                                </div >
                                            )
                                            }
                                        </div >
                                    </div >

                                    {/* Service Search & List */}
                                    {
                                        selectedCountry && (
                                            <div className="space-y-3">
                                                < label className="flex items-center gap-2 text-xs font-bold text-[#80C60C] uppercase tracking-wider">
                                                    < span className="w-1 h-1 rounded-full bg-[#80C60C] animate-pulse" />
                                                    Service Browser
                                                </label >

                                                <div className="relative">
                                                    < svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#406093]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                                    < input value={serviceSearch} onChange={e => setServiceSearch(e.target.value)} placeholder="Search service..." className="w-full bg-[#0B0F1A] border-2 border-[#406093]/30 rounded-2xl pl-9 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#80C60C] focus:shadow-[0_0_15px_rgba(128,198,12,0.2)]" />
                                                </div >

                                                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#406093] scrollbar-track-transparent">
                                                    {
                                                        loadingServices ? (
                                                            <div className="space-y-2">
                                                                {
                                                                    [1, 2, 3, 4, 5].map(i => (
                                                                        <div key={i} className="h-14 bg-[#406093]/10 rounded-2xl animate-pulse border border-[#406093]/20" />
                                                                    ))
                                                                }
                                                            </div >
                                                        ) : filteredServices.length === 0 ? (
                                                            <div className="text-center py-12 text-gray-500">
                                                                < div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[#406093]/10 flex items-center justify-center">
                                                                    < svg className="w-6 h-6 text-[#406093]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                                </div >
                                                                <p className="text-sm font-semibold">No services found</p>
                                                            </div >
                                                        ) : (
                                                            filteredServices.map(s => {
                                                                const name = s.name || getServiceName(s.code);
                                                                const isSelected = selectedService?.code === s.code;
                                                                return (
                                                                    <button
                                                                        key={s.code}
                                                                        onClick={() => handleSelectService(s)}
                                                                        className={`group w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all border-2 ${isSelected
                                                                            ? 'bg-[#4C8CE4]/10 border-[#4C8CE4] shadow-[0_0_20px_rgba(76,140,228,0.2)] text-white'
                                                                            : 'bg-[#0B0F1A]/50 border-[#406093]/20 hover:border-[#406093]/50 text-gray-400 hover:text-white'
                                                                            }`}
                                                                    >
                                                                        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-[#406093]/20 border border-[#406093]/30">
                                                                            <LoadingImage
                                                                                src={`https://cdn.hero-sms.com/assets/img/service/${s.code}0.webp`}
                                                                                alt={name}
                                                                                className="w-full h-full object-cover"
                                                                                containerClassName="w-full h-full"
                                                                                spinnerClassName="w-4 h-4 rounded-full border-2 border-[#4C8CE4]/40 border-t-[#4C8CE4] animate-spin"
                                                                                loaderWrapperClassName="absolute inset-0 bg-[#4C8CE4]/5 flex items-center justify-center"
                                                                                fallback={
                                                                                    <div className="w-full h-full flex items-center justify-center bg-[#4C8CE4]/10 text-[10px] font-black text-[#4C8CE4] uppercase">
                                                                                        {s.code?.slice(0, 2) || '??'}
                                                                                    </div>
                                                                                }
                                                                            />
                                                                        </div>
                                                                        <span className="flex-1 text-left text-sm font-bold">{name}</span>
                                                                        {isSelected && (
                                                                            <div className="w-5 h-5 rounded-full bg-[#4C8CE4] flex items-center justify-center">
                                                                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                                                            </div>
                                                                        )}
                                                                    </button>
                                                                );
                                                            })
                                                        )}
                                                </div >
                                            </div >
                                        )}
                                </div >

                                {/* Details Panel (Right) - Cyberpunk OTP Display */}
                                < div className="bg-[#0B0F1A]/50 border-2 border-[#406093]/30 rounded-2xl p-6 min-h-[600px]">
                                    {
                                        !selectedCountry ? (
                                            <div className="flex flex-col items-center justify-center h-full text-center py-20">
                                                < div className="w-20 h-20 mb-6 rounded-2xl bg-[#406093]/10 flex items-center justify-center border-2 border-[#406093]/30">
                                                    < svg className="w-10 h-10 text-[#406093]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                </div >
                                                <h3 className="text-2xl font-black text-[#FFF799] mb-2">Select Target Country</h3>
                                                < p className="text-sm text-gray-500 max-w-md">Initialize your OTP session by selecting a country from the left panel.</p>
                                            </div >
                                        ) : !selectedService ? (
                                            <div className="flex flex-col items-center justify-center h-full text-center py-20">
                                                < div className="w-20 h-20 mb-6 rounded-2xl bg-[#80C60C]/10 flex items-center justify-center border-2 border-[#80C60C]/30">
                                                    < svg className="w-10 h-10 text-[#80C60C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                                                </div >
                                                <h3 className="text-2xl font-black text-[#FFF799] mb-2">Choose Service</h3>
                                                < p className="text-sm text-gray-500 max-w-md">
                                                    < span className="text-[#4C8CE4] font-bold">{filteredServices.length} services</span> available in <span className="text-[#80C60C] font-bold">{selectedCountryName}</span>
                                                </p >
                                            </div >
                                        ) : (
                                            <>
                                                {/* Service Header - Cyberpunk OTP Card */}
                                                <div className="flex items-start gap-4 pb-6 mb-6 border-b-2 border-[#406093]/30">
                                                    <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-[#406093]/20 border-2 border-[#4C8CE4]/30">
                                                        <LoadingImage
                                                            src={`https://cdn.hero-sms.com/assets/img/service/${selectedService.code}0.webp`}
                                                            alt={selectedService.name}
                                                            className="w-full h-full object-cover"
                                                            containerClassName="w-full h-full"
                                                            spinnerClassName="w-6 h-6 rounded-full border-2 border-[#4C8CE4]/40 border-t-[#4C8CE4] animate-spin"
                                                            loaderWrapperClassName="absolute inset-0 bg-[#4C8CE4]/5 flex items-center justify-center"
                                                            fallback={
                                                                <div className="w-full h-full flex items-center justify-center bg-[#4C8CE4]/10 text-xl font-black text-[#4C8CE4] uppercase">
                                                                    {selectedService.code?.slice(0, 2) || '??'}
                                                                </div>
                                                            }
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h2 className="text-2xl font-black text-white mb-2">{selectedService.name || getServiceName(selectedService.code)}</h2>
                                                        <div className="flex flex-wrap items-center gap-3">
                                                            <span className="px-2 py-1 bg-[#406093]/20 border border-[#406093]/40 rounded-lg text-[10px] font-mono font-bold text-[#4C8CE4] uppercase">{selectedService.code}</span>
                                                            <span className="text-xs text-gray-600">•</span>
                                                            <span className="text-xs text-gray-400">Available in <span className="text-[#80C60C] font-bold">{selectedCountryName}</span></span>
                                                        </div>
                                                    </div>
                                                </div >

                                                {/* Filters - Cyberpunk Toggle Style */}
                                                < div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b border-[#406093]/20">
                                                    < div className="flex items-center gap-3">
                                                        < span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fixed Price</span>
                                                        < button
                                                            onClick={() => setFixedPrice(f => !f)
                                                            }
                                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${fixedPrice ? 'bg-[#80C60C]' : 'bg-[#406093]/30'}`}
                                                        >
                                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${fixedPrice ? 'translate-x-6' : 'translate-x-1'}`} />
                                                        </button >
                                                    </div >
                                                    <div className="flex items-center gap-3">
                                                        < span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Max Price</span>
                                                        < div className="relative">
                                                            < span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#406093] font-bold">$</span>
                                                            < input
                                                                value={maxPrice}
                                                                onChange={e => { if (/^[0-9]*\.?[0-9]*$/.test(e.target.value)) setMaxPrice(e.target.value); }}
                                                                placeholder="Any"
                                                                className="w-20 bg-[#0B0F1A] border border-[#406093]/40 rounded-lg pl-6 pr-3 py-1.5 text-xs text-white font-mono placeholder-gray-700 focus:outline-none focus:border-[#4C8CE4]"
                                                            />
                                                        </div >
                                                    </div >
                                                </div >

                                                {/* Provider Buttons - Cyberpunk Pills */}
                                                {
                                                    operators.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 mb-6">
                                                            < button
                                                                onClick={() => setSelectedOperator(null)
                                                                }
                                                                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all border-2 ${selectedOperator === null
                                                                    ? 'bg-[#4C8CE4]/20 border-[#4C8CE4] text-[#4C8CE4] shadow-[0_0_10px_rgba(76,140,228,0.3)]'
                                                                    : 'bg-[#0B0F1A] border-[#406093]/30 text-gray-500 hover:text-gray-300 hover:border-[#406093]/60'
                                                                    }`}
                                                            >
                                                                All Providers
                                                            </button >
                                                            {
                                                                operators.map(op => (
                                                                    <button
                                                                        key={op}
                                                                        onClick={() => setSelectedOperator(op === selectedOperator ? null : op)}
                                                                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all border-2 ${selectedOperator === op
                                                                            ? 'bg-[#4C8CE4]/20 border-[#4C8CE4] text-[#4C8CE4] shadow-[0_0_10px_rgba(76,140,228,0.3)]'
                                                                            : 'bg-[#0B0F1A] border-[#406093]/30 text-gray-500 hover:text-gray-300 hover:border-[#406093]/60'
                                                                            }`}
                                                                    >
                                                                        {op}
                                                                    </button>
                                                                ))
                                                            }
                                                        </div >
                                                    )}

                                                {/* Availability List - OTP Card Style */}
                                                <div className="space-y-3">
                                                    {
                                                        loadingPrices ? (
                                                            <div className="space-y-3">
                                                                {
                                                                    [1, 2, 3, 4].map(i => (
                                                                        <div key={i} className="h-24 bg-[#406093]/10 rounded-xl animate-pulse border border-[#406093]/20" />
                                                                    ))
                                                                }
                                                            </div >
                                                        ) : filteredPrices.length === 0 ? (
                                                            <div className="text-center py-16">
                                                                < div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#406093]/10 flex items-center justify-center border-2 border-[#406093]/30">
                                                                    < svg className="w-8 h-8 text-[#406093]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                                </div >
                                                                <p className="text-sm font-bold text-gray-400 mb-1">No inventory available</p>
                                                                < p className="text-xs text-gray-600">Try different provider or remove price cap</p>
                                                            </div >
                                                        ) : (
                                                            <>
                                                                {/* Header */}
                                                                <div className="grid grid-cols-[1fr_140px_200px] gap-4 px-4 pb-3 text-[10px] font-bold text-[#406093] uppercase tracking-widest border-b border-[#406093]/20">
                                                                    <div>Price</div>
                                                                    <div>Stock</div>
                                                                    <div>Action</div>
                                                                </div >

                                                                {/* OTP Cards */}
                                                                {
                                                                    filteredPrices.map((p, i) => {
                                                                        const key = `${selectedService.code}:${p.cost}:${p.operator}`;
                                                                        const isBuying = buyingId === key;
                                                                        return (
                                                                            <div
                                                                                key={i}
                                                                                className="grid grid-cols-[1fr_140px_200px] gap-4 items-center px-4 py-4 bg-[#0B0F1A] border-2 border-[#406093]/30 rounded-xl hover:border-[#4C8CE4]/50 hover:shadow-[0_0_15px_rgba(76,140,228,0.1)] transition-all"
                                                                            >
                                                                                {/* Price */}
                                                                                < div >
                                                                                    <div className="flex items-baseline gap-1 mb-1">
                                                                                        < span className="text-xs text-[#406093]">$</span>
                                                                                        < span className="text-2xl font-black text-white">{Number(p.cost).toFixed(4)}</span>
                                                                                    </div >
                                                                                    {
                                                                                        p.operator && (
                                                                                            <div className="inline-block px-2 py-1 bg-[#406093]/20 border border-[#406093]/40 rounded text-[9px] font-mono font-bold text-[#4C8CE4] uppercase">
                                                                                                {p.operator}
                                                                                            </div>
                                                                                        )
                                                                                    }
                                                                                </div >

                                                                                {/* Stock */}
                                                                                < div className="flex items-center gap-2">
                                                                                    < span className={`w-2 h-2 rounded-full ${p.count > 100 ? 'bg-[#80C60C]' : p.count > 10 ? 'bg-[#FFF799]' : 'bg-[#406093]'} shadow-[0_0_8px_currentColor]`
                                                                                    } />
                                                                                    < div >
                                                                                        <div className="text-lg font-black text-white">{p.count.toLocaleString()}</div>
                                                                                        < div className="text-[9px] text-gray-600 uppercase tracking-wide">Available</div>
                                                                                    </div >
                                                                                </div >

                                                                                {/* Action Button */}
                                                                                < div >
                                                                                    <button
                                                                                        onClick={() => handleBuyNumber(selectedService.code, p.cost, p.operator)}
                                                                                        disabled={isBuying}
                                                                                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-r from-[#4C8CE4] to-[#80C60C] hover:opacity-90 text-white rounded-xl text-sm font-black uppercase tracking-wide transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(76,140,228,0.3)]"
                                                                                    >
                                                                                        {
                                                                                            isBuying ? (
                                                                                                <>
                                                                                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                                                                        < circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                                                        < path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                                                                    </svg >
                                                                                                    Processing
                                                                                                </>
                                                                                            ) : (
                                                                                                <>
                                                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg >
                                                                                                    Buy Now
                                                                                                </>
                                                                                            )}
                                                                                    </button >
                                                                                </div >
                                                                            </div >
                                                                        );
                                                                    })}
                                                            </>
                                                        )}
                                                </div >
                                            </>
                                        )}
                                </div >
                            </div >
                        )}

                        {/* ── ORDERS TAB ── */}
                        {savedKey && tab === 'orders' && (
                            <div className="space-y-4">
                                {(Array.isArray(activations) ? activations : []).filter(a => a.activationStatus === 'STATUS_WAIT_CODE' || a.activationStatus === '1').length === 0 ? (
                                    <div className="bg-[#0B0F1A]/50 border-2 border-[#406093]/30 rounded-2xl p-20 text-center">
                                        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#406093]/10 flex items-center justify-center border-2 border-[#406093]/30">
                                            <svg className="w-10 h-10 text-[#406093]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                        </div>
                                        <h3 className="text-2xl font-black text-[#FFF799] mb-2">No Active Orders</h3>
                                        <p className="text-sm text-gray-500">You don't have any active number rentals at the moment.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {activations.filter(a => a.activationStatus === 'STATUS_WAIT_CODE' || a.activationStatus === '1').map((a) => (
                                            <div key={a.id} className="bg-[#0B0F1A]/50 border-2 border-[#406093]/30 rounded-2xl p-6 hover:border-[#4C8CE4]/50 transition-all">
                                                <div className="flex flex-wrap items-center justify-between gap-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-[#4C8CE4]/10 border border-[#4C8CE4]/30 flex items-center justify-center overflow-hidden">
                                                            <LoadingImage
                                                                src={`https://cdn.hero-sms.com/assets/img/service/${a.serviceCode}0.webp`}
                                                                alt=""
                                                                className="w-full h-full object-cover"
                                                                containerClassName="w-full h-full"
                                                                spinnerClassName="w-4 h-4 rounded-full border border-[#4C8CE4]/30 border-t-[#4C8CE4] animate-spin"
                                                                fallback={
                                                                    <div className="w-full h-full flex items-center justify-center bg-[#4C8CE4]/10 text-[10px] font-black text-[#4C8CE4] uppercase">
                                                                        {a.serviceCode?.slice(0, 2) || '??'}
                                                                    </div>
                                                                }
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] font-mono font-bold text-[#4C8CE4] uppercase tracking-widest mb-1">{getServiceName(a.serviceCode)}</div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-xl font-black text-white tracking-wider">+{a.phone}</span>
                                                                <button onClick={() => copyToClipboard(a.phone, `phone-${a.id}`)} className="p-1.5 text-gray-500 hover:text-[#FFF799] hover:bg-[#FFF799]/10 rounded-lg transition-all">
                                                                    {copiedId === `phone-${a.id}` ? <svg className="w-4 h-4 text-[#80C60C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m-3 8h3m-3 3h3" /></svg>}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-8">
                                                        <div>
                                                            <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2">Time Left</div>
                                                            <Countdown endTime={a.activationEndTime} />
                                                        </div>
                                                        <div>
                                                            <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2">Status</div>
                                                            <StatusBadge status={a.activationStatus} />
                                                        </div>
                                                        <div className="min-w-[140px]">
                                                            {otpMap[a.id] ? (
                                                                <div className="flex flex-col items-end">
                                                                    <div className="text-[9px] font-black text-[#80C60C] uppercase tracking-widest mb-1">Code Received</div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-2xl font-black text-[#FFF799] tracking-widest font-mono">{otpMap[a.id]}</span>
                                                                        <button onClick={() => copyToClipboard(otpMap[a.id], `otp-${a.id}`)} className="p-1 px-1.5 bg-[#FFF799]/10 border border-[#FFF799]/30 rounded-lg text-[#FFF799]">
                                                                            {copiedId === `otp-${a.id}` ? 'COPIED' : 'COPY'}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col items-end">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        {pollingIds[a.id] && <div className="w-1.5 h-1.5 rounded-full bg-[#FFF799] animate-ping" />}
                                                                        <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Waiting for SMS</span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleReceiveSms(a.id)}
                                                                        disabled={receivingIds[a.id]}
                                                                        className="px-4 py-1.5 bg-[#406093]/10 border border-[#406093]/30 hover:border-[#4C8CE4]/50 rounded-xl text-[10px] font-black uppercase text-gray-400 hover:text-white transition-all disabled:opacity-50"
                                                                    >
                                                                        {receivingIds[a.id] ? 'Fetching...' : 'Check Manual'}
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => handleSetStatus(a.id, 6)}
                                                                className="px-4 py-2 bg-[#80C60C]/10 border border-[#80C60C]/40 hover:bg-[#80C60C]/20 rounded-xl text-[10px] font-black uppercase text-[#80C60C] transition-all"
                                                            >
                                                                Finish
                                                            </button>
                                                            <button
                                                                onClick={() => handleCancel(a.id)}
                                                                className="px-4 py-2 bg-[#DA4848]/10 border border-[#DA4848]/40 hover:bg-[#DA4848]/20 rounded-xl text-[10px] font-black uppercase text-[#DA4848] transition-all"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── HISTORY TAB ── */}
                        {savedKey && tab === 'history' && (
                            <div className="space-y-4">
                                {isFetchingHistory ? (
                                    <div className="py-20 flex flex-col items-center">
                                        <div className="w-12 h-12 border-2 border-[#4C8CE4] border-t-transparent rounded-full animate-spin mb-4" />
                                        <p className="text-xs font-mono text-[#4C8CE4] uppercase tracking-widest">Decrypting logs...</p>
                                    </div>
                                ) : history.length === 0 ? (
                                    <div className="bg-[#0B0F1A]/50 border-2 border-[#406093]/30 rounded-2xl p-20 text-center">
                                        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#406093]/10 flex items-center justify-center border-2 border-[#406093]/30">
                                            <svg className="w-10 h-10 text-[#406093]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                        <h3 className="text-2xl font-black text-[#FFF799] mb-2">Operation History Empty</h3>
                                        <p className="text-sm text-gray-500">No past activations found in the neural archives.</p>
                                    </div>
                                ) : (
                                    <div className="bg-[#0B0F1A]/50 border-2 border-[#406093]/30 rounded-2xl overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="border-b border-[#406093]/30 bg-[#406093]/5">
                                                        <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Service</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Phone Number</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Cost</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">SMS/OTP</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">ID</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[#406093]/20">
                                                    {history.map((h) => (
                                                        <tr key={h.id} className="hover:bg-[#4C8CE4]/5 transition-colors group">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-lg bg-[#406093]/10 border border-[#406093]/30 flex items-center justify-center overflow-hidden">
                                                                        <LoadingImage
                                                                            src={`https://cdn.hero-sms.com/assets/img/service/${h.serviceCode}0.webp`}
                                                                            alt=""
                                                                            className="w-full h-full object-cover"
                                                                            containerClassName="w-full h-full"
                                                                            spinnerClassName="w-3 h-3 rounded-full border border-[#4C8CE4]/30 border-t-[#4C8CE4] animate-spin"
                                                                            fallback={
                                                                                <div className="w-full h-full flex items-center justify-center bg-[#4C8CE4]/10 text-[10px] font-black text-[#4C8CE4] uppercase">
                                                                                    {h.serviceCode?.slice(0, 2) || '??'}
                                                                                </div>
                                                                            }
                                                                        />
                                                                    </div>
                                                                    <span className="text-xs font-bold text-white uppercase">{getServiceName(h.serviceCode)}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="text-sm font-mono text-[#FFF799]">+{h.phone || h.phoneNumber}</span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="text-xs font-mono text-[#80C60C]">${h.activationCost || 0}</span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <StatusBadge status={h.activationStatus} />
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex flex-col gap-1 max-w-[200px]">
                                                                    {h.smsCode ? (
                                                                        <span className="text-sm font-black text-[#FFF799] tracking-widest font-mono">{h.smsCode}</span>
                                                                    ) : (
                                                                        <span className="text-[10px] text-gray-600 uppercase font-mono italic">No OTP Received</span>
                                                                    )}
                                                                    {h.smsText && <p className="text-[9px] text-gray-500 truncate leading-tight">{h.smsText}</p>}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <span className="text-[9px] font-mono text-gray-600">#{h.id}</span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── API KEYS TAB ── */}
                        {(!savedKey || tab === 'api') && (
                            <div className="max-w-2xl mx-auto">
                                <div className="bg-[#0B0F1A]/50 border-2 border-[#406093]/30 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.3)]">
                                    <div className="p-8 border-b border-[#406093]/30 bg-linear-to-br from-[#406093]/10 to-transparent">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-14 h-14 rounded-2xl bg-[#4C8CE4]/10 border-2 border-[#4C8CE4]/30 flex items-center justify-center text-[#4C8CE4]">
                                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-white uppercase tracking-tight">API Configuration</h3>
                                                <p className="text-xs text-gray-500">Manage your connection to the Hero SMS network.</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="block text-[10px] font-black text-[#4C8CE4] uppercase tracking-[0.2em] ml-1">Authentication Key</label>
                                                <div className="relative group">
                                                    <input
                                                        type={showKeyInput ? 'text' : 'password'}
                                                        value={apiKey}
                                                        onChange={e => setApiKey(e.target.value)}
                                                        className="w-full bg-[#0B0F1A] border-2 border-[#406093]/30 group-hover:border-[#406093]/60 focus:border-[#4C8CE4] rounded-2xl px-5 py-4 text-sm text-white placeholder-gray-600 focus:outline-none transition-all pr-12 font-mono"
                                                        placeholder="Paste your API key here..."
                                                    />
                                                    <button
                                                        onClick={() => setShowKeyInput(!showKeyInput)}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#4C8CE4]"
                                                    >
                                                        {showKeyInput ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.888 9.888L1.732 1.732m0 0a1 1 0 011.414 0l6.742 6.742M1.732 4.557l2.122-2.122M4.557 1.732l2.122 2.122M22.268 11.643a10.05 10.05 0 00-1.563-3.029m-5.858-4.108A10.003 10.003 0 0012 5c-4.478 0-8.268-2.943-9.543 7a9.97 9.97 0 001.563 3.029m5.858 4.108A10.003 10.003 0 0012 19c4.478 0 8.268-2.943 9.543-7a9.97 9.97 0 00-1.563-3.029" /></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                                                    </button>
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleSaveKey}
                                                disabled={isConfiguring || !apiKey.trim()}
                                                className="w-full py-4 bg-linear-to-r from-[#4C8CE4] to-[#80C60C] hover:opacity-90 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-[0_0_20px_rgba(76,140,228,0.3)] transition-all active:scale-[0.98] disabled:opacity-50"
                                            >
                                                {isConfiguring ? 'Decrypting Connection...' : 'Save & Establish Link'}
                                            </button>
                                        </div>
                                    </div>

                                    {savedKey && (
                                        <div className="p-8 bg-[#DA4848]/5 space-y-4">
                                            <div className="flex items-center gap-3 text-[#DA4848]">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                                <h4 className="text-xs font-black uppercase tracking-widest">Danger Zone</h4>
                                            </div>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Destroying the key will immediately reset your session and disconnect all active interfaces.</p>
                                            <button
                                                onClick={handleDestroyKey}
                                                className="w-full py-3 border-2 border-[#DA4848]/40 hover:bg-[#DA4848]/20 text-[#DA4848] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                            >
                                                Destroy Session Key
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-8 p-6 bg-[#4C8CE4]/5 border border-[#4C8CE4]/20 rounded-2xl">
                                    <h4 className="text-[10px] font-black text-[#4C8CE4] uppercase tracking-[0.2em] mb-3 ml-1">Documentation Reference</h4>
                                    <p className="text-xs text-gray-400 leading-relaxed">Your API key is used to authenticate requests to Hero SMS. Keep it secure and never share it. You can find your key in your personal Hero SMS dashboard under API settings.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}