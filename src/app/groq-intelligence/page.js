'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { HeroHeader, LoadingState } from '@/components/HeroHeader';

const TypingEffect = ({ content, scrollTrigger, onComplete }) => {
    const [displayedContent, setDisplayedContent] = useState('');
    const scrollTriggerRef = useRef(scrollTrigger);
    const onCompleteRef = useRef(onComplete);

    useEffect(() => {
        scrollTriggerRef.current = scrollTrigger;
        onCompleteRef.current = onComplete;
    }, [scrollTrigger, onComplete]);

    useEffect(() => {
        let i = 0;
        const charsPerTick = 3;
        const intervalMs = 15;

        const interval = setInterval(() => {
            if (i < content.length) {
                setDisplayedContent(content.substring(0, i + charsPerTick));
                i += charsPerTick;
                if (scrollTriggerRef.current) scrollTriggerRef.current();
            } else {
                setDisplayedContent(content);
                clearInterval(interval);
                if (onCompleteRef.current) onCompleteRef.current();
            }
        }, intervalMs);

        return () => clearInterval(interval);
    }, [content]);

    return <>{displayedContent}</>;
};

export default function GroqIntelligencePage() {
    const [hasCredential, setHasCredential] = useState(false);
    const [maskedKey, setMaskedKey] = useState('');
    const [rawKey, setRawKey] = useState('');
    const [usage, setUsage] = useState({ promptTokens: 0, completionTokens: 0, totalTokens: 0 });
    const [loading, setLoading] = useState(true);
    const [isSubmittingKey, setIsSubmittingKey] = useState(false);
    const [apiKeyInput, setApiKeyInput] = useState('');
    const [keyError, setKeyError] = useState('');

    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [selectedModel, setSelectedModel] = useState('llama-3.3-70b-versatile');
    const [showKeyModal, setShowKeyModal] = useState(false);
    const [copied, setCopied] = useState(false);
    const [maxTokens, setMaxTokens] = useState(2000);
    const [responseLength, setResponseLength] = useState('long');
    const [showSettingsModal, setShowSettingsModal] = useState(false);

    const [sessions, setSessions] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [guidelineLang, setGuidelineLang] = useState('en');

    useEffect(() => {
        // Sidebar is closed by default for all screen sizes as requested
    }, []);

    const messagesEndRef = useRef(null);
    const router = useRouter();

    const fetchCredentials = async () => {
        try {
            setLoading(true);

            const storedUser = localStorage.getItem('user_info');
            let userRole = null;
            if (storedUser) {
                try { userRole = JSON.parse(storedUser).role; } catch (e) { }
            }

            try {
                const mRes = await fetch('/api/maintenance', { cache: 'no-store' });
                if (mRes.ok) {
                    const mData = await mRes.json();
                    const cfg = mData.find(c => c.feature === 'groq-intelligence');
                    if (cfg && cfg.enabled && userRole !== 'ULTRA') {
                        router.replace(`/maintenance?feature=groq-intelligence&message=${encodeURIComponent(cfg.message || '')}`);
                        return;
                    }
                }
            } catch (err) { console.error('Maintenance check failed', err); }

            const res = await fetch('/api/groq-intelligence/credential');

            if (res.status === 401) {
                router.push('/login');
                return;
            }

            const data = await res.json();
            if (data.hasCredential) {
                setHasCredential(true);
                setMaskedKey(data.maskedKey);
                setRawKey(data.rawKey);
                setUsage(data.usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 });
                fetchSessions();
            } else {
                setHasCredential(false);
            }
        } catch (error) {
            console.error("Failed to fetch credentials", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSessions = async () => {
        try {
            const res = await fetch('/api/groq-intelligence/session');
            if (res.ok) {
                const data = await res.json();
                setSessions(data.sessions || []);
            }
        } catch (e) { console.error("Failed to load sessions", e); }
    };

    const loadSession = async (id) => {
        try {
            setCurrentSessionId(id);
            setIsSidebarOpen(false);
            const res = await fetch(`/api/groq-intelligence/session/${id}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages || []);
            }
        } catch (e) { console.error("Failed to load session history", e); }
    };

    const createNewSession = () => {
        setCurrentSessionId(null);
        setMessages([]);
        setIsSidebarOpen(false);
    };

    const deleteSession = async (id, e) => {
        e.stopPropagation();
        if (!confirm("Delete this chat?")) return;
        try {
            const res = await fetch(`/api/groq-intelligence/session/${id}`, { method: 'DELETE' });
            if (res.ok) {
                if (currentSessionId === id) createNewSession();
                fetchSessions();
            }
        } catch (e) { console.error("Failed to delete session", e) }
    };

    useEffect(() => {
        fetchCredentials();
    }, [router]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleKeySubmit = async (e) => {
        e.preventDefault();
        setKeyError('');
        setIsSubmittingKey(true);

        try {
            const res = await fetch('/api/groq-intelligence/credential', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey: apiKeyInput })
            });

            const data = await res.json();

            if (!res.ok) {
                setKeyError(data.error || 'Failed to validate API Key');
            } else {
                setApiKeyInput('');
                setShowKeyModal(false);
                fetchCredentials();
            }
        } catch (err) {
            setKeyError('Network error testing key.');
        } finally {
            setIsSubmittingKey(false);
        }
    };

    const handleDeleteKey = async () => {
        if (!confirm("Are you sure you want to remove your API key and reset your token usage?")) return;
        try {
            await fetch('/api/groq-intelligence/credential', { method: 'DELETE' });
            setHasCredential(false);
            setMaskedKey('');
            setShowKeyModal(false);
            setMessages([]);
        } catch (err) {
            console.error("Failed to delete key", err);
        }
    };

    const handleCopyKey = () => {
        if (rawKey) {
            navigator.clipboard.writeText(rawKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        const trimmed = inputMessage.trim();
        if (!trimmed || isThinking) return;

        const newMessages = [...messages, { role: 'user', content: trimmed }];
        setMessages(newMessages);
        setInputMessage('');
        setIsThinking(true);

        try {
            let activeSessionId = currentSessionId;

            if (!activeSessionId) {
                const sessionRes = await fetch('/api/groq-intelligence/session', { method: 'POST' });
                if (sessionRes.ok) {
                    const sessionData = await sessionRes.json();
                    activeSessionId = sessionData.session.id;
                    setCurrentSessionId(activeSessionId);
                }
            }

            const res = await fetch('/api/groq-intelligence/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: selectedModel,
                    sessionId: activeSessionId,
                    maxTokens,
                    responseLength,
                    messages: newMessages.map(m => ({ role: m.role, content: m.content }))
                })
            });

            const data = await res.json();

            if (!res.ok) {
                setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${data.error || 'Failed to fetch'}` }]);
            } else {
                const reply = data.choices?.[0]?.message?.content || 'No response from AI.';
                setMessages(prev => [...prev, { role: 'assistant', content: reply, isTyping: true }]);

                if (newMessages.length === 1) fetchSessions();

                if (data.usage) {
                    setUsage(prev => ({
                        promptTokens: prev.promptTokens + (data.usage.prompt_tokens || 0),
                        completionTokens: prev.completionTokens + (data.usage.completion_tokens || 0),
                        totalTokens: prev.totalTokens + (data.usage.total_tokens || 0)
                    }));
                }
            }
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Network error communicating with AI.' }]);
        } finally {
            setIsThinking(false);
        }
    };

    const breadcrumbs = [
        { label: 'Dashboard', href: '/' },
        { label: 'Groq Intelligence' }
    ];


    // ============================================= 
    // SETUP KEY VIEW - MODIFIED UI
    // =============================================


    // =============================================
    // CHAT VIEW - MODIFIED UI
    // =============================================
    return (
        <div className="min-h-screen bg-linear-to-br from-[#050a0e] via-[#0a1419] to-[#030609] flex flex-col">
            <HeroHeader
                breadcrumbs={breadcrumbs}
                title="Groq Intelligence"
                description="Advanced AI Acceleration"
                colorTheme="emerald"
            />

            {/* Sidebar and Overlay moved back inside content container for local behavior */}

            <div className="flex-1 flex flex-col relative overflow-hidden">
                {/* Corner brackets removed per user request */}

                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <LoadingState message="Initializing AI Interface..." colorTheme="emerald" />
                    </div>
                ) : !hasCredential && !showKeyModal ? (
                    <div className="flex-1 overflow-y-auto pb-20 custom-scrollbar">
                        <div className="w-full mx-auto py-8 lg:py-12 space-y-8">
                            <div className="relative">
                                <div className="absolute -inset-1 bg-linear-to-r from-emerald-500/20 via-cyan-500/20 to-emerald-500/20 blur-xl" />
                                <div className="relative bg-black/40 border border-emerald-500/30 p-8" style={{ clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))' }}>
                                    <div className="flex items-start gap-6">
                                        <div className="shrink-0 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                                            <img src="/icons/chatbot.png" alt="Groq Intelligence" className="w-12 h-12" />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-linear-to-r from-emerald-300 via-cyan-300 to-teal-400 mb-3">Connect Groq Intelligence</h2>
                                            <p className="text-emerald-100/70 leading-relaxed">To unlock ultra-fast AI generation capabilities, simply provide your free Groq API Key. Your credentials are <span className="text-emerald-400 font-bold">AES-256 encrypted</span> directly to your account.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="relative">
                                <div className="absolute -top-2 -left-2 w-20 h-20 border-l-2 border-t-2 border-emerald-500/40" />
                                <div className="absolute -top-2 -right-2 w-20 h-20 border-r-2 border-t-2 border-cyan-500/40" />
                                <div className="absolute -bottom-2 -left-2 w-20 h-20 border-l-2 border-b-2 border-cyan-500/40" />
                                <div className="absolute -bottom-2 -right-2 w-20 h-20 border-r-2 border-b-2 border-emerald-500/40" />
                                <div className="relative bg-linear-to-br from-emerald-950/30 via-black/60 to-cyan-950/30 backdrop-blur-sm border-2 border-emerald-500/20 p-8">
                                    <div className="relative flex items-center justify-between mb-8 pb-4 border-b-2 border-emerald-500/20">
                                        <div className="flex items-center gap-3"><div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" /><h3 className="text-xl font-black text-emerald-300 tracking-wide uppercase">{guidelineLang === 'en' ? 'Setup Guide' : 'Panduan Setup'}</h3></div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setGuidelineLang('en')} className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${guidelineLang === 'en' ? 'bg-emerald-500/30 text-emerald-300 border-2 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-emerald-500/50 hover:text-emerald-300 border-2 border-transparent'}`} style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}>EN</button>
                                            <button onClick={() => setGuidelineLang('id')} className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${guidelineLang === 'id' ? 'bg-emerald-500/30 text-emerald-300 border-2 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-emerald-500/50 hover:text-emerald-300 border-2 border-transparent'}`} style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}>ID</button>
                                        </div>
                                    </div>
                                    <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(guidelineLang === 'en' ? [
                                            <>Create a free account at <a href="https://console.groq.com" className="text-cyan-400 hover:text-cyan-300 underline" target="_blank" rel="noopener noreferrer">console.groq.com</a></>,
                                            <>Navigate to the API Keys section in the sidebar.</>,
                                            <>Click "Create API Key" and provide a name.</>,
                                            <>Copy the key and paste below.</>
                                        ] : [
                                            <>Buat akun gratis di <a href="https://console.groq.com" className="text-cyan-400 hover:text-cyan-300 underline" target="_blank" rel="noopener noreferrer">console.groq.com</a></>,
                                            <>Buka bagian API Keys di menu samping.</>,
                                            <>Klik "Create API Key" dan beri nama.</>,
                                            <>Salin key dan tempel di bawah.</>
                                        ]).map((step, i) => (
                                            <div key={i} className="relative group">
                                                <div className="absolute inset-0 bg-linear-to-br from-emerald-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="relative bg-black/40 border border-emerald-500/20 p-4 transition-all group-hover:border-emerald-500/40" style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}>
                                                    <div className="flex items-start gap-4">
                                                        <div className="shrink-0 w-10 h-10 bg-linear-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center font-black text-emerald-300" style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}>{i + 1}</div>
                                                        <p className="flex-1 text-sm text-emerald-100/80 leading-relaxed pt-2">{step}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleKeySubmit} className="relative space-y-4">
                                <div className="absolute -inset-0.5 bg-linear-to-r from-emerald-500/30 via-cyan-500/30 to-emerald-500/30 blur opacity-50" />
                                <div className="relative bg-black/60 border-2 border-emerald-500/30 p-6">
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg></div>
                                        <input type="password" value={apiKeyInput} onChange={(e) => setApiKeyInput(e.target.value)} className="w-full bg-black/60 border-2 border-emerald-500/20 pl-14 pr-6 py-4 text-emerald-100 text-sm placeholder-emerald-900/60 focus:outline-none focus:border-emerald-500/60 focus:ring-4 focus:ring-emerald-500/10 transition-all font-mono tracking-wider" style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }} placeholder="gsk_••••••••••••••••••••••••••••••••" required />
                                    </div>
                                    {keyError && <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{keyError}</div>}
                                    <button type="submit" disabled={isSubmittingKey} className="mt-4 w-full bg-linear-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white py-4 font-black text-sm uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2 border-emerald-400/20 shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)]" style={{ clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)' }}>
                                        {isSubmittingKey ? 'Verifying...' : 'Initialize Connection'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex overflow-hidden relative">
                        {/* Sidebar History - Local to the card content area */}
                        <div className={`absolute lg:relative inset-y-0 left-0 z-40 bg-black/90 backdrop-blur-md border-r-2 border-emerald-500/20 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-72 opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-full lg:translate-x-0 overflow-hidden'}`}>
                            <div className="p-4 border-b-2 border-emerald-500/20">
                                <button onClick={createNewSession} className="w-full bg-linear-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white py-3 px-4 font-black text-xs uppercase tracking-widest transition-all border border-emerald-400/20" style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}>New Chat</button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                                {sessions.map(s => (
                                    <div key={s.id} onClick={() => loadSession(s.id)} className={`flex items-center justify-between p-3 cursor-pointer transition-all border ${currentSessionId === s.id ? 'bg-emerald-500/20 border-emerald-500/50 text-white' : 'border-emerald-500/10 hover:bg-emerald-500/10 text-gray-400'}`} style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}>
                                        <span className="flex-1 text-sm truncate">{s.title || "New Chat"}</span>
                                        <button onClick={(e) => deleteSession(s.id, e)} className="p-1 hover:text-red-400"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Local Overlay for mobile */}
                        {isSidebarOpen && <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
                        {/* --- Main Chat Column --- */}
                        <div className="flex-1 flex flex-col min-w-0">
                            <div className="bg-black/60 backdrop-blur-sm border-b-2 border-emerald-500/20 p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-white/5 border border-white/5 text-gray-400 hover:text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg></button>
                                    <div className="relative flex-1 md:flex-none">
                                        <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="absolute inset-0 w-full opacity-0 z-20 cursor-pointer">
                                            <option value="groq/compound">groq/compound</option>
                                            <option value="groq/compound-mini">groq/compound-mini</option>
                                            <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile</option>
                                            <option value="openai/gpt-oss-120b">openai/gpt-oss-120b</option>
                                            <option value="qwen/qwen3-32b">qwen/qwen3-32b</option>
                                        </select>
                                        <div className="px-3 md:px-4 py-1.5 md:py-2 bg-emerald-500/10 border border-emerald-500/30 text-[10px] md:text-sm font-bold text-white flex items-center justify-between md:justify-start gap-2 min-w-[140px]">
                                            <span className="truncate">{selectedModel}</span> 
                                            <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => setShowSettingsModal(true)} className="p-2 border border-white/10 text-gray-400 hover:text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>
                                        <button onClick={() => setShowKeyModal(true)} className="p-2 border border-white/10 text-gray-400 hover:text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg></button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto px-4 md:px-6 py-8 space-y-8 custom-scrollbar">
                                {messages.length === 0 ? <div className="h-full flex items-center justify-center text-emerald-300 font-bold">How can I assist you today?</div> : messages.map((msg, i) => (
                                    <div key={i} className={`flex gap-3 md:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                        {/* Avatar */}
                                        <div className="shrink-0">
                                            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 flex items-center justify-center overflow-hidden bg-black/40 ${msg.role === 'user' ? 'border-emerald-500/40' : 'border-cyan-500/40'}`}>
                                                {msg.role === 'user' ? (
                                                    <svg className="w-5 h-5 md:w-6 md:h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                ) : (
                                                    <img src="/icons/chatbot.png" alt="Groq Intelligence" className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className={`flex-1 max-w-[85%] md:max-w-3xl ${msg.role === 'user' ? 'text-right flex flex-col items-end' : ''}`}>
                                            <div className={`p-3 md:p-4 ${msg.role === 'user' ? 'bg-emerald-600/30 border-2 border-emerald-500/40 text-emerald-50' : 'bg-black/40 border-2 border-emerald-500/20 text-emerald-100/90'}`} style={{ clipPath: msg.role === 'user' ? 'polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' : 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}>
                                                {msg.isTyping ? <TypingEffect content={msg.content} scrollTrigger={scrollToBottom} onComplete={() => setMessages(prev => prev.map((m, idx) => idx === i ? { ...m, isTyping: false } : m))} /> : <div className="prose prose-invert prose-emerald max-w-none text-xs md:text-sm leading-relaxed"><ReactMarkdown>{msg.content}</ReactMarkdown></div>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {isThinking && <div className="animate-pulse text-emerald-400">Thinking...</div>}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="border-t-2 border-emerald-500/20 bg-black/60 p-6">
                                <form onSubmit={sendMessage} className="max-w-4xl mx-auto relative">
                                    <div className="relative flex gap-3 items-end bg-black/80 border-2 border-emerald-500/30 p-3" style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}>
                                        <textarea value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} placeholder="Type your message..." className="flex-1 bg-transparent text-emerald-100 focus:outline-none resize-none min-h-[60px]" rows={1} disabled={isThinking} />
                                        <button type="submit" disabled={isThinking || !inputMessage.trim()} className="p-3 bg-emerald-600 text-white transition-all disabled:opacity-40" style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg></button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showKeyModal && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
                    <div className="bg-black border-2 border-emerald-500/30 p-8 w-full max-w-lg" style={{ clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)' }}>
                        <h3 className="text-xl text-emerald-300 mb-4">API Key Settings</h3>
                        <div className="space-y-4">
                            <div className="relative group">
                                <code className="block p-4 bg-black/40 border border-emerald-500/20 text-emerald-100 text-xs mb-4 truncate pr-12">{maskedKey}</code>
                                <button onClick={handleCopyKey} className="absolute right-2 top-2 p-2 text-emerald-500/50 hover:text-emerald-400 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                    {copied && <span className="absolute -top-8 right-0 text-[10px] bg-emerald-500 text-white px-2 py-1">Copied!</span>}
                                </button>
                            </div>
                            <input type="password" value={apiKeyInput} onChange={(e) => setApiKeyInput(e.target.value)} className="w-full bg-black/40 border border-emerald-500/20 rounded px-3 py-3 text-emerald-100 text-sm mb-4" placeholder="Update with new gsk_..." />
                            <div className="flex flex-wrap gap-2">
                                <button onClick={handleKeySubmit} className="flex-1 min-w-[120px] py-3 bg-emerald-600/20 text-emerald-400 text-xs font-black uppercase hover:bg-emerald-600/30 border border-emerald-500/30 transition-all">Update Key</button>
                                <button onClick={handleDeleteKey} className="flex-1 min-w-[120px] py-3 bg-red-500/10 text-red-400 text-xs font-black uppercase hover:bg-red-500/20 border border-red-500/30 transition-all">Revoke Key</button>
                                <button onClick={() => setShowKeyModal(false)} className="w-full py-3 bg-emerald-500/5 text-emerald-400 text-xs font-black uppercase border border-emerald-500/10 hover:bg-emerald-500/10 transition-all">Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showSettingsModal && (<div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6"><div className="bg-black border-2 border-emerald-500/30 p-8 w-full max-w-lg" style={{ clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)' }}><h3 className="text-xl text-emerald-300 mb-4">Chat Settings</h3><div className="space-y-6"><div><p className="text-xs text-emerald-400 mb-2">Response Mode</p><div className="flex gap-2"><button onClick={() => setResponseLength('short')} className={`flex-1 py-2 text-xs font-black ${responseLength === 'short' ? 'bg-emerald-500/30 text-white' : 'text-emerald-500/60'}`}>Short</button><button onClick={() => setResponseLength('long')} className={`flex-1 py-2 text-xs font-black ${responseLength === 'long' ? 'bg-emerald-500/30 text-white' : 'text-emerald-500/60'}`}>Normal</button></div></div><button onClick={() => setShowSettingsModal(false)} className="w-full py-3 bg-emerald-600/20 text-emerald-400 text-xs font-black uppercase">Done</button></div></div></div>)}
        </div>
    );
}

