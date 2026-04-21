'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LockedFeatureScreen from '@/components/LockedFeatureScreen';
import { HeroHeader } from '@/components/HeroHeader';


// Syntax Highlighter from Endpoints
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
                            cls = /:$/.test(match) ? 'text-blue-400' : 'text-emerald-400';
                        } else if (/true|false/.test(match)) {
                            cls = 'text-purple-400';
                        } else if (/null/.test(match)) {
                            cls = 'text-rose-400';
                        }
                        return `<span class="${cls}">${match}</span>`;
                    });
                return (
                    <div key={i} className="flex min-w-0">
                        <span className="select-none text-slate-600 w-8 shrink-0 text-right pr-3">{i + 1}</span>
                        <span dangerouslySetInnerHTML={{ __html: highlighted || '&ZeroWidthSpace;' }} />
                    </div>
                );
            })}
        </code>
    );
}

// Copy Icon Button Tool
function CopyIconBtn({ text }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(String(text));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className={`p-1 rounded-md ${copied ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-500 hover:text-slate-300 hover:bg-white/10'}`}
            title="Copy"
        >
            {copied ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            )}
        </button>
    );
}

// MetaChip Component
function MetaChip({ icon, label, text }) {
    if (!text) return null;
    return (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#0c0e1a] border border-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:bg-white/5 hover:border-white/10 group min-w-0">
            <span className="text-slate-500 shrink-0">{icon}</span>
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest shrink-0">{label}</span>
            <span className="font-mono text-[11px] text-slate-300 truncate" title={text}>{text}</span>
            <div className="opacity-0 group-hover:opacity-100 shrink-0">
                <CopyIconBtn text={text} />
            </div>
        </div>
    );
}

