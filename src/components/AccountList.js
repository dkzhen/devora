'use client';

import { useState } from 'react';

export default function AccountList({ accounts, loading, onRefresh, setAccounts, setNotification }) {
    const [refreshing, setRefreshing] = useState(false);
    const [deletingEmail, setDeletingEmail] = useState(null);

    const handleRefresh = async (email) => {
        setRefreshing(true);
        try {
            const res = await fetch(`/api/accounts/${encodeURIComponent(email)}`, { method: 'POST' });
            if (res.ok) {
                if (onRefresh) onRefresh();
                if (setNotification) setNotification({ type: 'success', message: 'Account refreshed successfully' });
            } else {
                if (setNotification) setNotification({ type: 'error', message: 'Failed to refresh account' });
            }
        } catch (error) {
            if (setNotification) setNotification({ type: 'error', message: 'Error refreshing account' });
        } finally {
            setRefreshing(false);
        }
    };

    const handleDelete = async (email) => {
        if (!confirm(`Are you sure you want to remove ${email}?`)) return;
        setDeletingEmail(email);
        try {
            const res = await fetch(`/api/accounts/${encodeURIComponent(email)}`, { method: 'DELETE' });
            if (res.ok) {
                if (setAccounts) setAccounts(prev => prev.filter(acc => acc.email !== email));
                if (onRefresh) onRefresh();
                if (setNotification) setNotification({ type: 'success', message: `Successfully removed ${email}` });
            } else {
                const data = await res.json();
                if (setNotification) setNotification({ type: 'error', message: data.error || 'Failed to delete account' });
            }
        } catch {
            if (setNotification) setNotification({ type: 'error', message: 'Network error while deleting' });
        } finally {
            setDeletingEmail(null);
        }
    };

    if (loading) {
        return (
            <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-linear-to-br from-[#0f172a] to-[#1e293b] p-8">
                <div className="space-y-3 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-14 bg-white/5 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (!accounts || accounts.length === 0) {
        return (
            <div className="relative overflow-hidden rounded-2xl border border-dashed border-white/10 bg-linear-to-br from-[#0f172a] to-[#1e293b] p-16 text-center">
                <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-blue-600/5 blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-black text-white mb-2">No Accounts Connected</h3>
                    <p className="text-gray-500 text-sm mb-6 max-w-sm">Connect your first Gmail account to start tracking your email activity.</p>
                    <a
                        href="/auth/google"
                        className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold shadow-xl shadow-blue-700/30 transition-all active:scale-95 border border-white/10"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Connect Account
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-linear-to-br from-[#0f172a] to-[#1e293b]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
                <h2 className="text-sm font-bold text-white">Connected Accounts</h2>
                <span className="text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg">
                    {accounts.length} Total
                </span>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/5">
                            {['Account', 'Status', 'Stats', 'Last Check', 'Actions'].map((h, i) => (
                                <th key={h} className={`px-6 py-3 text-[10px] font-bold text-gray-600 uppercase tracking-widest ${i === 2 ? 'text-center' : i === 4 ? 'text-right' : ''}`}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {accounts.map((account) => (
                            <tr key={account.email} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors group">
                                {/* Account */}
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-linear-to-br from-blue-500/20 to-indigo-600/20 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-black shrink-0">
                                            {account.email.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-white text-sm">{account.name || 'Unknown'}</div>
                                            <div className="text-xs text-gray-500">{account.email}</div>
                                        </div>
                                    </div>
                                </td>
                                {/* Status */}
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${account.status === 'active'
                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${account.status === 'active' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                        {account.status === 'active' ? 'Active' : 'Auth Needed'}
                                    </span>
                                </td>
                                {/* Stats */}
                                <td className="px-6 py-4">
                                    <div className="flex justify-center gap-6">
                                        <div className="text-center">
                                            <div className="text-sm font-black text-white">{account.totalMessages || '-'}</div>
                                            <div className="text-[9px] text-gray-600 uppercase font-bold tracking-wider">Msgs</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-sm font-black text-white">{account.totalThreads || '-'}</div>
                                            <div className="text-[9px] text-gray-600 uppercase font-bold tracking-wider">Threads</div>
                                        </div>
                                    </div>
                                </td>
                                {/* Last Check */}
                                <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                                    {account.lastCheck ? new Date(account.lastCheck).toLocaleString() : 'Never'}
                                </td>
                                {/* Actions */}
                                <td className="px-6 py-4">
                                    <div className="flex justify-end gap-1">
                                        <button
                                            onClick={() => handleRefresh(account.email)}
                                            disabled={refreshing}
                                            title="Refresh stats"
                                            className="p-2 rounded-lg bg-white/0 hover:bg-blue-500/10 text-gray-600 hover:text-blue-400 transition-colors border border-transparent hover:border-blue-500/20"
                                        >
                                            <svg className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(account.email)}
                                            disabled={deletingEmail === account.email}
                                            title="Remove account"
                                            className={`p-2 rounded-lg border border-transparent transition-colors ${deletingEmail === account.email
                                                    ? 'text-gray-700 cursor-not-allowed'
                                                    : 'bg-white/0 hover:bg-red-500/10 text-gray-600 hover:text-red-400 hover:border-red-500/20'
                                                }`}
                                        >
                                            {deletingEmail === account.email ? (
                                                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            )}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-white/5">
                {accounts.map((account) => (
                    <div key={account.email} className="p-4 space-y-4">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500/20 to-indigo-600/20 border border-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-black shrink-0">
                                    {account.email.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="font-bold text-white text-sm">{account.name || 'Unknown'}</div>
                                    <div className="text-xs text-gray-500">{account.email}</div>
                                </div>
                            </div>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border ${account.status === 'active'
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                                }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${account.status === 'active' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                {account.status === 'active' ? 'Active' : 'Auth Needed'}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 bg-white/3 rounded-xl p-3 border border-white/5">
                            <div className="text-center">
                                <div className="text-lg font-black text-white">{account.totalMessages || '-'}</div>
                                <div className="text-[9px] text-gray-600 uppercase font-bold tracking-wider">Messages</div>
                            </div>
                            <div className="text-center border-l border-white/5">
                                <div className="text-lg font-black text-white">{account.totalThreads || '-'}</div>
                                <div className="text-[9px] text-gray-600 uppercase font-bold tracking-wider">Threads</div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-1">
                            <div className="text-xs text-gray-600">
                                Last check: {account.lastCheck ? new Date(account.lastCheck).toLocaleDateString() : 'Never'}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleRefresh(account.email)}
                                    disabled={refreshing}
                                    className="p-2 text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg transition-colors active:bg-blue-500/20"
                                >
                                    <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                </button>
                                <button
                                    onClick={() => handleDelete(account.email)}
                                    disabled={deletingEmail === account.email}
                                    className={`p-2 rounded-lg transition-colors ${deletingEmail === account.email
                                            ? 'text-gray-700 cursor-not-allowed'
                                            : 'text-red-400 bg-red-500/10 border border-red-500/20 active:bg-red-500/20'
                                        }`}
                                >
                                    {deletingEmail === account.email ? (
                                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
