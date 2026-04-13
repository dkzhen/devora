'use client';

import { useState, useEffect, useRef } from 'react';
import { HeroHeader, LoadingState } from '@/components/HeroHeader';
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
    const [history, setHistory] = useState([]);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [user, setUser] = useState(null);

    const intervalRef = useRef(null);

    useEffect(() => {
        // Init user
        const storedUser = localStorage.getItem('user_info');
        if (storedUser) setUser(JSON.parse(storedUser));

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

        if (storedUser) fetchHistory();

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

    const fetchHistory = async () => {
        try {
            const res = await fetch('/api/temp-mail/accounts/history');
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
            }
        } catch (error) {
            console.error("Failed to fetch history", error);
        }
    };

    const switchAccount = async (oldAccount) => {
        setLoading(true);
        stopPolling();
        setMessages([]);
        setSelectedMessage(null);
        setMessageContent(null);

        try {
            // Get fresh token for this account
            const tokenRes = await fetch('/api/temp-mail/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: oldAccount.address, password: oldAccount.password })
            });

            if (!tokenRes.ok) throw new Error("Failed to get token for existing account");
            const tokenData = await tokenRes.json();

            setAccount(oldAccount);
            setToken(tokenData.token);

            localStorage.setItem('temp_mail_account', JSON.stringify(oldAccount));
            localStorage.setItem('temp_mail_token', tokenData.token);

            fetchMessages(tokenData.token, oldAccount.id).finally(() => setLoading(false));
            startPolling(tokenData.token, oldAccount.id);
            setShowHistoryModal(false);
            
            toast.success("Switched to email: " + oldAccount.address);
        } catch (error) {
            console.error(error);
            setLoading(false);
            toast.error("Failed to switch account");
        }
    };

    const destroyAccount = async (targetId) => {
        if (!confirm("Are you sure you want to permanently delete this email address? This action cannot be undone.")) return;
        try {
            const res = await fetch(`/api/temp-mail/accounts?id=${targetId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                toast.success("Email address destroyed");
                fetchHistory();
                if (account?.id === targetId) {
                    setAccount(null);
                    setToken(null);
                    setMessages([]);
                    localStorage.removeItem('temp_mail_account');
                    localStorage.removeItem('temp_mail_token');
                }
            } else {
                toast.error("Failed to destroy email address");
            }
        } catch (error) {
            console.error("Destroy error", error);
            toast.error("An error occurred while destroying");
        }
    };

    const generateNewEmail = async () => {
        setGenerating(true);
        stopPolling();
        setMessages([]);
        setSelectedMessage(null);
        setMessageContent(null);

        try {
            // 0. Clean up old account if exists (only if NOT logged in, to preserve history for users)
            if (account && token && !user) {
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

            await fetchHistory();

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
            <div className="space-y-6">
                <HeroHeader
                    title="Temp"
                    badge="Mail"
                    description="Loading temporary inbox..."
                    
                    breadcrumbs={[
                        { label: 'Dashboard', href: '/' },
                        { label: 'Temp Mail' }
                    ]}
                />
                <LoadingState message="Connecting to secure mail server..."  />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <HeroHeader
                title="Temp"
                badge="Mail"
                description="Generate temporary emails instantly to protect your privacy and reduce spam."
                
                breadcrumbs={[
                    { label: 'Dashboard', href: '/' },
                    { label: 'Temp Mail' }
                ]}
            />

            <div className="relative z-10 w-full flex flex-col lg:flex-row gap-6">

                {/* Left Panel: Inbox and Controls */}
                <div className="w-full lg:w-1/3 flex flex-col gap-6">
                    {/* Header Card */}
                    <div className="bg-[#0a0e1a]/95 border border-[#A1C2BD]/20 rounded-2xl p-6 relative overflow-hidden group shadow-lg">
                        <div className="absolute inset-0 bg-linear-to-br from-[#A1C2BD]/10 to-[#19183B]/10 opacity-30 pointer-events-none" />

                        <div className="flex items-start justify-between mb-4 relative z-10">
                            <div>
                                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                                    <svg className="w-5 h-5 text-[#A1C2BD]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    Your Temp Mail
                                </h2>
                                <p className="text-xs text-[#A1C2BD]/60 mt-1 font-medium">Session lives in your browser</p>
                            </div>
                            {account && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#A1C2BD]/10 border border-[#A1C2BD]/20 text-[10px] font-bold text-[#A1C2BD] uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#A1C2BD]" />
                                    Active
                                </span>
                            )}
                        </div>

                        {!account ? (
                            <div className="text-center py-6 relative z-10">
                                <p className="text-sm text-slate-400 mb-6">You don't have an active temporary email address right now. Generate one to receive emails anonymously.</p>
                                <button
                                    onClick={generateNewEmail}
                                    disabled={generating}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-linear-to-r from-[#19183B] to-[#708993] hover:from-[#A1C2BD]/80 hover:to-[#708993]/80 border border-[#A1C2BD]/30 hover:border-[#A1C2BD]/50 text-white rounded-xl transition-all font-semibold active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                                >
                                    {generating ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4 group-hover/btn:rotate-180 transition-transform duration-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path></svg>
                                            Generate New
                                        </>
                                    )}
                                </button>
                                {user && (
                                    <button
                                        onClick={() => setShowHistoryModal(true)}
                                        className="w-full mt-2 flex items-center justify-center gap-2 py-2 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-xl transition-all font-semibold text-sm active:scale-95"
                                    >
                                        <svg className="w-4 h-4 text-[#A1C2BD]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        History
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="relative z-10">
                                <div className="p-4 bg-[#0a0e1a]/60 border border-[#A1C2BD]/20 rounded-xl mb-4 group/copy hover:border-[#A1C2BD]/40 transition-colors">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Email Address</div>
                                            <div className="text-sm font-mono text-[#A1C2BD] truncate font-bold tracking-wide">{account.address}</div>
                                        </div>
                                        <button
                                            onClick={handleCopy}
                                            className={`p-2 rounded-lg transition-colors shrink-0 flex items-center justify-center ${isCopied ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'}`}
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
                                <div className="grid grid-cols-1 gap-2">
                                    <button
                                        onClick={generateNewEmail}
                                        disabled={generating}
                                        className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-white/5 hover:bg-red-500/10 hover:text-red-400 border border-white/5 hover:border-red-500/20 text-slate-300 rounded-xl transition-all font-semibold text-sm active:scale-95 disabled:opacity-50"
                                    >
                                        {generating ? (
                                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path></svg>
                                                Generate New
                                            </>
                                        )}
                                    </button>
                                    {user && (
                                        <button
                                            onClick={() => setShowHistoryModal(true)}
                                            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-xl transition-all font-semibold text-sm active:scale-95"
                                        >
                                            <svg className="w-4 h-4 text-[#A1C2BD]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            History Email
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Inbox List */}
                    <div className="bg-[#0a0e1a]/95 border border-white/5 hover:border-[#A1C2BD]/20 transition-colors rounded-2xl flex-1 flex flex-col shadow-lg overflow-hidden">
                        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
                            <h3 className="font-semibold text-white text-sm">Inbox {messages.length > 0 && <span className="text-slate-500">({messages.length})</span>}</h3>
                            {account && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setAutoSync(!autoSync)}
                                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${autoSync ? 'bg-[#A1C2BD]/20 text-[#A1C2BD] border border-[#A1C2BD]/30 shadow-[0_0_10px_rgba(161,194,189,0.1)]' : 'bg-white/5 text-slate-400 border border-transparent hover:bg-white/10 hover:text-slate-300'}`}
                                        title={autoSync ? "Auto Sync: ON (Every 5s)" : "Auto Sync: OFF"}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full ${autoSync ? 'bg-[#A1C2BD] animate-pulse shadow-[0_0_5px_rgba(161,194,189,0.8)]' : 'bg-gray-500'}`} />
                                        Auto Sync
                                    </button>
                                    <button
                                        onClick={() => fetchMessages(token, account.id, true)}
                                        disabled={isRefreshing}
                                        className="p-1.5 text-slate-400 hover:text-white bg-white/5 rounded-lg transition-colors hover:bg-white/10 disabled:opacity-50"
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
                                        <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    </div>
                                    <p className="text-sm text-slate-400 font-medium">Generate an email to view your inbox</p>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                                    <div className="relative w-12 h-12 flex items-center justify-center mb-4">
                                        <div className="relative w-12 h-12 rounded-2xl bg-[#A1C2BD]/10 border border-[#A1C2BD]/20 flex items-center justify-center">
                                            <svg className="w-6 h-6 text-[#A1C2BD]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2h8m4 0a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-300 font-medium mb-1">Waiting for emails...</p>
                                    <p className="text-xs text-slate-500">Your inbox automatically refreshes every 10s</p>
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
                                            className={`w-full text-left p-4 transition-all hover:bg-white/5 ${selectedMessage?.id === msg.id ? 'bg-[#19183B]/40 border-l-2 border-l-[#A1C2BD] shadow-[inset_4px_0_0_rgba(161,194,189,0.5)]' : 'border-l-2 border-transparent'}`}
                                        >
                                            <div className="flex items-center justify-between mb-1.5 gap-2">
                                                <span className="text-sm font-semibold text-slate-200 truncate">{msg.from.name || msg.from.address}</span>
                                                <span className="text-[10px] text-slate-500 whitespace-nowrap">{formatDate(msg.createdAt)}</span>
                                            </div>
                                            <div className="text-xs text-[#708993] font-semibold mb-1 truncate">{msg.subject}</div>
                                            <div className="text-xs text-slate-500 truncate">{msg.intro}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel: Content View */}
                <div className="w-full lg:w-2/3 bg-[#0a0e1a]/95 border border-[#A1C2BD]/20 rounded-2xl shadow-xl overflow-hidden flex flex-col min-h-[500px] relative group">
                    <div className="absolute inset-0 bg-linear-to-br from-[#A1C2BD]/10 via-transparent to-[#19183B]/10 opacity-20 pointer-events-none" />
                    {!selectedMessage ? (
                        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                            <div className="w-16 h-16 rounded-3xl bg-[#A1C2BD]/5 border border-[#A1C2BD]/10 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(161,194,189,0.02)]">
                                <svg className="w-8 h-8 text-[#708993]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5M10 12l2.25 1.5M14 12l-2.25 1.5" /></svg>
                            </div>
                            <h3 className="text-lg font-medium text-slate-300 mb-2">No Message Selected</h3>
                            <p className="text-sm max-w-sm text-slate-500">Select an email from your inbox on the left to read its contents.</p>
                        </div>
                    ) : (
                        <div className="relative z-10 flex-1 flex flex-col h-full">
                            {/* Message Header */}
                            <div className="p-6 border-b border-[#A1C2BD]/10 bg-black/40 shrink-0">
                                <h2 className="text-xl font-bold text-white mb-4 pr-10">{selectedMessage.subject}</h2>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#A1C2BD]/20 to-[#19183B]/20 border border-[#A1C2BD]/40 flex items-center justify-center text-[#A1C2BD] font-bold shrink-0">
                                        {(selectedMessage.from.name || selectedMessage.from.address).charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                            <span className="font-semibold text-slate-200 truncate">{selectedMessage.from.name}</span>
                                            <span className="text-xs text-slate-400 font-mono bg-white/5 px-1.5 py-0.5 rounded">&lt;{selectedMessage.from.address}&gt;</span>
                                        </div>
                                        <div className="text-[11px] text-slate-500">
                                            Received: {formatDate(selectedMessage.createdAt)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Message Body */}
                            <div className="flex-1 overflow-y-auto bg-[#0a0e1a]/60 p-6 relative rounded-b-2xl">
                                {loadingMessage ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e1a]/95 z-10 rounded-b-2xl">
                                        <div className="w-8 h-8 border-2 border-[#A1C2BD]/60 border-t-[#A1C2BD] rounded-full animate-spin" />
                                    </div>
                                ) : messageContent?.error ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
                                        <svg className="w-12 h-12 mb-4 text-rose-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                        <p className="text-slate-300 font-medium mb-2">Message body unavailable</p>
                                        <div className="text-sm text-slate-400 bg-white/5 p-4 rounded-xl border border-white/5 whitespace-pre-wrap text-left w-full relative">
                                            <span className="absolute -top-2.5 left-4 bg-[#0a0f1e] text-[10px] uppercase font-bold text-slate-500 px-1">Message Preview</span>
                                            {selectedMessage?.intro || "No preview available for this message. It might not be stored in the database locally."}
                                        </div>
                                    </div>
                                ) : messageContent ? (
                                    <div className="w-full h-full">
                                        {messageContent.html ? (
                                            <div
                                                dangerouslySetInnerHTML={{ __html: messageContent.html.join('') }}
                                                className="w-full h-full pb-10 text-slate-200 **:text-slate-200! **:bg-transparent! **:border-gray-700!"
                                            />
                                        ) : messageContent.text ? (
                                            <div className="whitespace-pre-wrap font-sans text-sm text-slate-300 pb-10">
                                                {messageContent.text}
                                            </div>
                                        ) : (
                                            <div className="whitespace-pre-wrap font-sans text-sm text-slate-400 italic pb-10">
                                                {selectedMessage?.intro || "This message has no textual content."}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-500">
                                        Select a message to read.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

            </div>

            {/* History Modal */}
            {showHistoryModal && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80">
                    <div className="bg-[#0a0e1a] border border-[#A1C2BD]/20 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/40">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <svg className="w-5 h-5 text-[#A1C2BD]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Email History
                            </h3>
                            <button onClick={() => setShowHistoryModal(false)} className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto p-4 flex flex-col gap-3">
                            {history.filter(item => item.id !== account?.id).length === 0 ? (
                                <div className="py-10 text-center">
                                    <p className="text-slate-500 text-sm italic">No history found</p>
                                </div>
                            ) : (
                                history
                                    .filter(item => item.id !== account?.id)
                                    .map((item) => (
                                        <div key={item.id} className="p-4 rounded-xl border transition-all flex items-center justify-between gap-4 group bg-white/5 border-transparent hover:border-white/10">
                                            <div className="min-w-0 flex-1">
                                                <div className="text-sm font-bold text-slate-200 truncate">{item.address}</div>
                                                <div className="text-[10px] text-slate-500 mt-0.5">Created: {new Date(item.createdAt).toLocaleDateString()}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => switchAccount(item)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#A1C2BD]/10 hover:bg-[#A1C2BD]/20 text-[#A1C2BD] text-xs font-bold rounded-lg border border-[#A1C2BD]/20 transition-all active:scale-95 group/sw"
                                                    title="Switch to this account"
                                                >
                                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
                                                    <span className="hidden sm:inline">Switch</span>
                                                </button>
                                                <button 
                                                    onClick={() => destroyAccount(item.id)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-lg border border-red-500/20 transition-all active:scale-95"
                                                    title="Permanently Delete account"
                                                >
                                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                    <span className="hidden sm:inline">Destroy</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>
                        <div className="p-4 bg-black/20 border-t border-white/5 flex justify-end">
                            <button onClick={() => setShowHistoryModal(false)} className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
