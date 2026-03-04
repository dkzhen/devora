'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

export default function TempMail() {
    const [account, setAccount] = useState(null);
    const [token, setToken] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [messageContent, setMessageContent] = useState(null);
    const [loadingMessage, setLoadingMessage] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [autoSync, setAutoSync] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const intervalRef = useRef(null);

    useEffect(() => {
        // Init session from localStorage
        const storedToken = localStorage.getItem('temp_mail_token');
        const storedAccount = localStorage.getItem('temp_mail_account');

        if (storedToken && storedAccount) {
            setToken(storedToken);
            const parsedAccount = JSON.parse(storedAccount);
            setAccount(parsedAccount);
            fetchMessages(storedToken, parsedAccount.id).finally(() => setLoading(false));
            startPolling(storedToken, parsedAccount.id);
        } else {
            setLoading(false);
        }

        return () => stopPolling();
    }, []);

    useEffect(() => {
        if (autoSync && token && account) {
            startPolling(token, account.id);
        } else {
            stopPolling();
        }
        return () => stopPolling();
    }, [autoSync, token, account]);

    const startPolling = (authToken, accountId) => {
        stopPolling();
        intervalRef.current = setInterval(() => {
            fetchMessages(authToken, accountId, false);
        }, 5000); // 5 seconds
    };

    const stopPolling = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
    };

    const generateNewEmail = async () => {
        setGenerating(true);
        stopPolling();
        setMessages([]);
        setSelectedMessage(null);
        setMessageContent(null);

        try {
            // 0. Clean up old account if exists
            if (account && token) {
                try {
                    await fetch(`/api/temp-mail/accounts?id=${account.id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                } catch (e) {
                    console.error("Cleanup old account failed", e);
                }
            }

            // 1. Get available domains
            const domainsRes = await fetch('/api/temp-mail/domains?page=1');
            const domainsData = await domainsRes.json();
            if (!domainsData['hydra:member'] || domainsData['hydra:member'].length === 0) {
                throw new Error("No domains available");
            }

            const domain = domainsData['hydra:member'][0].domain;
            const username = 'devora_' + Math.random().toString(36).substring(2, 10);
            const address = `${username}@${domain}`;
            const password = Math.random().toString(36).substring(2, 15);

            // 2. Create account
            let createRes = await fetch('/api/temp-mail/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address, password })
            });

            if (createRes.status === 422) {
                // Retry once if address is taken
                const newUsername = 'devora_' + Math.random().toString(36).substring(2, 10);
                const newAddress = `${newUsername}@${domain}`;
                createRes = await fetch('/api/temp-mail/accounts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ address: newAddress, password })
                });
                if (!createRes.ok) throw new Error("Failed to create account after retry");
            } else if (!createRes.ok) {
                throw new Error("Failed to create account");
            }

            const accountData = await createRes.json();

            // 3. Get token
            const tokenRes = await fetch('/api/temp-mail/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: accountData.address, password })
            });

            if (!tokenRes.ok) throw new Error("Failed to get token");
            const tokenData = await tokenRes.json();

            // Save to state & local storage
            setAccount(accountData);
            setToken(tokenData.token);

            localStorage.setItem('temp_mail_account', JSON.stringify(accountData));
            localStorage.setItem('temp_mail_token', tokenData.token);

            toast.success("New email generated!");
            startPolling(tokenData.token, accountData.id);
        } catch (error) {
            console.error(error);
            toast.error("Error generating temp mail");
        } finally {
            setGenerating(false);
            setLoading(false);
        }
    };

    const fetchMessages = async (authToken, accountId, manual = false) => {
        if (manual) setIsRefreshing(true);
        try {
            const res = await fetch('/api/temp-mail/messages?accountId=' + accountId, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setMessages(Array.isArray(data) ? data : (data['hydra:member'] || []));
            }
        } catch (error) {
            console.error("Failed to fetch messages", error);
        } finally {
            if (manual) setIsRefreshing(false);
        }
    };

    const fetchMessageDetail = async (id) => {
        if (!token) return;
        setLoadingMessage(true);
        setMessageContent(null);
        try {
            const res = await fetch(`/api/temp-mail/messages/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();

                // Process HTML images to inject auth token
                if (data.html && data.html.length > 0) {
                    let htmlString = data.html.join('');
                    const regex = /src=["'](https:\/\/api\.mail\.tm\/[^"']+)["']/g;
                    let match;
                    const urlsToFetch = new Set();
                    while ((match = regex.exec(htmlString)) !== null) {
                        urlsToFetch.add(match[1]);
                    }

                    for (const url of urlsToFetch) {
                        try {
                            const imgRes = await fetch(`/api/temp-mail/image?url=${encodeURIComponent(url)}`, { headers: { Authorization: `Bearer ${token}` } });
                            if (imgRes.ok) {
                                const blob = await imgRes.blob();
                                const objectUrl = URL.createObjectURL(blob);
                                htmlString = htmlString.split(url).join(objectUrl);
                            }
                        } catch (e) {
                            console.error('Failed to fetch inline image', e);
                        }
                    }
                    data.html = [htmlString];
                }

                setMessageContent(data);
            } else {
                setMessageContent({ error: true });
                toast.error("Failed to load full message body");
            }
        } catch (error) {
            console.error(error);
            setMessageContent({ error: true });
            toast.error("Error loading message");
        } finally {
            setLoadingMessage(false);
        }
    };

    const handleCopy = () => {
        if (account?.address) {
            navigator.clipboard.writeText(account.address);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
            toast.success("Email address copied to clipboard!");
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString([], {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex-1 min-w-0 bg-[#080d1a] min-h-screen relative flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* ── Page Header ── */}
            <div className="relative overflow-hidden rounded-2xl shrink-0">
                <div className="absolute inset-0 bg-linear-to-br from-gray-900 via-[#0d1625] to-gray-900" />
                <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-8 w-56 h-56 rounded-full bg-rose-500/8 blur-3xl pointer-events-none" />
                <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.2) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

                <div className="relative z-10 p-4 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
                    <div>
                        <nav className="flex text-[10px] md:text-xs text-emerald-300/60 mb-2 md:mb-4">
                            <a href="/" className="flex items-center gap-1 hover:text-emerald-300 transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                Dashboard
                            </a>
                            <svg className="w-3 h-3 mx-2 text-emerald-400/30 self-center" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            <span className="text-emerald-200 font-semibold">Temp Mail</span>
                        </nav>
                        <h1 className="text-2xl md:text-4xl font-black tracking-tight">
                            <span className="text-white">Temp </span>
                            <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 via-teal-400 to-rose-400">Mail</span>
                        </h1>
                        <p className="text-gray-400 mt-1 md:mt-2 text-xs md:text-sm max-w-xl">Generate temporary emails instantly to protect your privacy and reduce spam.</p>
                    </div>
                </div>
            </div>

            <div className="relative z-10 w-full flex flex-col lg:flex-row gap-6">

                {/* Left Panel: Inbox and Controls */}
                <div className="w-full lg:w-1/3 flex flex-col gap-6">
                    {/* Header Card */}
                    <div className="bg-[#0a0f1e]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-linear-to-br from-emerald-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                        <div className="flex items-start justify-between mb-4 relative z-10">
                            <div>
                                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    Your Temp Mail
                                </h2>
                                <p className="text-xs text-emerald-200/60 mt-1 font-medium">Session lives in your browser</p>
                            </div>
                            {account && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Active
                                </span>
                            )}
                        </div>

                        {!account ? (
                            <div className="text-center py-6 relative z-10">
                                <p className="text-sm text-gray-400 mb-6">You don't have an active temporary email address right now. Generate one to receive emails anonymously.</p>
                                <button
                                    onClick={generateNewEmail}
                                    disabled={generating}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-linear-to-r from-emerald-600 to-rose-600 hover:from-emerald-500 hover:to-rose-500 text-white rounded-xl transition-all font-semibold shadow-lg shadow-emerald-500/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                                >
                                    {generating ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4 group-hover/btn:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                            Generate New Email
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="relative z-10">
                                <div className="p-4 bg-black/40 border border-white/5 rounded-xl mb-4 group/copy hover:border-emerald-500/30 transition-colors">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Email Address</div>
                                            <div className="text-sm font-mono text-emerald-300 truncate font-semibold">{account.address}</div>
                                        </div>
                                        <button
                                            onClick={handleCopy}
                                            className={`p-2 rounded-lg transition-colors shrink-0 flex items-center justify-center ${isCopied ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'}`}
                                            title="Copy to clipboard"
                                        >
                                            {isCopied ? (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <button
                                    onClick={generateNewEmail}
                                    disabled={generating}
                                    className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-white/5 hover:bg-red-500/10 hover:text-red-400 border border-white/5 hover:border-red-500/20 text-gray-300 rounded-xl transition-all font-semibold text-sm active:scale-95 disabled:opacity-50"
                                >
                                    {generating ? (
                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            Delete & Generate New
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Inbox List */}
                    <div className="bg-[#0a0f1e]/80 backdrop-blur-xl border border-white/5 rounded-2xl flex-1 flex flex-col shadow-2xl overflow-hidden">
                        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
                            <h3 className="font-semibold text-white text-sm">Inbox {messages.length > 0 && <span className="text-gray-500">({messages.length})</span>}</h3>
                            {account && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setAutoSync(!autoSync)}
                                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${autoSync ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10 hover:text-gray-300'}`}
                                        title={autoSync ? "Auto Sync: ON (Every 5s)" : "Auto Sync: OFF"}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full ${autoSync ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
                                        Auto Sync
                                    </button>
                                    <button
                                        onClick={() => fetchMessages(token, account.id, true)}
                                        disabled={isRefreshing}
                                        className="p-1.5 text-gray-400 hover:text-white bg-white/5 rounded-lg transition-colors hover:bg-white/10 disabled:opacity-50"
                                        title="Manual Refresh"
                                    >
                                        <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto min-h-[300px]">
                            {!account ? (
                                <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                                        <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    </div>
                                    <p className="text-sm text-gray-400 font-medium">Generate an email to view your inbox</p>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                                    <div className="relative w-12 h-12 flex items-center justify-center mb-4">
                                        <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
                                        <div className="relative w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                            <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2h8m4 0a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-300 font-medium mb-1">Waiting for emails...</p>
                                    <p className="text-xs text-gray-500">Your inbox automatically refreshes every 10s</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {messages.map((msg) => (
                                        <button
                                            key={msg.id}
                                            onClick={() => {
                                                setSelectedMessage(msg);
                                                fetchMessageDetail(msg.id);
                                            }}
                                            className={`w-full text-left p-4 transition-all hover:bg-white/5 ${selectedMessage?.id === msg.id ? 'bg-emerald-500/10 border-l-2 border-l-emerald-500' : 'border-l-2 border-transparent'}`}
                                        >
                                            <div className="flex items-center justify-between mb-1.5 gap-2">
                                                <span className="text-sm font-semibold text-gray-200 truncate">{msg.from.name || msg.from.address}</span>
                                                <span className="text-[10px] text-gray-500 whitespace-nowrap">{formatDate(msg.createdAt)}</span>
                                            </div>
                                            <div className="text-xs text-emerald-200 font-medium mb-1 truncate">{msg.subject}</div>
                                            <div className="text-xs text-gray-500 truncate">{msg.intro}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel: Content View */}
                <div className="w-full lg:w-2/3 bg-[#0a0f1e]/80 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl overflow-hidden flex flex-col min-h-[500px]">
                    {!selectedMessage ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
                            <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-6">
                                <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5M10 12l2.25 1.5M14 12l-2.25 1.5" /></svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-300 mb-2">No Message Selected</h3>
                            <p className="text-sm max-w-sm">Select an email from your inbox on the left to read its contents.</p>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col h-full">
                            {/* Message Header */}
                            <div className="p-6 border-b border-white/5 bg-black/20 shrink-0">
                                <h2 className="text-xl font-bold text-white mb-4 pr-10">{selectedMessage.subject}</h2>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-emerald-500/20 to-rose-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                                        {(selectedMessage.from.name || selectedMessage.from.address).charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                            <span className="font-semibold text-gray-200 truncate">{selectedMessage.from.name}</span>
                                            <span className="text-xs text-gray-400 font-mono bg-white/5 px-1.5 py-0.5 rounded">&lt;{selectedMessage.from.address}&gt;</span>
                                        </div>
                                        <div className="text-[11px] text-gray-500">
                                            Received: {formatDate(selectedMessage.createdAt)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Message Body */}
                            <div className="flex-1 overflow-y-auto bg-[#0a0f1e]/50 p-6 relative rounded-b-2xl">
                                {loadingMessage ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-[#0a0f1e]/80 backdrop-blur-sm z-10 rounded-b-2xl">
                                        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : messageContent?.error ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
                                        <svg className="w-12 h-12 mb-4 text-rose-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                        <p className="text-gray-300 font-medium mb-2">Message body unavailable</p>
                                        <div className="text-sm text-gray-400 bg-white/5 p-4 rounded-xl border border-white/5 whitespace-pre-wrap text-left w-full relative">
                                            <span className="absolute -top-2.5 left-4 bg-[#0a0f1e] text-[10px] uppercase font-bold text-gray-500 px-1">Message Preview</span>
                                            {selectedMessage?.intro || "No preview available for this message. It might not be stored in the database locally."}
                                        </div>
                                    </div>
                                ) : messageContent ? (
                                    <div className="w-full h-full">
                                        {messageContent.html ? (
                                            <div
                                                dangerouslySetInnerHTML={{ __html: messageContent.html.join('') }}
                                                className="w-full h-full pb-10 text-gray-200 **:text-gray-200! **:bg-transparent! **:border-gray-700!"
                                            />
                                        ) : messageContent.text ? (
                                            <div className="whitespace-pre-wrap font-sans text-sm text-gray-300 pb-10">
                                                {messageContent.text}
                                            </div>
                                        ) : (
                                            <div className="whitespace-pre-wrap font-sans text-sm text-gray-400 italic pb-10">
                                                {selectedMessage?.intro || "This message has no textual content."}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-500">
                                        Select a message to read.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
