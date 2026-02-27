'use client';

import { useState, useEffect } from 'react';

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
            <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-linear-to-br from-[#0f172a] to-[#1e293b] flex flex-col items-center justify-center py-20 px-6 text-center">
                {/* Background orbs */}
                <div className="absolute top-1/4 left-1/4 w-48 h-48 rounded-full bg-cyan-600/5 blur-3xl pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-blue-600/5 blur-3xl pointer-events-none" />

                {/* Icon */}
                <div className="relative mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/15 flex items-center justify-center mx-auto">
                        <svg className="w-10 h-10 text-cyan-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                        </svg>
                    </div>
                </div>

                <h3 className="text-lg font-black text-white mb-2">No accounts connected</h3>
                <p className="text-gray-600 text-sm max-w-xs leading-relaxed mb-6">
                    Connect a Google Account with Drive permissions to manage your files here.
                </p>

                <a
                    href="/gmail-center"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-cyan-700/25 transition-all hover:scale-[1.03] active:scale-[0.98] border border-white/10"
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
            <div className="relative overflow-hidden rounded-2xl border border-red-500/20 bg-linear-to-br from-[#1a0f12] to-[#2b1015] flex flex-col items-center justify-center py-20 px-6 text-center h-auto md:h-[680px]">
                <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 className="text-xl font-black text-white mb-2">Drive Access Required</h3>
                <p className="text-gray-400 text-sm max-w-sm mb-8">
                    The currently selected account ({selectedEmail}) does not have Google Drive permissions enabled. You must remove this account in Gmail Center and reconnect it to grant Drive permissions.
                </p>
                <div className="flex items-center gap-4">
                    <a href="/gmail-center" className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl transition-all font-semibold">
                        Go to Gmail Center
                    </a>
                </div>
            </div>
        );
    }

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
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
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
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
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
                            placeholder="Search drive (Enter)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearch}
                            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:bg-white/8 transition-all"
                        />
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing || !selectedEmail}
                        className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-cyan-400 rounded-xl transition-colors disabled:opacity-40"
                        title="Refresh"
                    >
                        <svg className={`w-5 h-5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
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
                                className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-white transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                Back to {folderHistory[folderHistory.length - 1].name}
                            </button>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto">
                        {loading && files.length === 0 ? (
                            <div className="p-8 text-center space-y-3">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="h-14 bg-white/3 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : files.length === 0 ? (
                            <div className="p-10 text-center text-gray-600">
                                <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                                <p className="text-sm">No files found</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {files.map((f) => {
                                    const isFolder = f.mimeType === 'application/vnd.google-apps.folder';
                                    return (
                                        <div
                                            key={f.id}
                                            onClick={() => isFolder ? handleFolderClick(f) : setSelectedFile(f)}
                                            className={`p-4 cursor-pointer transition-colors ${selectedFile?.id === f.id
                                                ? 'bg-cyan-500/10 border-l-2 border-cyan-500'
                                                : 'border-l-2 border-transparent hover:bg-white/3'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center shrink-0">
                                                    {isFolder ? (
                                                        <svg className="w-5 h-5 text-yellow-400/80" fill="currentColor" viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" /></svg>
                                                    ) : f.iconLink ? (
                                                        <img src={f.iconLink} alt="" className="w-5 h-5" />
                                                    ) : (
                                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className={`font-semibold text-sm truncate ${selectedFile?.id === f.id ? 'text-cyan-400' : 'text-gray-200'}`}>
                                                        {f.name}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
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

                {/* Detail View */}
                <div className={`flex-1 overflow-y-auto ${selectedFile ? 'block' : 'hidden md:block'} bg-black/20`}>
                    {selectedFile ? (
                        <div className="h-full flex flex-col items-center justify-center p-8">
                            {/* Detail content */}
                            <div className="md:hidden w-full mb-8">
                                <button
                                    onClick={() => setSelectedFile(null)}
                                    className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                                    Back to files
                                </button>
                            </div>

                            <div className="max-w-md w-full bg-[#1e293b] border border-white/10 rounded-2xl p-8 shadow-2xl flex flex-col items-center text-center">
                                <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-inner">
                                    {selectedFile.iconLink ? (
                                        <img src={selectedFile.iconLink.replace('16', '64')} alt="" className="w-12 h-12" />
                                    ) : (
                                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                    )}
                                </div>
                                <h2 className="text-xl font-bold text-white mb-2 wrap-break-word w-full">{selectedFile.name}</h2>
                                <p className="text-sm text-gray-400 mb-8 max-w-sm">
                                    {selectedFile.mimeType} <br />
                                    {selectedFile.size && <span className="mt-1 block font-medium text-gray-300">{formatBytes(selectedFile.size)}</span>}
                                    <span className="block mt-1">Modified: {new Date(selectedFile.modifiedTime).toLocaleString()}</span>
                                </p>

                                <button
                                    onClick={handleDownload}
                                    className="w-full sm:w-auto px-8 py-3 bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-700/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    Download File
                                </button>

                                {selectedFile.mimeType.includes("google-apps") && (
                                    <p className="mt-4 text-xs text-yellow-500/80 bg-yellow-500/10 border border-yellow-500/20 px-3 py-2 rounded-lg">
                                        Google Docs/Sheets/Slides files will be exported as PDF.
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="hidden md:flex flex-col items-center justify-center h-full text-gray-700">
                            <svg className="w-14 h-14 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                            <p className="text-base font-semibold">Select a file to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
