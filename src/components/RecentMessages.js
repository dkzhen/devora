'use client';

import { useState, useEffect } from 'react';

const AVATAR_COLORS = [
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-purple-500 to-pink-600',
    'from-orange-500 to-red-600',
    'from-cyan-500 to-blue-600',
];

function Avatar({ name, size = 'sm' }) {
    const colorClass = AVATAR_COLORS[name.length % AVATAR_COLORS.length];
    const sizeClass = size === 'lg' ? 'w-12 h-12 text-lg' : 'w-8 h-8 text-xs';
    return (
        <div className={`${sizeClass} rounded-xl bg-linear-to-br ${colorClass} flex items-center justify-center font-black text-white shrink-0`}>
            {name.charAt(0).toUpperCase()}
        </div>
    );
}

export default function RecentMessages({ accounts }) {
    const [selectedEmail, setSelectedEmail] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    useEffect(() => {
        if (accounts?.length > 0 && !selectedEmail) {
            const active = accounts.find(a => a.status === 'active');
            setSelectedEmail(active ? active.email : accounts[0].email);
        }
    }, [accounts, selectedEmail]);

    useEffect(() => {
        if (selectedEmail) {
            fetchMessages(selectedEmail);
            setSelectedMessage(null);
        } else {
            setMessages([]);
        }
    }, [selectedEmail]);

    const fetchMessages = async (email) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/accounts/${encodeURIComponent(email)}/messages`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
                if (window.innerWidth >= 768 && data.length > 0) setSelectedMessage(data[0]);
            }
        } catch { /* silent */ } finally { setLoading(false); }
    };

    const handleRefresh = async () => {
        if (!selectedEmail) return;
        setRefreshing(true);
        try {
            const res = await fetch(`/api/accounts/${encodeURIComponent(selectedEmail)}/messages`, { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
                if (window.innerWidth >= 768 && data.length > 0) setSelectedMessage(data[0]);
            }
        } catch { /* silent */ } finally { setRefreshing(false); }
    };

    if (!accounts || accounts.length === 0) {
        return (
            <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-linear-to-br from-[#0f172a] to-[#1e293b] flex flex-col items-center justify-center py-20 px-6 text-center">
                {/* Background orbs */}
                <div className="absolute top-1/4 left-1/4 w-48 h-48 rounded-full bg-blue-600/5 blur-3xl pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-indigo-600/5 blur-3xl pointer-events-none" />

                {/* Icon */}
                <div className="relative mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center mx-auto">
                        <svg className="w-10 h-10 text-blue-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    {/* Floating dot */}
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#0f172a] border border-white/8 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-gray-700" />
                    </div>
                </div>

                <h3 className="text-lg font-black text-white mb-2">No accounts connected</h3>
                <p className="text-gray-600 text-sm max-w-xs leading-relaxed mb-6">
                    Connect a Gmail account to start monitoring and managing your emails in one place.
                </p>

                <a
                    href="/gmail-center"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-700/25 transition-all hover:scale-[1.03] active:scale-[0.98] border border-white/10"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" />
                    </svg>
                    Connect Gmail Account
                </a>
            </div>
        );
    }


    const selectedAccount = accounts.find(a => a.email === selectedEmail);

    return (
        <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-linear-to-br from-[#0f172a] to-[#1e293b] flex flex-col h-auto md:h-[680px]">

            {/* ── Toolbar ── */}
            <div className="px-4 py-3 border-b border-white/5 flex flex-col sm:flex-row justify-between items-center gap-3">
                {/* Account switcher */}
                <div className="relative w-full sm:w-64 z-20">
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="w-full flex items-center justify-between pl-3 pr-4 py-2 bg-white/5 hover:bg-white/8 border border-white/10 rounded-xl text-sm text-white outline-none transition-all"
                    >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="truncate text-gray-300 text-sm">{selectedEmail || 'Select Account'}</span>
                            {selectedAccount?.status === 'active' ? (
                                <span className="relative flex h-2 w-2 ml-1 shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                </span>
                            ) : (
                                <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                            )}
                        </div>
                        <svg className={`w-4 h-4 text-gray-500 transition-transform shrink-0 ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>

                    {dropdownOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                            <div className="absolute top-full left-0 right-0 mt-1 bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl z-20 max-h-60 overflow-y-auto">
                                {accounts.map(acc => (
                                    <div
                                        key={acc.email}
                                        onClick={() => { setSelectedEmail(acc.email); setDropdownOpen(false); }}
                                        className="px-4 py-2.5 hover:bg-white/5 cursor-pointer flex items-center justify-between text-sm text-gray-300 hover:text-white transition-colors"
                                    >
                                        <span className="truncate">{acc.email}</span>
                                        {acc.status === 'active' ? (
                                            <span className="relative flex h-2 w-2 ml-2 shrink-0">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                            </span>
                                        ) : (
                                            <span className="h-2 w-2 rounded-full bg-red-500 ml-2 shrink-0" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Search + Refresh */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <input
                            type="text"
                            placeholder="Search email"
                            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/8 transition-all"
                        />
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing || !selectedEmail}
                        className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-blue-400 rounded-xl transition-colors disabled:opacity-40"
                        title="Refresh"
                    >
                        <svg className={`w-5 h-5 ${refreshing ? 'animate-spin text-blue-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                </div>
            </div>

            {/* ── Body ── */}
            <div className="flex flex-1 overflow-hidden">
                {/* Message List */}
                <div className={`w-full md:w-[320px] shrink-0 border-r border-white/5 overflow-y-auto ${selectedMessage ? 'hidden md:block' : 'block'}`}>
                    {loading && messages.length === 0 ? (
                        <div className="p-8 text-center space-y-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-16 bg-white/3 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="p-10 text-center text-gray-600">
                            <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            <p className="text-sm">No messages found</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    onClick={() => setSelectedMessage(msg)}
                                    className={`p-4 cursor-pointer transition-colors ${selectedMessage?.id === msg.id
                                        ? 'bg-blue-500/10 border-l-2 border-blue-500'
                                        : 'border-l-2 border-transparent hover:bg-white/3'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2.5">
                                            <Avatar name={msg.from} />
                                            <h3 className={`font-bold text-sm truncate max-w-[120px] ${selectedMessage?.id === msg.id ? 'text-blue-400' : 'text-white'}`}>
                                                {msg.from.split('<')[0].trim()}
                                            </h3>
                                        </div>
                                        <span className="text-[10px] text-gray-600 whitespace-nowrap mt-0.5">
                                            {new Date(msg.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="text-sm font-medium text-gray-300 truncate mb-1">{msg.subject}</div>
                                    <p className="text-xs text-gray-600 line-clamp-2">{msg.snippet}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Detail View */}
                <div className={`flex-1 overflow-y-auto ${selectedMessage ? 'block' : 'hidden md:block'}`}>
                    {selectedMessage ? (
                        <div className="h-full flex flex-col">
                            {/* Detail toolbar */}
                            <div className="px-5 py-3 border-b border-white/5 flex justify-between items-center sticky top-0 bg-[#0f172a]/80 backdrop-blur-sm z-10">
                                <button
                                    onClick={() => setSelectedMessage(null)}
                                    className="md:hidden text-gray-500 hover:text-white transition-colors p-1"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                                </button>
                                <span className="text-xs text-gray-600">{new Date(selectedMessage.receivedAt).toLocaleString()}</span>
                            </div>

                            {/* Detail content */}
                            <div className="p-6 md:p-8 flex-1">
                                <h1 className="text-xl md:text-2xl font-black text-white mb-6 leading-tight">{selectedMessage.subject}</h1>

                                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/5">
                                    <Avatar name={selectedMessage.from} size="lg" />
                                    <div>
                                        <div className="font-bold text-white">{selectedMessage.from.split('<')[0].trim()}</div>
                                        <div className="text-sm text-gray-500">
                                            {selectedMessage.from.includes('<') ? selectedMessage.from.match(/<([^>]+)>/)[1] : selectedMessage.from}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1">
                                    {selectedMessage.body ? (
                                        <iframe
                                            key={selectedMessage.id}
                                            srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;padding:0;font-family:sans-serif;background:transparent;}a{color:#60a5fa;}img{max-width:100%;height:auto;}</style></head><body>${selectedMessage.body}</body></html>`}
                                            className="w-full border-0 min-h-[400px]"
                                            style={{ height: '100%', minHeight: '400px' }}
                                            sandbox="allow-same-origin allow-popups"
                                            onLoad={(e) => {
                                                const doc = e.target.contentDocument;
                                                if (doc) {
                                                    const h = doc.documentElement.scrollHeight;
                                                    e.target.style.height = Math.max(h, 400) + 'px';
                                                }
                                            }}
                                        />
                                    ) : (
                                        <p className="text-gray-600 italic text-sm">No content available for this message.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="hidden md:flex flex-col items-center justify-center h-full text-gray-700">
                            <svg className="w-14 h-14 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            <p className="text-base font-semibold">Select a message to read</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