// Dynamic Chat Avatar Component
function ChatAvatar({ chatId, fallbackIcon, colorClass }) {
    const [imgError, setImgError] = useState(false);
    const [loading, setLoading] = useState(true);

    const avatarUrl = `/api/telegram/avatar/${chatId}`;

    const ringClass = colorClass === 'blue' ? 'from-blue-500/80 to-indigo-500/80' :
        colorClass === 'amber' ? 'from-amber-500/80 to-orange-500/80' :
            colorClass === 'rose' ? 'from-rose-500/80 to-red-500/80' :
                'from-emerald-500/80 to-teal-500/80';

    return (
        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full p-[2px] bg-linear-to-tr ${ringClass} shrink-0 shadow-lg ${colorClass === 'blue' ? 'shadow-blue-500/10' : colorClass === 'amber' ? 'shadow-amber-500/10' : 'shadow-emerald-500/10'}`}>
            <div className="w-full h-full rounded-full overflow-hidden bg-[#0a0f1c] flex items-center justify-center relative border border-black/50">
                {(!imgError && chatId) ? (
                    <>
                        <img
                            src={avatarUrl}
                            alt="Avatar"
                            className={`w-full h-full object-cover ${loading ? 'opacity-0' : 'opacity-100'}`}
                            onLoad={() => setLoading(false)}
                            onError={() => {
                                setImgError(true);
                                setLoading(false);
                            }}
                        />
                        {loading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-[#0a0f1c]">
                                <div className={`text-${colorClass}-400/50 scale-75`}>{fallbackIcon}</div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className={`text-${colorClass}-400 scale-75`}>{fallbackIcon}</div>
                )}
            </div>
        </div>
    );
}

// Telegram Card UI Component
function TelegramUpdateCard({ update }) {
    const [expanded, setExpanded] = useState(false);

    const getDetails = () => {
        const msg = update.message || update.edited_message || update.channel_post || update.my_chat_member;
        if (!msg) return { type: 'Unknown', icon: <svg />, color: 'gray' };

        const isChannel = !!update.channel_post;
        const chat = msg.chat || {};
        const from = msg.from || {};

        let info = {
            type: isChannel ? 'Channel Post' : 'Message',
            icon: isChannel ? (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14V9l5 3.5-5 3.5z" /></svg>
            ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" /></svg>
            ),
            color: isChannel ? 'amber' : 'blue',
            chatTitle: chat.title || 'Private Chat',
            chatId: chat.id,
            chatType: chat.type,
            senderName: from.first_name ? `${from.first_name}${from.last_name ? ' ' + from.last_name : ''}` : null,
            senderUsername: from.username,
            senderId: from.id,
            text: msg.text || msg.caption || null,
            time: msg.date ? new Date(msg.date * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
            messageId: msg.message_id || msg.update_id,
            threadId: msg.message_thread_id,
            media: null
        };

        if (update.my_chat_member) {
            info.type = 'System';
            info.color = 'emerald';
            info.icon = <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>;
            info.text = `Status changed to: ${msg.new_chat_member?.status}`;
        }

        if (update.error) {
            info.type = 'Error';
            info.color = 'rose';
            info.icon = <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
        }

        const fileTypes = ['document', 'photo', 'video', 'sticker', 'audio', 'voice', 'video_note'];
        for (const type of fileTypes) {
            if (msg[type]) {
                const mediaData = Array.isArray(msg[type]) ? msg[type][msg[type].length - 1] : msg[type];
                info.media = {
                    type: type,
                    fileId: mediaData.file_id,
                    fileName: mediaData.file_name || (type === 'photo' ? 'Photo' : 'Media'),
                    fileSize: mediaData.file_size ? (mediaData.file_size / 1024).toFixed(1) + ' KB' : null
                };
                if (!info.text) info.text = `Sent a ${type}`;
                break;
            }
        }

        return info;
    };

    const details = getDetails();

    const badgeClasses = details.color === 'blue' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.15)]' :
        details.color === 'amber' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.15)]' :
            details.color === 'rose' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.15)]' :
                'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.15)]';

    return (
        <div className="relative pl-10 md:pl-16 mb-4 group/card">
            {/* Timeline Line & Dot */}
            <div className={`absolute left-[16.5px] md:left-[28.5px] top-[40px] bottom-[-40px] w-px bg-white/5 group-last/card:hidden`} />
            <div className={`absolute left-[12px] md:left-[24px] top-7 w-2.5 h-2.5 rounded-full ring-4 ring-[#0f172a] shadow-[0_0_8px_currentColor] z-10 ${details.color === 'blue' ? 'bg-blue-500 text-blue-500' : details.color === 'amber' ? 'bg-amber-500 text-amber-500' : details.color === 'emerald' ? 'bg-emerald-500 text-emerald-500' : 'bg-rose-500 text-rose-500'}`} />

            {/* Elevated Card */}
            <div className={`relative bg-[#111827] border border-white/10 rounded-2xl md:rounded-[20px] shadow-lg hover:border-white/20 ${expanded ? `ring-1 ring-${details.color}-500/30 border-${details.color}-500/30` : ''}`}>

                {/* Header Section */}
                <div className="p-4 md:p-5 flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-white/5">
                    <div className="flex items-start gap-3 md:gap-4 min-w-0">
                        <ChatAvatar
                            chatId={details.chatId}
                            fallbackIcon={details.icon}
                            colorClass={details.color}
                        />

                        <div className="min-w-0 pt-0.5">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <span className={`text-[9px] px-2 py-0.5 rounded-md border font-black uppercase tracking-widest ${badgeClasses}`}>
                                    {details.type}
                                </span>
                                {details.chatType === 'supergroup' && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 font-bold uppercase tracking-wider border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                                        Supergroup
                                    </span>
                                )}
                            </div>
                            <h3 className="text-[15px] font-bold text-white flex items-center gap-2 truncate">
                                {details.chatTitle}
                            </h3>
                            <p className="text-xs text-slate-500 truncate mt-0.5">
                                {details.senderName || details.senderUsername ? (
                                    <>From: <span className="text-slate-300 font-medium">{details.senderName || `@${details.senderUsername}`}</span></>
                                ) : 'System Event'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-3 shrink-0">
                        <span className="text-[11px] text-slate-500 font-mono font-medium tracking-wide">{details.time}</span>
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-white/5 hover:bg-white/10 border border-white/5 hover:text-white"
                        >
                            JSON Preview
                            <svg className={`w-3.5 h-3.5 ${expanded ? 'rotate-180 text-white' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                    </div>
                </div>

                {/* Body Section */}
                <div className="p-4 md:p-5 space-y-4">
                    {/* Metadata Chips */}
                    <div className="flex flex-wrap items-center gap-2">
                        <MetaChip
                            icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
                            label="Chat"
                            text={details.chatId}
                        />
                        <MetaChip
                            icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                            label="Sender"
                            text={details.senderId}
                        />
                        <MetaChip
                            icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>}
                            label="Topic"
                            text={details.threadId}
                        />
                        <MetaChip
                            icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>}
                            label="Msg"
                            text={details.messageId}
                        />
                    </div>

                    {/* Message Log Bubble */}
                    {details.text && (
                        <div className="bg-[#050810]/60 border border-white/5 rounded-[14px] p-4 font-mono text-[13px] text-slate-300 shadow-inner relative overflow-hidden group/bubble">
                            <div className={`absolute top-0 left-0 w-1 h-full bg-linear-to-b from-${details.color}-500/80 to-transparent`} />
                            <p className="whitespace-pre-wrap leading-relaxed pl-1">
                                {details.text}
                            </p>
                        </div>
                    )}

                    {/* Media Attachment */}
                    {details.media && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl hover:border-blue-500/20 hover:bg-blue-500/10">
                            <div className="w-10 h-10 rounded-xl bg-[#0c0e1a] shadow-inner flex items-center justify-center text-blue-400 shrink-0 border border-white/5">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-slate-200 truncate">{details.media.fileName}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider font-semibold">{details.media.fileSize || 'Unknown Size'} • {details.media.type}</p>
                            </div>
                            <div className="shrink-0 flex items-center gap-2 max-w-full">
                                <MetaChip
                                    icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                                    label="File"
                                    text={details.media.fileId}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* JSON Preview - Collapsible */}
                <div className={`${expanded ? 'block opacity-100' : 'hidden opacity-0'}`}>
                    <div className="overflow-hidden">
                        <div className="border-t border-white/5 bg-[#050810] p-6 text-xs overflow-x-auto rounded-b-[20px] shadow-inner">
                            <JsonHighlight value={update} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}




export default function TelegramConsolePage() {
    const [user, setUser] = useState(null);
    const [updates, setUpdates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [warningState, setWarningState] = useState(false);
    const [apiError, setApiError] = useState(null);
    const [isLocked, setIsLocked] = useState(false);

    // Auto-sync states
    const [isAutoSync, setIsAutoSync] = useState(false);
    const [errorCount, setErrorCount] = useState(0);
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const [tokenCopied, setTokenCopied] = useState(false);

    const router = useRouter();

    useEffect(() => {
        const init = async () => {
            // Auth Check
            let userRole = null;
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
                setIsLocked(true);
                setLoading(false);
                return;
            }

            // Fetch Telegram Updates
            await fetchUpdates(false);
        };

        init();
    }, [router]);

    // Auto-sync effect
    useEffect(() => {
        let interval;
        if (isAutoSync && !isLocked) {
            interval = setInterval(() => {
                fetchUpdates(true, true);
            }, 15000); // 15 seconds
        }
        return () => clearInterval(interval);
    }, [isAutoSync, isLocked]);

    const fetchUpdates = async (shouldSync = false, isBackground = false) => {
        // If not syncing, don't show full loading state if we already have data
        if (!isBackground && (shouldSync || updates.length === 0)) {
            setLoading(true);
        }

        if (!isBackground) {
            setWarningState(false);
            setApiError(null);
        }

        try {
            const endpoint = shouldSync ? '/api/telegram/updates?sync=true' : '/api/telegram/updates';
            const res = await fetch(endpoint);

            let data;
            try {
                data = await res.json();
            } catch (jsonError) {
                // If it fails to parse JSON, the server likely returned a 502/500 HTML
                setApiError('Received an invalid or HTML response from the server.');
                setIsAutoSync(false);
                if (!isBackground) setLoading(false);
                return;
            }

            setLastSyncTime(new Date());

            if (!res.ok) {
                if (data.error === 'BOT_TOKEN_NOT_FOUND') {
                    setWarningState(true);
                    setApiError(null); // Clear other errors to show warningState
                    setIsAutoSync(false); // Stop auto-sync if token is missing
                } else {
                    // Loop protection
                    const newErrorCount = errorCount + 1;
                    setErrorCount(newErrorCount);

                    if (newErrorCount >= 3) {
                        setIsAutoSync(false);
                        setApiError(`Auto-sync paused after ${newErrorCount} consecutive errors: ${data.error || 'Connection failed'}`);
                    } else if (!isBackground) {
                        setApiError(data.error || 'Failed to fetch updates.');
                    }
                }
            } else {
                setErrorCount(0); // Reset on success
                if (data.ok && Array.isArray(data.result)) {
                    // Telegram API returns oldest first, reverse it to show newest updates on top
                    setUpdates([...data.result]); // Already reversed by backend now (desc)
                } else if (!isBackground) {
                    setApiError(data.description || 'Invalid Telegram response format.');
                }
            }
        } catch (error) {
            const newErrorCount = errorCount + 1;
            setErrorCount(newErrorCount);
            if (newErrorCount >= 3) {
                setIsAutoSync(false);
                setApiError('Auto-sync disabled due to repeated network errors.');
            } else if (!isBackground) {
                setApiError('Network error connecting to the API.');
            }
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full" />
                    <p className="text-xs text-slate-500">Connecting to Telegram API…</p>
                </div>
            </div>
        );
    }

    if (isLocked) {
        return (
            <div className="min-h-screen bg-[#080d1a] px-6 pb-20">
                <div className="max-w-7xl mx-auto pt-24 md:pt-12">
                    <LockedFeatureScreen featureName="The Telegram Console" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            <HeroHeader
                breadcrumbs={[
                    {
                        label: "Dashboard",
                        href: "/",
                        icon: <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                    },
                    {
                        label: "Telegram Console",
                        icon: <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.6)] animate-pulse mr-1" />
                    }
                ]}
                title="Telegram"
                badge="Console"
                description="Exclusive ULTRA developer utility. Real-time JSON validation and event inspections from your synced Telegram bot endpoints."
            />

            {/* Warning State: Token Not Defined - High Performance Redesign */}
            {warningState && (
                <div className="flex justify-center py-12 px-4">
                    <div className="w-full max-w-[520px] bg-[#0d111c] border border-white/10 rounded-[20px] overflow-hidden shadow-2xl relative">
                        {/* Top Accent Line */}
                        <div className="absolute top-0 inset-x-0 h-[2px] bg-linear-to-r from-orange-500 to-amber-400" />

                        <div className="p-10 flex flex-col items-center text-center">
                            {/* Status Icon */}
                            <div className="w-14 h-14 bg-[#1a1f2e] border border-orange-500/20 rounded-full flex items-center justify-center mb-6">
                                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>

                            <div className="space-y-2 mb-8">
                                <span className="inline-block text-[10px] font-black uppercase tracking-[0.2em] text-orange-500/80 bg-orange-500/5 px-3 py-1 rounded-full border border-orange-500/10 mb-2">
                                    Configuration Required
                                </span>
                                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                                    Missing Bot Token
                                </h2>
                                <div className="max-w-[400px] mx-auto text-slate-400 text-sm leading-relaxed">
                                    The console requires a valid Telegram Bot Token to synchronize activity. Please ensure the following key exists in your global configuration:
                                </div>
                            </div>

                            {/* Config Key Badge */}
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText('BOT_TOKEN_TELEGRAM');
                                    setTokenCopied(true);
                                    setTimeout(() => setTokenCopied(false), 2000);
                                }}
                                className={`flex items-center gap-2 px-4 py-2 bg-[#161b29] border rounded-xl font-mono text-xs mb-8 transition-all active:scale-95 group ${tokenCopied ? 'border-emerald-500/50 text-emerald-400' : 'border-white/5 text-blue-400 hover:border-blue-500/30'}`}
                            >
                                <span className={tokenCopied ? 'text-emerald-600' : 'text-slate-600'}>$</span>
                                <span className="font-bold tracking-wider">BOT_TOKEN_TELEGRAM</span>
                                {tokenCopied ? (
                                    <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                ) : (
                                    <svg className="w-3.5 h-3.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                )}
                            </button>

                            <div className="flex flex-col items-center gap-4 w-full">
                                <Link href="/config" className="w-full sm:w-auto">
                                    <button className="w-full px-8 py-3.5 bg-linear-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-sm rounded-xl shadow-lg transition-transform active:scale-[0.98]">
                                        Go to Global Configurations
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* API Error State */}
            {apiError && (
                <div className="bg-[#0c0e1a] border border-rose-500/20 rounded-2xl overflow-hidden p-8 text-center relative shadow-2xl shadow-rose-900/20">
                    <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-transparent via-rose-500/50 to-transparent" />
                    <div className="absolute -left-16 -top-16 w-32 h-32 bg-rose-500/5 rounded-full" />
                    <div className="absolute -right-16 -bottom-16 w-32 h-32 bg-red-500/5 rounded-full" />

                    <div className="w-16 h-16 mx-auto bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mb-5 relative z-10 border border-rose-500/20 shadow-lg shadow-rose-500/10">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>

                    <h2 className="text-2xl font-bold tracking-tight mb-2 text-white relative z-10">
                        Connection Failed
                    </h2>
                    <p className="text-rose-200/70 text-sm max-w-lg mx-auto mb-8 font-medium relative z-10 bg-rose-500/5 px-4 py-3 rounded-lg border border-rose-500/10">
                        {apiError}
                    </p>

                    <button
                        onClick={fetchUpdates}
                        className="relative z-10 px-8 py-3 bg-linear-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold rounded-xl text-sm shadow-xl shadow-rose-500/20 flex items-center gap-2 mx-auto"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Try Again
                    </button>
                </div>
            )}

            {/* Updates List */}
            {!warningState && !apiError && !loading && (
                <div className="bg-[#0c0e1a] border border-white/10 rounded-2xl md:rounded-3xl overflow-hidden shadow-xl relative">
                    <div className="px-6 md:px-8 py-5 border-b border-white/5 bg-linear-to-r from-[#111827] to-transparent flex items-center justify-between sticky top-0 z-30">
                        <h2 className="text-lg font-bold text-white flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/5 flex items-center justify-center border border-blue-500/20 shadow-inner">
                                <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" /></svg>
                            </div>
                            Activity Log
                        </h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    setErrorCount(0);
                                    setApiError(null);
                                    setIsAutoSync(!isAutoSync);
                                }}
                                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all ${isAutoSync ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400'}`}
                            >
                                <svg className={`w-3.5 h-3.5 ${isAutoSync ? 'animate-spin-slow' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                <span className="hidden sm:inline">
                                    {isAutoSync ? 'Auto Syncing' : 'Auto Sync'}
                                </span>
                            </button>
                            <button onClick={() => fetchUpdates(true)} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-slate-300 shadow-sm group">
                                <svg className="w-3.5 h-3.5 group-active:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
                                <span className="hidden sm:inline">Pull Latest</span>
                            </button>
                        </div>
                    </div>

                    {updates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-20 md:p-32 text-slate-500">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5 shadow-inner">
                                <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            </div>
                            <p className="text-base font-bold text-slate-300">No events found.</p>
                            <p className="text-sm mt-2 text-slate-500 max-w-sm text-center">No history in database yet. Click <span className="text-blue-400 font-semibold">Pull Latest</span> above to sync from Telegram for the first time.</p>
                        </div>
                    ) : (
                        <div className="p-5 md:p-8 relative">
                            {/* Process grouping by Date */}
                            {Object.entries(
                                updates.reduce((groups, update) => {
                                    let dateRaw = update.savedAt ? new Date(update.savedAt).getTime() / 1000 : null;
                                    if (!dateRaw) {
                                        const msg = update.message || update.edited_message || update.channel_post || update.my_chat_member;
                                        if (msg && msg.date) dateRaw = msg.date;
                                    }

                                    let dateGroup = 'Log Period';
                                    if (dateRaw) {
                                        const date = new Date(dateRaw * 1000);
                                        const today = new Date();
                                        const yesterday = new Date(today);
                                        yesterday.setDate(yesterday.getDate() - 1);

                                        if (date.toDateString() === today.toDateString()) {
                                            dateGroup = 'Today';
                                        } else if (date.toDateString() === yesterday.toDateString()) {
                                            dateGroup = 'Yesterday';
                                        } else {
                                            dateGroup = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                        }
                                    }
                                    if (!groups[dateGroup]) groups[dateGroup] = [];
                                    groups[dateGroup].push(update);
                                    return groups;
                                }, {})
                            ).map(([dateLabel, dateUpdates]) => (
                                <div key={dateLabel} className="mb-10 last:mb-0 relative">
                                    <div className="flex items-center gap-4 mb-6 relative z-20 md:pl-0 pl-1">
                                        <div className="bg-[#1e293b] border border-white/10 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase text-slate-300 shadow-md">
                                            {dateLabel}
                                        </div>
                                    </div>
                                    <div className="space-y-0">
                                        {dateUpdates.map((update) => (
                                            <TelegramUpdateCard key={update.update_id} update={update} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Sticky/Fixed Last Sync Indicator (Desktop Bottom Right) */}
            {lastSyncTime && (
                <div className="fixed bottom-6 right-8 z-100 hidden md:flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#0c0e1a]/80 backdrop-blur-md border border-white/10 shadow-2xl shadow-blue-500/10 transition-all hover:bg-[#0c0e1a] hover:border-blue-500/30 group">
                    <div className="relative flex items-center justify-center">
                        <div className={`w-2 h-2 rounded-full ${isAutoSync ? 'bg-emerald-500 animate-pulse' : 'bg-gray-600'}`} />
                        {isAutoSync && (
                            <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-25" />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 group-hover:text-blue-400 transition-colors">
                            {isAutoSync ? 'Auto-Sync Active' : 'Manual Mode'}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-slate-300">
                            Last Sync: {lastSyncTime.toLocaleTimeString()}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
