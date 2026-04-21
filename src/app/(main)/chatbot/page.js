'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { HeroHeader, LoadingState } from '@/components/HeroHeader';

// Dummy data for preview
const DUMMY_MODELS = [
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI', color: 'from-purple-500 to-pink-500' },
    { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', color: 'from-orange-500 to-red-500' },
    { id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google', color: 'from-blue-500 to-cyan-500' },
    { id: 'llama-3-70b', name: 'Llama 3 70B', provider: 'Meta', color: 'from-emerald-500 to-teal-500' },
    { id: 'mistral-large', name: 'Mistral Large', provider: 'Mistral AI', color: 'from-indigo-500 to-purple-500' },
];

const DUMMY_SESSIONS = [
    { id: '1', title: 'Web Development Tips', timestamp: '2 hours ago', preview: 'How to optimize React performance...' },
    { id: '2', title: 'Python Data Analysis', timestamp: '1 day ago', preview: 'Best practices for pandas...' },
    { id: '3', title: 'UI/UX Design Principles', timestamp: '3 days ago', preview: 'Creating modern interfaces...' },
    { id: '4', title: 'API Integration Guide', timestamp: '1 week ago', preview: 'RESTful API best practices...' },
    
];

const DUMMY_MESSAGES = [
    {
        role: 'user',
        content: 'Can you explain the benefits of using Next.js for modern web applications?'
    },
    {
        role: 'assistant',
        content: `Next.js offers several powerful benefits for modern web development:

**1. Server-Side Rendering (SSR)**
- Improved SEO and initial page load performance
- Dynamic content rendering on the server

**2. Static Site Generation (SSG)**
- Pre-render pages at build time
- Excellent performance for static content

**3. API Routes**
- Built-in API endpoints without separate backend
- Serverless function support

**4. File-based Routing**
- Intuitive routing based on file structure
- Automatic code splitting

**5. Image Optimization**
- Automatic image optimization and lazy loading
- WebP format support

These features make Next.js ideal for building fast, SEO-friendly, and scalable web applications.`
    },
    {
        role: 'user',
        content: 'What about performance optimization techniques?'
    },
    {
        role: 'assistant',
        content: `Here are key performance optimization techniques for Next.js:

**Code Optimization:**
- Use dynamic imports for code splitting
- Implement lazy loading for components
- Minimize bundle size with tree shaking

**Image & Asset Optimization:**
- Use Next.js Image component
- Compress and optimize images
- Implement CDN for static assets

**Caching Strategies:**
- Leverage ISR (Incremental Static Regeneration)
- Implement proper cache headers
- Use SWR for data fetching

**Monitoring:**
- Use Lighthouse for performance audits
- Implement Core Web Vitals tracking
- Monitor bundle size regularly

These techniques will significantly improve your application's performance and user experience.`
    }
];

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

export default function ChatbotPage() {
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState(DUMMY_MESSAGES);
    const [inputMessage, setInputMessage] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [selectedModel, setSelectedModel] = useState(DUMMY_MODELS[0]);
    const [sessions, setSessions] = useState(DUMMY_SESSIONS);
    const [currentSessionId, setCurrentSessionId] = useState('1');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showModelSelector, setShowModelSelector] = useState(false);

    const messagesEndRef = useRef(null);
    const router = useRouter();

    useEffect(() => {
        // Simulate loading
        setTimeout(() => setLoading(false), 1000);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const createNewSession = () => {
        setCurrentSessionId(null);
        setMessages([]);
        setIsSidebarOpen(false);
    };

    const loadSession = (id) => {
        setCurrentSessionId(id);
        setIsSidebarOpen(false);
        // In real implementation, load messages from API
        if (id === '1') {
            setMessages(DUMMY_MESSAGES);
        } else {
            setMessages([]);
        }
    };

    const deleteSession = (id, e) => {
        e.stopPropagation();
        if (!confirm("Delete this chat?")) return;
        setSessions(sessions.filter(s => s.id !== id));
        if (currentSessionId === id) createNewSession();
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        const trimmed = inputMessage.trim();
        if (!trimmed || isThinking) return;

        const newMessages = [...messages, { role: 'user', content: trimmed }];
        setMessages(newMessages);
        setInputMessage('');
        setIsThinking(true);

        // Simulate AI response
        setTimeout(() => {
            const dummyResponse = `This is a demo response from ${selectedModel.name}. In production, this would connect to the actual AI model API and provide real responses based on your query: "${trimmed}"`;
            setMessages(prev => [...prev, { role: 'assistant', content: dummyResponse, isTyping: true }]);
            setIsThinking(false);
        }, 1500);
    };

    const breadcrumbs = [
        { label: 'Dashboard', href: '/' },
        { label: 'AI Chatbot' }
    ];

    return (
        <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col overflow-hidden">
            <HeroHeader
                breadcrumbs={breadcrumbs}
                title="AI Chatbot"
                description="Intelligent Conversation Assistant"
            />

            <div className="flex-1 flex flex-col relative overflow-hidden min-h-0">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <LoadingState message="Initializing Chatbot Interface..." />
                    </div>
                ) : (
                    <div className="flex-1 flex overflow-hidden relative">
                        {/* Sidebar - Chat History */}
                        <div className={`absolute lg:relative inset-y-0 left-0 z-40 bg-gradient-to-b from-slate-900/95 via-slate-900/98 to-black/95 backdrop-blur-xl border-r border-cyan-500/20 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-80 opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-full lg:translate-x-0 overflow-hidden'} lg:w-80 lg:opacity-100`}>
                            {/* Header */}
                            <div className="p-4 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 mt-4">
                                <button 
                                    onClick={createNewSession} 
                                    className="w-full group relative overflow-hidden bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white py-3.5 px-4 font-bold text-sm uppercase tracking-wider transition-all duration-300 rounded-lg shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                    <div className="relative flex items-center justify-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        New Chat
                                    </div>
                                </button>
                            </div>

                            {/* Sessions List */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                                <div className="text-xs font-bold text-cyan-400/60 uppercase tracking-wider px-3 py-2">Recent Chats</div>
                                {sessions.map(s => (
                                    <div 
                                        key={s.id} 
                                        onClick={() => loadSession(s.id)} 
                                        className={`group relative overflow-hidden cursor-pointer transition-all duration-300 rounded-lg ${
                                            currentSessionId === s.id 
                                                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-400/50 shadow-lg shadow-cyan-500/10' 
                                                : 'border-cyan-500/10 hover:bg-cyan-500/5 hover:border-cyan-400/30'
                                        } border backdrop-blur-sm`}
                                    >
                                        <div className="p-3.5">
                                            <div className="flex items-start justify-between gap-2 mb-1.5">
                                                <h4 className={`font-semibold text-sm line-clamp-1 ${currentSessionId === s.id ? 'text-cyan-300' : 'text-slate-300 group-hover:text-cyan-300'} transition-colors`}>
                                                    {s.title}
                                                </h4>
                                                <button 
                                                    onClick={(e) => deleteSession(s.id, e)} 
                                                    className="p-1.5 rounded-md hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <p className="text-xs text-slate-500 line-clamp-1 mb-1">{s.preview}</p>
                                            <span className="text-[10px] text-slate-600 font-medium">{s.timestamp}</span>
                                        </div>
                                        {currentSessionId === s.id && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 to-blue-500" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Overlay for mobile */}
                        {isSidebarOpen && (
                            <div 
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden" 
                                onClick={() => setIsSidebarOpen(false)} 
                            />
                        )}

                        {/* Main Chat Area */}
                        <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-br from-slate-900/50 to-slate-950/50">
                            {/* Top Bar */}
                            <div className="bg-gradient-to-r from-slate-900/90 via-slate-900/95 to-slate-900/90 backdrop-blur-xl border-b border-cyan-500/20 p-4 shadow-lg mt-4">
                                <div className="flex items-center justify-between gap-4">
                                    {/* Menu Toggle */}
                                    <button 
                                        onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                                        className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                        </svg>
                                    </button>

                                    {/* Title */}
                                    <div className="flex-1 text-center">
                                        <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                                            AI Chatbot
                                        </h2>
                                    </div>

                                    {/* Status Indicator */}
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                        <span className="text-xs font-semibold text-emerald-400">Online</span>
                                    </div>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto px-4 md:px-6 py-8 pb-4 space-y-6 custom-scrollbar">
                                {messages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6 px-4">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-3xl" />
                                            <img src="/icons/chatbot.png" alt="Chatbot" className="relative w-24 h-24 opacity-80" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                                                How can I assist you today?
                                            </h3>
                                            <p className="text-slate-500 text-sm max-w-md">
                                                Start a conversation by typing your message below. I'm here to help with any questions you have.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    messages.map((msg, i) => (
                                        <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fadeIn`}>
                                            {/* Avatar */}
                                            <div className="shrink-0">
                                                <div className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center overflow-hidden shadow-lg ${
                                                    msg.role === 'user' 
                                                        ? 'border-cyan-500/40 bg-gradient-to-br from-cyan-500/20 to-blue-500/20' 
                                                        : 'border-purple-500/40 bg-gradient-to-br from-purple-500/20 to-pink-500/20'
                                                }`}>
                                                    {msg.role === 'user' ? (
                                                        <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                    ) : (
                                                        <img src="/icons/chatbot.png" alt="AI" className="w-full h-full object-cover" />
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Message Content */}
                                            <div className={`flex-1 max-w-[85%] md:max-w-3xl ${msg.role === 'user' ? 'flex flex-col items-end' : ''}`}>
                                                <div className={`relative overflow-hidden rounded-2xl p-4 shadow-lg backdrop-blur-sm ${
                                                    msg.role === 'user' 
                                                        ? 'bg-gradient-to-br from-cyan-600/30 to-blue-600/30 border border-cyan-500/30 text-cyan-50' 
                                                        : 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 text-slate-100'
                                                }`}>
                                                    {msg.isTyping ? (
                                                        <TypingEffect 
                                                            content={msg.content} 
                                                            scrollTrigger={scrollToBottom} 
                                                            onComplete={() => setMessages(prev => prev.map((m, idx) => idx === i ? { ...m, isTyping: false } : m))} 
                                                        />
                                                    ) : (
                                                        <div className="prose prose-invert prose-cyan max-w-none text-sm leading-relaxed">
                                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                                {isThinking && (
                                    <div className="flex gap-4 animate-fadeIn">
                                        <div className="shrink-0">
                                            <div className="w-10 h-10 rounded-xl border-2 border-purple-500/40 bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center overflow-hidden">
                                                <img src="/icons/chatbot.png" alt="AI" className="w-full h-full object-cover" />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50">
                                            <div className="flex gap-1">
                                                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                            <span className="text-sm text-slate-400 ml-2">Thinking...</span>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area - Fixed at bottom */}
                            <div className="border-t border-cyan-500/20 bg-gradient-to-r from-slate-900/95 via-slate-900/98 to-slate-900/95 backdrop-blur-xl p-4 md:p-6 shadow-2xl">
                                <form onSubmit={sendMessage} className="space-y-3">
                                    <div className="relative flex gap-3 items-end bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-2 border-cyan-500/20 rounded-2xl p-3 shadow-xl focus-within:border-cyan-400/40 transition-all">
                                        <textarea 
                                            value={inputMessage} 
                                            onChange={(e) => setInputMessage(e.target.value)} 
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    sendMessage(e);
                                                }
                                            }}
                                            placeholder="Type your message... (Shift+Enter for new line)" 
                                            className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none resize-none min-h-[60px] max-h-[200px] py-2 px-2" 
                                            rows={1} 
                                            disabled={isThinking} 
                                        />
                                        <button 
                                            type="submit" 
                                            disabled={isThinking || !inputMessage.trim()} 
                                            className="shrink-0 p-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 active:scale-95"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                    
                                    {/* Model Selector - Below Input */}
                                    <div className="flex items-center justify-between gap-4 text-xs">
                                        <div className="relative flex-1 max-w-xs">
                                            <button
                                                type="button"
                                                onClick={() => setShowModelSelector(!showModelSelector)}
                                                className="w-full px-3 py-2 rounded-lg bg-slate-800/60 border border-cyan-500/20 hover:border-cyan-400/40 text-left flex items-center justify-between gap-2 transition-all group"
                                            >
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${selectedModel.color} animate-pulse`} />
                                                    <span className="text-xs font-semibold text-slate-300 truncate">{selectedModel.name}</span>
                                                </div>
                                                <svg className={`w-3 h-3 text-cyan-400 transition-transform ${showModelSelector ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>

                                            {/* Model Dropdown */}
                                            {showModelSelector && (
                                                <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-900/95 backdrop-blur-xl border border-cyan-500/20 rounded-lg shadow-2xl shadow-black/50 overflow-hidden z-50">
                                                    {DUMMY_MODELS.map(model => (
                                                        <button
                                                            key={model.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedModel(model);
                                                                setShowModelSelector(false);
                                                            }}
                                                            className={`w-full px-3 py-2.5 text-left flex items-center gap-2 transition-all ${
                                                                selectedModel.id === model.id
                                                                    ? 'bg-cyan-500/10 border-l-2 border-cyan-400'
                                                                    : 'hover:bg-slate-800/50 border-l-2 border-transparent'
                                                            }`}
                                                        >
                                                            <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${model.color}`} />
                                                            <div className="flex-1">
                                                                <div className="text-xs font-semibold text-white">{model.name}</div>
                                                                <div className="text-[10px] text-slate-500">{model.provider}</div>
                                                            </div>
                                                            {selectedModel.id === model.id && (
                                                                <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-slate-600">Press Enter to send</span>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(15, 23, 42, 0.3);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(6, 182, 212, 0.3);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(6, 182, 212, 0.5);
                }
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}
