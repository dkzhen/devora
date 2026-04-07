'use client';

import { useState, useEffect } from 'react';
import { HeroHeader, LoadingState } from '@/components/HeroHeader';

export default function NaraAgentPage() {
    const [mounted, setMounted] = useState(false);
    const [wallets, setWallets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [toast, setToast] = useState(null);

    // Modal state
    const [showAddModal, setShowAddModal] = useState(false);
    const [pkInput, setPkInput] = useState('');
    const [aliasInput, setAliasInput] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        setMounted(true);
        const storedUser = localStorage.getItem('user_info');
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                setUser(parsed);
                fetchWallets(parsed.id);
            } catch (e) { console.error(e); setLoading(false); }
        } else {
            setLoading(false);
        }
    }, []);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const fetchWallets = async (userId) => {
        try {
            const res = await fetch(`/api/web3-projects/nara/wallets?userId=${userId}`);
            const data = await res.json();
            if (data.success) {
                setWallets(data.wallets);
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const handleAddWallet = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // Parse [1, 2, 3] format
            let pkArray;
            try {
                pkArray = JSON.parse(pkInput);
                if (!Array.isArray(pkArray)) throw new Error();
            } catch (e) {
                showToast('Invalid PK array format! Use [173, 31, ...]');
                setSubmitting(false);
                return;
            }

            const res = await fetch('/api/web3-projects/nara/wallets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    pkArray,
                    alias: aliasInput
                })
            });
            const data = await res.json();
            if (data.success) {
                setWallets([data.wallet, ...wallets]);
                setShowAddModal(false);
                setPkInput('');
                setAliasInput('');
                showToast('Wallet registered successfully!');
            } else {
                showToast(data.error || 'Failed to add wallet');
            }
        } catch (e) {
            showToast('Network error');
        } finally {
            setSubmitting(false);
        }
    };

    const refreshBalance = async (walletId) => {
        try {
            const res = await fetch(`/api/web3-projects/nara/wallets/${walletId}/refresh`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                setWallets(wallets.map(w => w.id === walletId ? data.wallet : w));
                showToast('Balance updated!');
            }
        } catch (e) { showToast('Sync failed'); }
    };

    const copyPk = async (walletId) => {
        try {
            const res = await fetch(`/api/web3-projects/nara/wallets/${walletId}/pk`);
            const data = await res.json();
            if (data.success) {
                const pkString = JSON.stringify(data.pkArray);
                navigator.clipboard.writeText(pkString);
                showToast('Private Key copied to clipboard!');
            }
        } catch (e) { showToast('Copy failed'); }
    };

    const deleteWallet = async (walletId) => {
        if (!confirm('Are you sure you want to remove this wallet?')) return;
        try {
            const res = await fetch(`/api/web3-projects/nara/wallets/${walletId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                setWallets(wallets.filter(w => w.id !== walletId));
                showToast('Wallet removed');
            }
        } catch (e) { showToast('Delete failed'); }
    };

    if (!mounted) return <LoadingState colorTheme="nara" message="Initializing Nara Neural Interface..." />;

    if (loading) return <LoadingState colorTheme="nara" message="Syncing Agent Registry..." />;

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <h2 className="text-xl font-black text-white">ACCESS RESTRICTED</h2>
                <p className="text-sm text-green-500/60 max-w-xs mt-2 font-mono uppercase tracking-widest leading-loose">Please login to access your specialized Nara Agent Registry and secure wallet vault.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700">
            {toast && (
                <div className="fixed bottom-6 right-6 z-100 flex items-center gap-3 px-6 py-4 bg-black border-2 border-green-500 text-green-400 font-mono text-xs font-black shadow-[0_0_30px_rgba(34,197,94,0.3)] animate-in slide-in-from-right duration-300">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
                    {toast}
                </div>
            )}

            <HeroHeader
                breadcrumbs={[
                    { label: 'Dashboard', href: '/' },
                    { label: 'Web3 Projects', href: '/web3-projects' },
                    { label: 'Nara Agent' }
                ]}
                title="NARA"
                badge="Agent Registry"
                description="Securely manage your Nara testnet wallets. Every agent gets an ID card. Verifiable, portable, enforced by math."
                colorTheme="nara"
                actionContent={
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="px-6 py-3 bg-green-500 hover:bg-green-400 text-black rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                        Add Wallet
                    </button>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#050a05] border border-green-500/20 rounded-3xl p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 blur-[100px] pointer-events-none" />
                        
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-xl font-black text-white tracking-tight uppercase">Active Registry</h2>
                                    <p className="text-xs text-green-500/60 font-mono tracking-widest uppercase">Verified On-Chain Identities</p>
                                </div>
                                <div className="text-xs font-mono text-green-500/40 bg-black px-4 py-1.5 rounded-full border border-green-500/20">
                                    {wallets.length} WALLET{wallets.length !== 1 ? 'S' : ''} DETECTED
                                </div>
                            </div>

                            {wallets.length === 0 ? (
                                <div className="py-20 flex flex-col items-center justify-center text-center bg-black/40 border-2 border-dashed border-green-500/10 rounded-2xl">
                                    <div className="w-16 h-16 bg-green-500/5 rounded-full flex items-center justify-center mb-4">
                                        <svg className="w-8 h-8 text-green-500/20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                    </div>
                                    <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">No wallet found in neural registry.</p>
                                    <button 
                                        onClick={() => setShowAddModal(true)}
                                        className="mt-4 text-[10px] font-black text-green-500 hover:text-green-400 uppercase tracking-widest underline decoration-2 underline-offset-4"
                                    >
                                        Register Your First PK
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {wallets.map((wallet) => (
                                        <div key={wallet.id} className="group relative bg-black border border-green-500/10 rounded-2xl p-5 hover:border-green-500/40 transition-all duration-300">
                                            <div className="flex flex-col md:flex-row md:items-center gap-6">
                                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                                    <div className="w-12 h-12 rounded-xl bg-green-500/5 border border-green-500/20 flex items-center justify-center shrink-0">
                                                        <svg className="w-6 h-6 text-green-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 21.012c4.341 0 8.014-2.758 9.387-6.574m-9.387-8.438a1.5 1.5 0 011.5 1.5v1.5a1.5 1.5 0 01-1.5 1.5h-1.5a1.5 1.5 0 01-1.5-1.5V7.5a1.5 1.5 0 011.5-1.5h1.5z" /></svg>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="text-xs font-black text-white uppercase tracking-wider truncate mb-1">
                                                            {wallet.alias || 'Primary Neural Node'}
                                                        </h4>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-mono text-gray-500 truncate">{wallet.address || 'PENDING SYNC...'}</span>
                                                            <button 
                                                                onClick={() => { navigator.clipboard.writeText(wallet.address); showToast('Address copied!'); }}
                                                                className="text-green-500/20 hover:text-green-500 transition-colors"
                                                            >
                                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
                                                    <div className="bg-green-500/5 border border-green-500/10 px-4 py-2 rounded-xl">
                                                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-none mb-1 text-center">Wallet Balance</p>
                                                        <p className="text-sm font-black text-green-400 text-center">{wallet.lastBalance || '0'} {wallet.lastUnit || 'NARA'}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={() => refreshBalance(wallet.id)}
                                                            className="p-2.5 bg-black border border-green-500/20 text-green-500 hover:border-green-500 hover:bg-green-500/5 rounded-xl transition-all group/btn"
                                                            title="Refresh Balance"
                                                        >
                                                            <svg className="w-4 h-4 group-hover/btn:rotate-180 transition-transform duration-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                                        </button>
                                                        <button 
                                                            onClick={() => copyPk(wallet.id)}
                                                            className="p-2.5 bg-black border border-green-500/20 text-green-500 hover:border-green-500 hover:bg-green-500/5 rounded-xl transition-all"
                                                            title="Secure Copy PK"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                                                        </button>
                                                        {wallet.explorerUrl && (
                                                            <a 
                                                                href={wallet.explorerUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-2.5 bg-black border border-green-500/20 text-green-500 hover:border-green-500 hover:bg-green-500/5 rounded-xl transition-all"
                                                                title="Open Explorer"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                            </a>
                                                        )}
                                                        <button 
                                                            onClick={() => deleteWallet(wallet.id)}
                                                            className="p-2.5 bg-black border border-red-500/20 text-red-500 hover:border-red-500 hover:bg-red-500/5 rounded-xl transition-all"
                                                            title="Remove Wallet"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tactical Sidebar */}
                <div className="space-y-6">
                    <div className="bg-black border border-green-500/20 rounded-3xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,1)]">
                        <div className="p-6 border-b border-green-500/10 bg-linear-to-br from-green-500/5 to-transparent">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Neural Stats</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-center text-xs font-mono">
                                <span className="text-gray-500">Total NARA</span>
                                <span className="text-green-500 font-black">
                                    {wallets.reduce((acc, curr) => acc + (parseFloat(curr.lastBalance) || 0), 0).toFixed(4)} NARA
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-mono">
                                <span className="text-gray-500">Node Uptime</span>
                                <span className="text-green-500">99.98%</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-mono">
                                <span className="text-gray-500">Encryption</span>
                                <span className="text-green-500">AES-256 GCM</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-mono">
                                <span className="text-gray-500">Nara API Status</span>
                                <span className="text-green-500">ONLINE</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#050a05] border border-green-500/10 rounded-3xl p-8 text-center group">
                        <div className="w-24 h-24 mx-auto relative mb-6">
                            <div className="absolute inset-0 border-2 border-green-500/20 border-t-green-500 rounded-full animate-spin-slow" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <img src="https://nara.build/favicon-v3.svg" alt="Nara" className="w-10 h-10 filter drop-shadow-[0_0_8px_#22c55e]" />
                            </div>
                        </div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-[0.2em]">Agent Verified</h4>
                        <p className="text-[10px] text-green-500/40 mt-1 font-mono uppercase">Proof-of-Neural Storage</p>
                    </div>
                </div>
            </div>

            {/* Add Wallet Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !submitting && setShowAddModal(false)}>
                    <div className="bg-[#050a05] border-2 border-green-500/30 rounded-3xl w-full max-w-xl shadow-[0_0_50px_rgba(34,197,94,0.1)] overflow-hidden" onClick={e => e.stopPropagation()}>
                        <form onSubmit={handleAddWallet} className="p-6 md:p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-black text-white tracking-tight uppercase">Register Neural Key</h3>
                                    <p className="text-xs text-green-500/50 mt-1 font-mono uppercase tracking-widest">Secure encrypted storage for testnet assets</p>
                                </div>
                                <button type="button" onClick={() => !submitting && setShowAddModal(false)} className="text-gray-600 hover:text-white transition-colors">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Wallet Alias (Optional)</label>
                                    <input
                                        type="text"
                                        value={aliasInput}
                                        onChange={(e) => setAliasInput(e.target.value)}
                                        placeholder="e.g. Tactical Node 01"
                                        className="w-full bg-black border border-green-500/20 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-green-500/60 transition-all font-mono"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Private Key Array <span className="text-green-500">*</span></label>
                                    <textarea
                                        required
                                        rows={3}
                                        value={pkInput}
                                        onChange={(e) => setPkInput(e.target.value)}
                                        placeholder="[173, 31, 93, 45, 87, 12, ...]"
                                        className="w-full bg-black border border-green-500/20 rounded-xl px-4 py-3 text-xs text-green-400 focus:outline-none focus:border-green-500/60 transition-all font-mono resize-none"
                                    />
                                    <p className="text-[9px] text-gray-600 font-mono italic mt-1">Input must be a valid byte array format: [N, N, N...]</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-4 bg-transparent border border-white/5 hover:bg-white/5 text-gray-500 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-colors"
                                    disabled={submitting}
                                >
                                    Abort
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || !pkInput}
                                    className="flex-[2] py-4 bg-green-500 hover:bg-green-400 text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] disabled:opacity-50"
                                >
                                    {submitting ? 'SYNCING KEY...' : 'CONFIRM REGISTRATION'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            <style jsx>{`
                .animate-spin-slow {
                    animation: spin 12s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
