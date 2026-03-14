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
        // Adjust these to change typing speed
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

export default function ChatbotPage() {
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
    const [responseLength, setResponseLength] = useState('long'); // 'short' | 'long' (now Recommended) | 'custom'
    const [showSettingsModal, setShowSettingsModal] = useState(false);

    const [sessions, setSessions] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [guidelineLang, setGuidelineLang] = useState('en');

    useEffect(() => {
        // Default to OPEN on desktop, CLOSED on mobile
        if (window.innerWidth >= 768) setIsSidebarOpen(true);
    }, []);

    const messagesEndRef = useRef(null);
    const router = useRouter();

    const fetchCredentials = async () => {
        try {
            setLoading(true);

            // 1. Check Auth (user role)
            const storedUser = localStorage.getItem('user_info');
            let userRole = null;
            if (storedUser) {
                try { userRole = JSON.parse(storedUser).role; } catch (e) { }
            }

            // 2. Check Maintenance (unless ULTRA)
            try {
                const mRes = await fetch('/api/maintenance', { cache: 'no-store' });
                if (mRes.ok) {
                    const mData = await mRes.json();
                    const cfg = mData.find(c => c.feature === 'chatbot');
                    if (cfg && cfg.enabled && userRole !== 'ULTRA') {
                        router.replace(`/maintenance?feature=chatbot&message=${encodeURIComponent(cfg.message || '')}`);
                        return;
                    }
                }
            } catch (err) { console.error('Maintenance check failed', err); }

            // 3. Fetch Credentials
            const res = await fetch('/api/chatbot/credential');

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
            const res = await fetch('/api/chatbot/session');
            if (res.ok) {
                const data = await res.json();
                setSessions(data.sessions || []);
            }
        } catch (e) { console.error("Failed to load sessions", e); }
    };

    const loadSession = async (id) => {
        try {
            setCurrentSessionId(id);
            setIsSidebarOpen(false); // Close on mobile after select
            const res = await fetch(`/api/chatbot/session/${id}`);
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
            const res = await fetch(`/api/chatbot/session/${id}`, { method: 'DELETE' });
            if (res.ok) {
                if (currentSessionId === id) createNewSession();
                fetchSessions();
            }
        } catch (e) { console.error("Failed to delete session", e) }
    };

    useEffect(() => {
        fetchCredentials();
    }, [router]);

    // Scroll to bottom of chat
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
            const res = await fetch('/api/chatbot/credential', {
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
                fetchCredentials(); // Reload active state
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
            await fetch('/api/chatbot/credential', { method: 'DELETE' });
            setHasCredential(false);
            setMaskedKey('');
            setShowKeyModal(false);
            setMessages([]); // Clear chat history
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

            // Create new session transparently if none exists
            if (!activeSessionId) {
                const sessionRes = await fetch('/api/chatbot/session', { method: 'POST' });
                if (sessionRes.ok) {
                    const sessionData = await sessionRes.json();
                    activeSessionId = sessionData.session.id;
                    setCurrentSessionId(activeSessionId);
                }
            }

            const res = await fetch('/api/chatbot/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: selectedModel,
                    sessionId: activeSessionId,
                    maxTokens,
                    responseLength,
                    // send previous context + new message
                    messages: newMessages.map(m => ({ role: m.role, content: m.content }))
                })
            });

            const data = await res.json();

            if (!res.ok) {
                setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${data.error || 'Failed to fetch'}` }]);
            } else {
                const reply = data.choices?.[0]?.message?.content || 'No response from AI.';
                // Add isTyping flag to animate the newly received message
                setMessages(prev => [...prev, { role: 'assistant', content: reply, isTyping: true }]);

                // Refresh session list to show updated title if this was the first message
                if (newMessages.length === 1) fetchSessions();

                // Update local usage safely
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
        { label: 'Dashboard', href: '/', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
        { label: 'Chatbot' }
    ];

    if (loading) {
        return (
            <div className="flex flex-col h-[calc(100vh-5rem)] md:h-[calc(100vh-2rem)] space-y-4 md:space-y-6">
                <HeroHeader
                    title="AI"
                    badge="Chatbot"
                    description="Powered by Groq Intelligence"
                    colorTheme="emerald"
                    breadcrumbs={breadcrumbs}
                    className="shrink-0"
                />
                <div className="flex-1 relative flex items-center justify-center min-h-0 bg-linear-to-b from-[#071310] to-[#010302] border border-emerald-500/20 rounded-3xl shadow-[0_0_20px_rgba(16,185,129,0.05)] overflow-hidden">
                    <LoadingState message="Locating Groq credentials..." colorTheme="emerald" />
                </div>
            </div>
        );
    }

    // ---------------------------------------------
    // SETUP KEY VIEW
    // ---------------------------------------------

    if (!hasCredential && !showKeyModal) {
        return (
            <div className="flex flex-col h-[calc(100vh-5rem)] md:h-[calc(100vh-2rem)] space-y-4 md:space-y-6">
                <HeroHeader
                    title="AI"
                    badge="Chatbot"
                    description="Powered by Groq Intelligence"
                    colorTheme="emerald"
                    breadcrumbs={breadcrumbs}
                    className="shrink-0"
                />
                <div className="flex-1 relative min-h-0 bg-linear-to-b from-[#071310] to-[#010302] border border-emerald-500/20 rounded-3xl shadow-[0_0_20px_rgba(16,185,129,0.05)] overflow-hidden">
                    {/* Top neon accent */}
                    <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-emerald-500/50 to-transparent opacity-50 pointer-events-none z-10" />
                    <div className="absolute top-0 inset-x-0 h-32 bg-emerald-500/5 blur-3xl pointer-events-none z-10" />

                    {/* Fixed Corner brackets */}
                    <span className="absolute top-4 left-4 w-5 h-5 border-t border-l border-emerald-500/30 pointer-events-none z-20" />
                    <span className="absolute top-4 right-4 w-5 h-5 border-t border-r border-emerald-500/30 pointer-events-none z-20" />
                    <span className="absolute bottom-4 left-4 w-5 h-5 border-b border-l border-emerald-500/15 pointer-events-none z-20" />
                    <span className="absolute bottom-4 right-4 w-5 h-5 border-b border-r border-emerald-500/15 pointer-events-none z-20" />

                    <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-5 md:p-12 flex flex-col">
                        <div className="flex-1 min-h-0 hidden md:block" />

                        <div className="w-full max-w-2xl text-center space-y-5 md:space-y-6 relative z-10 mx-auto py-4 md:py-0 shrink-0">
                            <div className="w-16 h-16 md:w-20 md:h-20 mx-auto rounded-2xl md:rounded-3xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-inner overflow-hidden">
                                <img src="/icons/chatbot.png" alt="Chatbot" className="w-10 h-10 md:w-12 md:h-12 object-contain" />
                            </div>

                            <div>
                                <h2 className="text-2xl md:text-3xl font-black text-white mb-2 md:mb-3">Connect Groq Intelligence</h2>
                                <p className="text-gray-400 text-sm md:text-lg leading-relaxed text-balance max-w-xl mx-auto">
                                    To unlock ultra-fast AI generation capabilities, simply provide your free Groq API Key.
                                    Your credentials are <strong className="text-emerald-400">AES-256 encrypted</strong> directly to your account.
                                </p>
                            </div>

                            {/* Guidelines Section */}
                            <div className="max-w-xl mx-auto w-full text-left relative group/guide">
                                {/* Guideline Card - Enhanced Glassmorphism */}
                                <div className="relative rounded-2xl overflow-hidden border border-emerald-500/20 bg-[#0d121f]/40 backdrop-blur-2xl shadow-[0_0_20px_rgba(16,185,129,0.05)] transition-all duration-500 group-hover/guide:shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                                    {/* Subtle inner glow */}
                                    <div className="absolute inset-0 bg-linear-to-br from-emerald-500/5 via-transparent to-teal-500/5 pointer-events-none" />

                                    {/* Top accent line */}
                                    <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-emerald-500/30 to-transparent" />

                                    {/* Header row */}
                                    <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-500/10 relative z-10">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[inset_0_0_10px_rgba(16,185,129,0.2)]">
                                                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            </div>
                                            <span className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.2em]">
                                                {guidelineLang === 'en' ? 'Setup Guide' : 'Panduan Setup'}
                                            </span>
                                        </div>

                                        {/* Professional Language Toggle */}
                                        <div className="flex items-center bg-black/60 rounded-full p-1 border border-emerald-500/20 shadow-inner">
                                            <button type="button" onClick={() => setGuidelineLang('en')}
                                                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${guidelineLang === 'en' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'text-emerald-500/50 hover:text-emerald-300'}`}>
                                                EN
                                            </button>
                                            <button type="button" onClick={() => setGuidelineLang('id')}
                                                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${guidelineLang === 'id' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'text-emerald-500/50 hover:text-emerald-300'}`}>
                                                ID
                                            </button>
                                        </div>
                                    </div>

                                    {/* Steps - Modern List */}
                                    <div className="px-6 py-5 space-y-4 relative z-10">
                                        {(guidelineLang === 'en' ? [
                                            <>Create a free account at <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors underline decoration-emerald-500/40 underline-offset-4">console.groq.com</a></>,
                                            <>Navigate to the <span className="text-white font-medium">API Keys</span> section in the sidebar.</>,
                                            <>Click <span className="text-white font-medium">"Create API Key"</span> and provide a name.</>,
                                            <>Copy the key (starts with <code className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/40 font-mono text-[10px] shadow-[inset_0_0_5px_rgba(16,185,129,0.2)] uppercase">gsk_</code>) and paste below.</>
                                        ] : [
                                            <>Buat akun gratis di <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors underline decoration-emerald-500/40 underline-offset-4">console.groq.com</a></>,
                                            <>Buka bagian <span className="text-white font-medium">API Keys</span> di menu samping.</>,
                                            <>Klik <span className="text-white font-medium">"Create API Key"</span> dan beri nama.</>,
                                            <>Salin key (diawali <code className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/40 font-mono text-[10px] shadow-[inset_0_0_5px_rgba(16,185,129,0.2)] uppercase">gsk_</code>) dan tempel di bawah.</>
                                        ]).map((step, i) => (
                                            <div key={i} className="flex items-start gap-4">
                                                <div className="shrink-0 w-6 h-6 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-emerald-400/80 text-[10px] font-black flex items-center justify-center mt-0.5 shadow-sm">{i + 1}</div>
                                                <p className="text-sm text-gray-400/90 leading-relaxed font-medium">{step}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div> {/* This div was missing, closing the w-full max-w-2xl container */}

                        {/* Token Input Form - Sleek Design */}
                        <form onSubmit={handleKeySubmit} className="max-w-xl mx-auto w-full space-y-4 pt-2">
                            <div className="relative group/input">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/input:text-emerald-400 transition-colors pointer-events-none z-10">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                                </div>
                                <input
                                    type="text"
                                    value={apiKeyInput}
                                    onChange={(e) => setApiKeyInput(e.target.value)}
                                    className="w-full bg-black/60 border border-emerald-500/20 rounded-2xl pl-13 pr-6 py-4 text-emerald-100 text-sm placeholder-emerald-900/60 focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all font-mono tracking-wider shadow-[inset_0_0_15px_rgba(0,0,0,0.5)]"
                                    placeholder="gsk_••••••••••••••••••••••••••••••••"
                                    required
                                />
                            </div>

                            {keyError && (
                                <div className="flex items-center gap-2 px-2 text-red-400 text-[10px] uppercase tracking-widest font-black animate-pulse">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    {keyError}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmittingKey || !apiKeyInput.trim()}
                                className="w-full py-4 bg-linear-to-r from-emerald-600/20 via-teal-600/20 to-emerald-600/20 hover:from-emerald-500/30 hover:via-teal-500/30 hover:to-emerald-500/30 border border-emerald-500/40 hover:border-emerald-400/60 bg-[length:200%_auto] hover:bg-right text-emerald-400 hover:text-emerald-300 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed shadow-[0_0_20px_rgba(16,185,129,0.1)] hover:shadow-[0_0_30px_rgba(16,185,129,0.25)] flex items-center justify-center gap-3 relative overflow-hidden group"
                            >
                                {isSubmittingKey ? (
                                    <>
                                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                        <span className="relative z-10">Verifying Identity...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                        <span className="relative z-10">Initialize Connection</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    <div className="flex-1 min-h-0 hidden md:block" />
                </div>
            </div>
        );
    }

    // ---------------------------------------------
    // CHAT VIEW
    // ---------------------------------------------
    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)] space-y-4 md:space-y-6">

            <HeroHeader
                title="AI"
                badge="Chatbot"
                description="Powered by Groq Intelligence"
                colorTheme="emerald"
                breadcrumbs={breadcrumbs}
                className="shrink-0"
            />

            <div className="flex-1 flex bg-linear-to-b from-[#071310] to-[#010302] rounded-3xl border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)] overflow-hidden relative min-h-0">

                {/* Top neon accent */}
                <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-emerald-500/50 to-transparent pointer-events-none opacity-50" />

                {/* --- Sidebar History --- */}
                <div className={`${isSidebarOpen ? 'w-64 border-r border-emerald-500/20 opacity-100' : 'w-0 opacity-0 overflow-hidden'} transition-all duration-300 flex flex-col bg-[#030806] md:bg-black/20 shrink-0 absolute md:relative z-30 h-full`}>
                    <div className="p-4">
                        <button onClick={createNewSession} className="w-full flex items-center gap-2 px-4 py-3 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/20 transition-colors text-sm font-semibold">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            New Chat
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1 custom-scrollbar">
                        {sessions.map(s => (
                            <div key={s.id} onClick={() => loadSession(s.id)} className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${currentSessionId === s.id ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-gray-400'}`}>
                                <div className="truncate text-sm flex-1">{s.title || "New Chat"}</div>
                                <button onClick={(e) => deleteSession(s.id, e)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all shrink-0">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* --- Main Chat Column --- */}
                <div className="flex-1 flex flex-col min-w-0 bg-[#0c1628]/80 relative z-10 w-full overflow-hidden">

                    {/* Mobile overlay backdrop when sidebar is open */}
                    {isSidebarOpen && (
                        <div
                            className="absolute inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
                            onClick={() => setIsSidebarOpen(false)}
                        />
                    )}

                    {/* --- Modals for Settings --- */}
                    {showKeyModal && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                            <div className="w-full max-w-sm bg-linear-to-b from-[#071310] to-[#030806] border border-emerald-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(16,185,129,0.1)] relative">
                                <h3 className="text-lg font-black text-white tracking-widest uppercase mb-1">API Key Settings</h3>
                                <p className="text-[10px] text-emerald-400/60 uppercase tracking-widest font-bold mb-5">Manage credentials</p>

                                <div className="mb-4">
                                    <label className="text-[9px] text-emerald-500 font-bold uppercase tracking-[0.2em] block mb-1.5">Current Masked Key</label>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 bg-black/40 border border-emerald-500/20 rounded-lg px-3 py-2 text-xs text-emerald-400 break-all">{maskedKey}</code>
                                        <button onClick={handleCopyKey} className="shrink-0 p-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-emerald-400 hover:text-emerald-300 transition-colors" title="Copy Raw Key">
                                            {copied ? (
                                                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <form onSubmit={handleKeySubmit} className="mb-6">
                                    <label className="text-[9px] text-emerald-500 font-bold uppercase tracking-[0.2em] block mb-1.5">Replace Key</label>
                                    <input
                                        type="text"
                                        value={apiKeyInput}
                                        onChange={(e) => setApiKeyInput(e.target.value)}
                                        className="w-full bg-black/40 border border-emerald-500/20 rounded-lg px-3 py-2 text-emerald-100 placeholder-emerald-900 focus:outline-none focus:border-emerald-500/50 transition-colors text-sm mb-2"
                                        placeholder="Paste new gsk_..."
                                    />
                                    {keyError && <p className="text-red-400 text-[10px] uppercase font-bold tracking-wider mb-2">{keyError}</p>}
                                    <button
                                        type="submit"
                                        disabled={isSubmittingKey || !apiKeyInput.trim()}
                                        className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-50 border border-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                                    >
                                        Update Key
                                    </button>
                                </form>

                                <div className="border-t border-emerald-500/10 pt-4 flex gap-3">
                                    <button onClick={() => { setShowKeyModal(false); setApiKeyInput(''); setKeyError(''); }} className="flex-1 py-2 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors">Close</button>
                                    <button onClick={handleDeleteKey} className="flex-1 py-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors">Remove Key</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {showSettingsModal && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                            <div className="w-full max-w-sm bg-linear-to-b from-[#071310] to-[#030806] border border-emerald-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(16,185,129,0.1)] relative">
                                <h3 className="text-lg font-black text-white tracking-widest uppercase mb-1">Chat Settings</h3>
                                <p className="text-[10px] text-emerald-400/60 font-bold uppercase tracking-widest mb-5">Configure response limits</p>

                                <div className="mb-4">
                                    <label className="text-[9px] text-emerald-500 font-bold uppercase tracking-[0.2em] block mb-2">
                                        Response Mode
                                    </label>
                                    <div className="flex bg-black/40 p-1 rounded-xl border border-emerald-500/20 relative">
                                        <button
                                            onClick={() => setResponseLength('short')}
                                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all z-10 ${responseLength === 'short' ? 'text-white' : 'text-emerald-500/60 hover:text-emerald-400'}`}
                                        >
                                            Short
                                        </button>
                                        <button
                                            onClick={() => setResponseLength('long')}
                                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all z-10 ${responseLength === 'long' ? 'text-white' : 'text-emerald-500/60 hover:text-emerald-400'}`}
                                        >
                                            Normal
                                        </button>
                                        <button
                                            onClick={() => setResponseLength('custom')}
                                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all z-10 ${responseLength === 'custom' ? 'text-white' : 'text-emerald-500/60 hover:text-emerald-400'}`}
                                        >
                                            Custom
                                        </button>

                                        {/* Sliding Toggle Background */}
                                        <div
                                            className="absolute top-1 bottom-1 w-[calc(33.33%-4px)] bg-emerald-600/30 border border-emerald-500/30 rounded-lg transition-transform duration-300 ease-out z-0 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                                            style={{
                                                transform: responseLength === 'short'
                                                    ? 'translateX(0)'
                                                    : responseLength === 'long'
                                                        ? 'translateX(calc(100% + 4px))'
                                                        : 'translateX(calc(200% + 8px))'
                                            }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-2 text-center">
                                        {responseLength === 'short' && 'AI will summarize strictly to max 5 paragraphs.'}
                                        {responseLength === 'long' && 'AI will answer naturally with no hard limits or forced summaries.'}
                                        {responseLength === 'custom' && 'You define the absolute maximum token cut-off.'}
                                    </p>
                                </div>

                                <div className={`mb-6 transition-opacity ${responseLength !== 'custom' ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <label className="text-[9px] text-emerald-500 font-bold uppercase tracking-[0.2em] flex justify-between mb-2">
                                        <span>Max Tokens (Absolute limit)</span>
                                        <span className="text-emerald-300">{responseLength !== 'custom' ? 'Auto' : maxTokens}</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="100"
                                        max="4000"
                                        step="100"
                                        value={maxTokens}
                                        onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                                        className="w-full accent-emerald-500"
                                        disabled={responseLength !== 'custom'}
                                    />
                                    <p className="text-[10px] text-emerald-400/50 mt-1">Hard limit cut-off. High limits may cause Groq API errors.</p>
                                </div>

                                <div className="border-t border-emerald-500/10 pt-4 flex gap-3">
                                    <button onClick={() => setShowSettingsModal(false)} className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors border border-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]">Done</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- Top Navbar --- */}
                    <div className="flex items-center justify-between p-3 border-b border-emerald-500/10 bg-[#030806]/50 backdrop-blur-md z-10 shrink-0">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors border border-white/5">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
                            </button>
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 hidden sm:flex items-center justify-center">
                                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                            </div>
                            <div className="relative group cursor-pointer border border-transparent hover:border-white/10 rounded-lg pr-8 pl-2 py-1 transition-all">
                                <select
                                    value={selectedModel}
                                    onChange={(e) => setSelectedModel(e.target.value)}
                                    className="bg-transparent text-sm font-bold text-white focus:outline-none appearance-none cursor-pointer hover:text-emerald-300 transition-colors absolute inset-0 w-full h-full opacity-0 z-20"
                                >
                                    <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Versatile)</option>
                                    <option value="llama-3.1-8b-instant">Llama 3.1 8B (Instant)</option>
                                    <option value="meta-llama/llama-4-scout-17b-16e-instruct">Llama 4 Scout (17B)</option>
                                    <option value="meta-llama/llama-4-maverick-17b-128e-instruct">Llama 4 Maverick (17B)</option>
                                    <option value="meta-llama/llama-guard-4-12b">Llama Guard 4 (12B)</option>
                                    <option value="meta-llama/llama-prompt-guard-2-22m">Llama Prompt Guard 2 (22M)</option>
                                    <option value="meta-llama/llama-prompt-guard-2-86m">Llama Prompt Guard 2 (86M)</option>
                                    <option value="qwen/qwen3-32b">Qwen 3 (32B)</option>
                                    <option value="moonshotai/kimi-k2-instruct">Kimi 2 (Instruct)</option>
                                    <option value="moonshotai/kimi-k2-instruct-0905">Kimi 2 (Instruct 0905)</option>
                                    <option value="openai/gpt-oss-120b">GPT OSS (120B)</option>
                                    <option value="openai/gpt-oss-20b">GPT OSS (20B)</option>
                                    <option value="openai/gpt-oss-safeguard-20b">GPT OSS Safeguard (20B)</option>
                                    <option value="allam-2-7b">Allam 2 (7B)</option>
                                    <option value="groq/compound">Groq Compound</option>
                                    <option value="groq/compound-mini">Groq Compound Mini</option>
                                </select>
                                <div className="relative z-10 pointer-events-none flex flex-col">
                                    <div className="flex items-center gap-1.5 text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                                        {selectedModel}
                                        <svg className="w-3.5 h-3.5 opacity-50 block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                    <div className="text-[10px] text-gray-500 font-medium leading-none mt-0.5">Powered by Groq</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 md:gap-4">
                            {/* Usage Stats Badge */}
                            <div className="hidden md:flex flex-col items-end mr-2">
                                <div className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Token Usage</div>
                                <div className="text-xs font-bold text-emerald-400">{usage.totalTokens.toLocaleString()} Total</div>
                            </div>

                            <button
                                onClick={() => setShowSettingsModal(true)}
                                className="p-2 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                title="Chat Settings"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                            </button>

                            <button
                                onClick={() => setShowKeyModal(true)}
                                className="p-2 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                title="API Settings"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* --- Chat History --- */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 md:space-y-8 scroll-smooth">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-50">
                                <svg className="w-12 h-12 text-emerald-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                <p className="text-gray-400 font-medium">How can I assist you today?</p>
                            </div>
                        ) : (
                            messages.map((msg, i) => (
                                <div key={i} className={`flex gap-3 md:gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {msg.role === 'assistant' && (
                                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-1 overflow-hidden">
                                            <img src="/icons/chatbot.png" alt="AI" className="w-5 h-5 object-contain" />
                                        </div>
                                    )}

                                    <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 shadow-md ${msg.role === 'user' ? 'bg-linear-to-tr from-emerald-600 to-teal-600 border mx-1 border-emerald-400/30 text-white rounded-br-none whitespace-pre-wrap shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'bg-black/40 border border-emerald-500/20 text-emerald-50/90 rounded-bl-none overflow-x-auto shadow-[0_0_15px_rgba(16,185,129,0.05)]'}`}>
                                        {msg.isTyping ? (
                                            <div className="prose prose-invert prose-emerald prose-sm max-w-none">
                                                <TypingEffect
                                                    content={msg.content}
                                                    scrollTrigger={scrollToBottom}
                                                    onComplete={() => {
                                                        setMessages(prev => prev.map((m, idx) => idx === i ? { ...m, isTyping: false } : m));
                                                    }}
                                                />
                                            </div>
                                        ) : msg.role === 'assistant' ? (
                                            <div className="prose prose-invert prose-emerald prose-sm max-w-none">
                                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                                            </div>
                                        ) : (
                                            msg.content
                                        )}
                                    </div>

                                    {msg.role === 'user' && (
                                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center shrink-0 mt-1 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                                            <svg className="w-4 h-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}

                        {isThinking && (
                            <div className="flex gap-4 justify-start">
                                <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-1 overflow-hidden">
                                    <img src="/icons/chatbot.png" alt="Thinking" className="w-5 h-5 object-contain animate-pulse" />
                                </div>
                                <div className="bg-black/40 border border-emerald-500/20 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                                    <span className="w-1.5 h-1.5 bg-emerald-500/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1.5 h-1.5 bg-emerald-400/80 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* --- Input Box --- */}
                    <div className="p-4 border-t border-emerald-500/10 bg-[#030806]/80 backdrop-blur-md shrink-0 relative">
                        <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-emerald-500/30 to-transparent pointer-events-none opacity-50" />
                        <form onSubmit={sendMessage} className="relative flex items-end gap-2 max-w-4xl mx-auto">
                            <textarea
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        sendMessage(e);
                                    }
                                }}
                                placeholder="Init Groq connection..."
                                className="w-full bg-black/40 border border-emerald-500/20 rounded-2xl px-4 py-3 md:py-4 text-sm text-emerald-50 placeholder-emerald-800 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 transition-all resize-none min-h-[50px] max-h-32 [&::-webkit-scrollbar]:hidden shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]"
                                style={{ height: inputMessage.split('\n').length * 24 + 26, scrollbarWidth: 'none' }}
                                disabled={isThinking}
                            />
                            <button
                                type="submit"
                                disabled={!inputMessage.trim() || isThinking}
                                className="shrink-0 p-3 md:p-4 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-400 rounded-2xl transition-all disabled:opacity-30 disabled:grayscale disabled:border-white/5 disabled:bg-white/5 disabled:text-gray-600 disabled:cursor-not-allowed mb-0.5 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                            </button>
                        </form>
                        <div className="text-center mt-2 pb-1">
                            <span className="text-[9px] font-bold text-emerald-500/40 uppercase tracking-widest">Groq Intelligence Node Active</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
