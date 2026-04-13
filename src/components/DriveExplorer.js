'use client';

import { useState, useEffect } from 'react';
import { LoadingState } from "@/components/HeroHeader";

const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export default function DriveExplorer({ accounts }) {
    const [selectedEmail, setSelectedEmail] = useState('');
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [needsReconnect, setNeedsReconnect] = useState(false);

    // Folder navigation state
    const [currentFolderId, setCurrentFolderId] = useState('root');
    const [folderHistory, setFolderHistory] = useState([]);

    useEffect(() => {
        if (accounts?.length > 0 && !selectedEmail) {
            const active = accounts.find(a => a.status === 'active');
            setSelectedEmail(active ? active.email : accounts[0].email);
        }
    }, [accounts, selectedEmail]);

    useEffect(() => {
        if (selectedEmail) {
            // Reset folder states on account change
            setCurrentFolderId('root');
            setFolderHistory([]);
            fetchFiles(selectedEmail, '', 'root');
            setSelectedFile(null);
        } else {
            setFiles([]);
        }
    }, [selectedEmail]);

    const fetchFiles = async (email, query = '', folderId = currentFolderId) => {
        setLoading(true);
        setNeedsReconnect(false);
        try {
            const url = new URL(window.location.origin + `/api/drive/files`);
            url.searchParams.append('email', email);
            if (query) url.searchParams.append('q', query);
            url.searchParams.append('folderId', folderId);

            const res = await fetch(url);
            if (res.status === 403) {
                const data = await res.json();
                if (data.needsReconnect) {
                    setNeedsReconnect(true);
                    return;
                }
            }
            if (res.ok) {
                const data = await res.json();
                setFiles(data.files || []);
                if (window.innerWidth >= 768 && data.files?.length > 0) setSelectedFile(data.files[0]);

                if (!data.files || data.files.length === 0) {
                    handleRefresh(email, query, folderId);
                }
            } else {
                setFiles([]);
            }
        } catch { /* silent */ } finally { setLoading(false); }
    };

    const handleRefresh = async (emailOverride = null, queryOverride = null, folderIdOverride = null) => {
        const targetEmail = typeof emailOverride === 'string' ? emailOverride : selectedEmail;
        if (!targetEmail) return;
        setRefreshing(true);
        setNeedsReconnect(false);
        try {
            const url = new URL(window.location.origin + `/api/drive/files`);
            url.searchParams.append('email', targetEmail);
            const q = queryOverride !== null ? queryOverride : searchQuery;
            const targetFolderId = folderIdOverride !== null ? folderIdOverride : currentFolderId;
            if (q) url.searchParams.append('q', q);
            url.searchParams.append('folderId', targetFolderId);

            const res = await fetch(url, { method: 'POST', headers: { 'Cache-Control': 'no-cache' } });
            if (res.status === 403) {
                const data = await res.json();
                if (data.needsReconnect) {
                    setNeedsReconnect(true);
                    return;
                }
            }
            if (res.ok) {
                const data = await res.json();
                setFiles(data.files || []);
                if (window.innerWidth >= 768 && data.files?.length > 0) setSelectedFile(data.files[0]);
            }
        } catch { /* silent */ } finally { setRefreshing(false); }
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            // When searching, we might still want to search within current folder or global. 
            // The drive api query handles it contextually if folderId is passed.
            fetchFiles(selectedEmail, searchQuery, currentFolderId);
        }
    };

    const handleFolderClick = (folder) => {
        setFolderHistory(prev => [...prev, { id: currentFolderId, name: folderHistory.length === 0 ? 'My Drive' : files.find(f => f.id === currentFolderId)?.name || 'Folder' }]);
        setCurrentFolderId(folder.id);
        fetchFiles(selectedEmail, '', folder.id);
        setSelectedFile(null);
        setSearchQuery('');
    };

    const handleBackClick = () => {
        if (folderHistory.length === 0) return;
        const newHistory = [...folderHistory];
        const previousFolder = newHistory.pop();
        setFolderHistory(newHistory);
        setCurrentFolderId(previousFolder.id);
        fetchFiles(selectedEmail, '', previousFolder.id);
        setSelectedFile(null);
        setSearchQuery('');
    };

    const handleDownload = () => {
        if (!selectedFile || !selectedEmail) return;
        const url = `/api/drive/download?email=${encodeURIComponent(selectedEmail)}&fileId=${selectedFile.id}`;
        window.open(url, '_blank');
    };

    if (!accounts || accounts.length === 0) {
        return (
            <div className="relative overflow-hidden rounded-none border-2 border-[#108dc7]/50 bg-[#0B0F1A] flex flex-col items-center justify-center py-20 px-6 text-center shadow-[4px_4px_0px_0px_rgba(16,141,199,0.1)]">
                <div className="relative mb-6">
                    <div className="w-20 h-20 rounded-none bg-[#108dc7]/10 border-2 border-[#108dc7]/30 flex items-center justify-center mx-auto">
                        <svg className="w-10 h-10 text-[#108dc7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                        </svg>
                    </div>
                </div>

                <h3 className="text-lg font-black text-white mb-2 uppercase tracking-widest">No accounts connected</h3>
                <p className="text-[#108dc7]/80 text-sm max-w-xs leading-relaxed mb-6 font-mono">
                    Connect a Google Account with Drive permissions to manage your files here.
                </p>

                <a
                    href="/gmail-center"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#108dc7] hover:bg-[#ef8e38] text-[#0B0F1A] text-xs font-black uppercase tracking-widest rounded-none transition-colors border-2 border-[#108dc7] hover:border-[#ef8e38]"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" />
                    </svg>
                    Connect Account
                </a>
            </div>
        );
    }

    const selectedAccount = accounts.find(a => a.email === selectedEmail);

    if (needsReconnect) {
        return (
            <div className="relative overflow-hidden border-2 border-[#ef8e38]/50 bg-[#0B0F1A] flex flex-col items-center justify-center py-20 px-6 text-center h-auto md:h-[680px]">
                <div className="w-20 h-20 bg-[#ef8e38]/10 border-2 border-[#ef8e38] flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-[#ef8e38]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 className="text-xl font-black text-[#ef8e38] uppercase tracking-widest mb-2 font-mono">Drive Access Required</h3>
                <p className="text-[#108dc7]/80 text-xs max-w-sm mb-8 font-mono tracking-widest uppercase">
                    Account ({selectedEmail}) needs Drive permissions. Remove in Gmail Center and reconnect.
                </p>
                <div className="flex items-center gap-4">
                    <a href="/gmail-center" className="px-6 py-3 bg-transparent border-2 border-[#ef8e38] hover:bg-[#ef8e38] hover:text-[#0B0F1A] text-[#ef8e38] text-xs transition-colors font-black uppercase tracking-widest">
                        Go to Gmail Center
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden rounded-none border-2 border-[#108dc7]/30 bg-[#0B0F1A] flex flex-col h-auto md:h-[680px] shadow-[4px_4px_0px_0px_rgba(16,141,199,0.05)]">

            {/* ── Toolbar ── */}
            <div className="px-4 py-3 border-b border-white/5 flex flex-col sm:flex-row justify-between items-center gap-3">
                {/* Account switcher */}
                <div className="relative w-full sm:w-64 z-20">
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="w-full flex items-center justify-between pl-3 pr-4 py-2 bg-transparent hover:bg-[#108dc7]/10 border-2 border-[#108dc7]/30 rounded-none text-sm text-[#108dc7] font-mono outline-none transition-none"
                    >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="truncate text-slate-300 text-sm">{selectedEmail || 'Select Account'}</span>
                            {selectedAccount?.status === 'active' ? (
                                <span className="relative flex h-2 w-2 ml-1 shrink-0">
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ef8e38]" />
                                </span>
                            ) : (
                                <span className="h-2 w-2 rounded-full bg-gray-600 shrink-0" />
                            )}
                        </div>
                        <svg className={`w-4 h-4 text-slate-500 transition-transform shrink-0 ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>

                    {dropdownOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                            <div className="absolute top-full left-0 right-0 mt-1 bg-[#0B0F1A] border-2 border-[#108dc7]/40 rounded-none z-20 max-h-60 overflow-y-auto shadow-[8px_8px_0px_0px_rgba(16,141,199,0.1)]">
                                {accounts.map(acc => (
                                    <div
                                        key={acc.email}
                                        onClick={() => { setSelectedEmail(acc.email); setDropdownOpen(false); }}
                                        className="px-4 py-2.5 hover:bg-white/5 cursor-pointer flex items-center justify-between text-sm text-slate-300 hover:text-white transition-colors"
                                    >
                                        <span className="truncate">{acc.email}</span>
                                        {acc.status === 'active' ? (
                                            <span className="relative flex h-2 w-2 ml-2 shrink-0">
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ef8e38]" />
                                            </span>
                                        ) : (
                                            <span className="h-2 w-2 rounded-full bg-gray-600 ml-2 shrink-0" />
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
                            placeholder="Search drive (Enter)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearch}
                                className="w-full pl-9 pr-4 py-2 bg-transparent border-2 border-[#108dc7]/30 rounded-none text-sm text-[#108dc7] font-mono placeholder-[#108dc7]/40 focus:outline-none focus:border-[#ef8e38] transition-colors"
                            />
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#108dc7]/50">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                        </div>
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing || !selectedEmail}
                            className={`p-2 bg-transparent border-2 rounded-none transition-colors ${refreshing ? 'border-[#ef8e38] text-[#ef8e38]' : 'border-[#108dc7]/30 text-[#108dc7] hover:border-[#108dc7] hover:text-[#ef8e38]'} disabled:opacity-40`}
                            title="Refresh"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        </button>
                    </div>
                </div>

            {/* ── Body ── */}
            <div className="flex flex-1 overflow-hidden">
                {/* File List */}
                <div className={`w-full md:w-[320px] shrink-0 border-r border-white/5 flex flex-col ${selectedFile ? 'hidden md:flex' : 'flex'}`}>

                    {/* Back Button / Breadcrumb */}
                    {folderHistory.length > 0 && (
                        <div className="px-4 py-2 border-b border-white/5 bg-white/2 shrink-0">
                            <button
                                onClick={handleBackClick}
                                className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                Back to {folderHistory[folderHistory.length - 1].name}
                            </button>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto">
                        {loading && files.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-12">
                                <LoadingState message="Scanning drive..."  />
                            </div>
                        ) : files.length === 0 ? (
                            <div className="p-10 text-center text-[#108dc7]/50">
                                <svg className="w-10 h-10 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                                <p className="text-xs font-mono uppercase tracking-widest">No files found</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-[#108dc7]/20 border-t border-[#108dc7]/20">
                                {files.map((f) => {
                                    const isFolder = f.mimeType === 'application/vnd.google-apps.folder';
                                    return (
                                        <div
                                            key={f.id}
                                            onClick={() => isFolder ? handleFolderClick(f) : setSelectedFile(f)}
                                            className={`p-4 cursor-pointer transition-colors border-l-2 ${selectedFile?.id === f.id
                                                ? 'bg-[#108dc7]/15 border-[#ef8e38]'
                                                : 'border-transparent hover:bg-[#108dc7]/5'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-[#108dc7]/10 border border-[#108dc7]/30 flex items-center justify-center shrink-0">
                                                    {isFolder ? (
                                                        <svg className="w-5 h-5 text-[#ef8e38]" fill="currentColor" viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" /></svg>
                                                    ) : f.iconLink ? (
                                                        <img src={f.iconLink} alt="" className="w-5 h-5 grayscale opacity-80" />
                                                    ) : (
                                                        <svg className="w-5 h-5 text-[#108dc7]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className={`font-mono font-bold text-[11px] uppercase tracking-wide truncate ${selectedFile?.id === f.id ? 'text-[#ef8e38]' : 'text-white'}`}>
                                                        {f.name}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-1 text-[10px] text-[#108dc7]">
                                                        {f.size && <span>{formatBytes(f.size)}</span>}
                                                        {f.size && <span>•</span>}
                                                        <span>{new Date(f.modifiedTime).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className={`flex-1 overflow-y-auto ${selectedFile ? 'block' : 'hidden md:block'} bg-[#0B0F1A] border-l-2 border-[#108dc7]/30`}>
                    {selectedFile ? (
                        <div className="h-full flex flex-col items-center justify-center p-8">
                            {/* Detail content */}
                            <div className="md:hidden w-full mb-8">
                                <button
                                    onClick={() => setSelectedFile(null)}
                                    className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                                    Back to files
                                </button>
                            </div>

                            <div className="max-w-md w-full bg-transparent border-2 border-[#108dc7]/30 p-8 flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-[#108dc7]/10 border-2 border-[#108dc7]/30 flex items-center justify-center mb-6">
                                    {selectedFile.iconLink ? (
                                        <img src={selectedFile.iconLink.replace('16', '64')} alt="" className="w-12 h-12 grayscale opacity-80" />
                                    ) : (
                                        <svg className="w-10 h-10 text-[#108dc7]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                    )}
                                </div>
                                <h2 className="text-sm font-black text-[#ef8e38] font-mono tracking-widest uppercase mb-2 break-all w-full">{selectedFile.name}</h2>
                                <p className="text-xs text-[#108dc7]/80 font-mono mb-8 max-w-sm uppercase tracking-widest">
                                    {selectedFile.mimeType} <br />
                                    {selectedFile.size && <span className="mt-2 block text-white">{formatBytes(selectedFile.size)}</span>}
                                    <span className="block mt-2">MODIFIED: {new Date(selectedFile.modifiedTime).toLocaleDateString()}</span>
                                </p>

                                <button
                                    onClick={handleDownload}
                                    className="w-full sm:w-auto px-8 py-3 bg-[#108dc7] hover:bg-[#ef8e38] border-2 border-[#108dc7] hover:border-[#ef8e38] text-[#0B0F1A] font-black uppercase tracking-widest text-xs transition-colors rounded-none flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    Download
                                </button>

                                {selectedFile.mimeType.includes("google-apps") && (
                                    <p className="mt-6 text-[10px] font-mono uppercase tracking-widest text-[#ef8e38] border border-[#ef8e38]/30 px-3 py-2 bg-[#ef8e38]/5">
                                        Google Docs/Sheets/Slides exported as PDF.
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="hidden md:flex flex-col items-center justify-center h-full text-[#108dc7]/30">
                            <svg className="w-14 h-14 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                            <p className="text-xs font-mono uppercase tracking-widest">Select file</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
