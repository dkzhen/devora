'use client';

import { useState, useEffect } from 'react';

export default function QuickVault() {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [copiedId, setCopiedId] = useState(null);

    // Data State
    const [vaultItems, setVaultItems] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [newItem, setNewItem] = useState({ category: 'social', label: '', value: '' });
    const [customCategory, setCustomCategory] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);

    // Notification State
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // Delete Confirmation State
    const [itemToDelete, setItemToDelete] = useState(null);

    useEffect(() => {
        const initialize = async () => {
            try {
                const userInfo = localStorage.getItem('user_info');
                if (userInfo) {
                    setIsAuthorized(true);
                    await fetchVaultItems();
                    return;
                }
                setLoading(false);
            } catch (e) {
                console.error('Failed to initialize vault', e);
                setLoading(false);
            }
        };
        initialize();
    }, []);

    const fetchVaultItems = async () => {
        try {
            const res = await fetch('/api/quick-vault');
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setVaultItems(data.items);
                } else {
                    setError('Failed to load items.');
                }
            } else {
                setError('Authentication failed or unauthorized.');
            }
        } catch (err) {
            setError('Network error loading items.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveItem = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const finalCategory = showCustomInput ? customCategory : newItem.category;
        const payload = { ...newItem, category: finalCategory };

        try {
            const url = editingItem ? `/api/quick-vault/${editingItem.id}` : '/api/quick-vault';
            const method = editingItem ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok && data.success) {
                if (editingItem) {
                    setVaultItems(vaultItems.map(item => item.id === editingItem.id ? { ...data.item, value: payload.value } : item));
                } else {
                    setVaultItems([data.item, ...vaultItems]);
                }
                closeModal();
            } else {
                setError(data.error || 'Failed to save item');
            }
        } catch (err) {
            setError('Network Error');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/quick-vault/${itemToDelete}`, { method: 'DELETE' });
            if (res.ok) {
                setVaultItems(vaultItems.filter(item => item.id !== itemToDelete));
                setItemToDelete(null);
            } else {
                setError('Failed to delete item.');
            }
        } catch (err) {
            setError('Network error while deleting.');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEditModal = (item, e) => {
        e.stopPropagation();
        setEditingItem(item);
        const standardCategories = ['social', 'crypto', 'exchange', 'api'];
        if (standardCategories.includes(item.category)) {
            setNewItem({ category: item.category, label: item.label, value: item.value });
            setShowCustomInput(false);
        } else {
            setNewItem({ category: 'custom', label: item.label, value: item.value });
            setCustomCategory(item.category);
            setShowCustomInput(true);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setNewItem({ category: 'social', label: '', value: '' });
        setCustomCategory('');
        setShowCustomInput(false);
        setError(null);
    };

    const handleCopy = (id, value, label) => {
        navigator.clipboard.writeText(value);
        setCopiedId(id);
        setToastMessage(`Copied ${label || 'value'} to clipboard`);
        setShowToast(true);
        setTimeout(() => {
            setCopiedId(null);
            setShowToast(false);
        }, 2000);
    };

    const truncate = (val) => {
        if (!val) return '';
        if (val.length <= 15) return val;
        return `${val.slice(0, 6)}...${val.slice(-4)}`;
    };

    if (loading) return <div className="min-h-screen bg-[#060b14] flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div></div>;

    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-[#060b14] flex items-center justify-center p-4">
                <div className="bg-[#0a0f1e] border border-red-500/20 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
                    <p className="text-gray-400 text-sm">Quick Vault is restricted to logged-in users only. Please sign in to securely store your credentials.</p>
                </div>
            </div>
        );
    }

    const filterItems = (items) => {
        if (!search) return items;
        const s = search.toLowerCase();
        return items.filter(i =>
            i.label.toLowerCase().includes(s) ||
            i.value.toLowerCase().includes(s) ||
            i.category.toLowerCase().includes(s)
        );
    };

    // Group items by category dynamically
    const categoryMap = vaultItems.reduce((acc, item) => {
        const cat = item.category || 'other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {});

    const displayCategories = Object.keys(categoryMap).map(key => {
        const filtered = filterItems(categoryMap[key]);
        if (filtered.length === 0) return null;

        let title = key.charAt(0).toUpperCase() + key.slice(1);
        let icon = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>;

        if (key === 'social') {
            title = 'Social Accounts';
            icon = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>;
        } else if (key === 'crypto') {
            title = 'Crypto Wallets';
            icon = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
        } else if (key === 'exchange') {
            title = 'Exchanges';
            icon = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>;
        } else if (key === 'api') {
            title = 'API Keys';
            icon = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>;
        }

        return { key, title, icon, items: filtered };
    }).filter(Boolean);

    const HeroHeader = () => (
        <div className="relative overflow-hidden rounded-2xl shrink-0">
            <div className="absolute inset-0 bg-linear-to-br from-gray-900 via-[#0d1b3e] to-gray-900" />
            <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-8 w-56 h-56 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.2) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

            <div className="relative z-10 p-5 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <nav className="flex text-xs text-violet-300/60 mb-3 items-center gap-2">
                        <a href="/" className="flex items-center gap-1 hover:text-violet-300 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                            Dashboard
                        </a>
                        <svg className="w-3 h-3 text-violet-400/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        <span className="text-violet-200 font-semibold">Quick Vault</span>
                    </nav>

                    <h1 className="text-2xl md:text-4xl font-black tracking-tight">
                        <span className="text-white">Quick </span>
                        <span className="text-transparent bg-clip-text bg-linear-to-r from-violet-400 via-blue-400 to-yellow-400">Vault</span>
                    </h1>
                    <p className="text-gray-400 mt-1 text-xs md:text-sm">Secure repository for IDs, addresses, and credentials.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative group w-full sm:w-auto">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="w-4 h-4 text-violet-500/50 transition-colors group-focus-within:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search vault..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full sm:w-64 bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all font-medium font-mono"
                        />
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full sm:w-auto flex justify-center items-center gap-2 bg-linear-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-violet-500/25 shrink-0"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        <span>Add Item</span>
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col space-y-4 md:space-y-6 pb-20 md:pb-8">
            <HeroHeader />

            <div className="space-y-8">
                {displayCategories.map((category) => (
                    <div key={category.key} className="space-y-4 animate-fade-in">
                        <div className="flex items-center gap-2 text-lg font-bold text-white px-1">
                            <span className="p-1.5 bg-violet-500/10 rounded-lg text-violet-400">{category.icon}</span>
                            {category.title}
                            <span className="ml-2 px-2 py-0.5 bg-white/5 rounded-md text-[10px] text-gray-500 font-mono tracking-wider">{category.items.length}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {category.items.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => handleCopy(item.id, item.value, item.label)}
                                    className="bg-[#0a0f1e] border border-white/5 rounded-2xl p-4 hover:border-violet-500/30 hover:bg-white/5 transition-all cursor-pointer group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 blur-3xl group-hover:bg-violet-600/10 transition-colors pointer-events-none" />

                                    <div className="flex justify-between items-start mb-2 relative z-10">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 group-hover:text-gray-400 transition-colors">{item.label}</span>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={(e) => openEditModal(item, e)}
                                                className="p-1.5 rounded-lg text-gray-500 hover:bg-violet-500/10 hover:text-violet-400 transition-all opacity-0 group-hover:opacity-100"
                                                title="Edit item"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setItemToDelete(item.id); }}
                                                className="p-1.5 rounded-lg text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                                                title="Delete item"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="relative z-10 font-mono text-sm text-gray-200 bg-black/40 rounded-xl px-3 py-2.5 flex items-center justify-between group-hover:bg-black/60 transition-all border border-white/5 group-hover:border-violet-500/20">
                                        <span className="truncate pr-4">{truncate(item.value)}</span>
                                        <div className="relative">
                                            {copiedId === item.id ? (
                                                <svg className="w-4 h-4 text-green-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            ) : (
                                                <svg className="w-4 h-4 text-gray-600 group-hover:text-violet-400/50 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {search && displayCategories.length === 0 && (
                    <div className="text-center py-20 bg-[#0a0f1e]/30 rounded-3xl border border-white/5">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">No matching items</h3>
                        <p className="text-gray-400 max-w-xs mx-auto">We couldn't find any vault entries matching "{search}"</p>
                    </div>
                )}

                {!search && vaultItems.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 px-4 mt-8 bg-[#0a0f1e]/50 border border-dashed border-white/10 rounded-3xl relative overflow-hidden">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10 shadow-xl shadow-black/50 backdrop-blur-sm relative">
                                <div className="absolute inset-0 bg-linear-to-b from-white/5 to-transparent rounded-2xl pointer-events-none" />
                                <svg className="w-10 h-10 text-violet-400 drop-shadow-[0_0_15px_rgba(139,92,246,0.3)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </div>
                            <h3 className="text-2xl font-bold tracking-tight text-white mb-3">Your Vault is Empty</h3>
                            <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed mb-8">
                                Keep your sensitive credentials, API keys, and phrases securely encrypted.
                                Everything stored here is encrypted before saving and only accessible by you.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg mb-8 text-left">
                                <div className="bg-black/20 rounded-xl p-4 border border-white/5 flex items-start gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 mt-0.5"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg></div>
                                    <div><div className="font-semibold text-white text-sm mb-1">AES-256 Secured</div><div className="text-xs text-gray-400">Military-grade encryption</div></div>
                                </div>
                                <div className="bg-black/20 rounded-xl p-4 border border-white/5 flex items-start gap-3">
                                    <div className="p-2 bg-violet-500/10 rounded-lg text-violet-400 mt-0.5"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg></div>
                                    <div><div className="font-semibold text-white text-sm mb-1">Private Access</div><div className="text-xs text-gray-400">Private only to you</div></div>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(true)} className="bg-linear-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white px-8 py-3.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-violet-500/25 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                Add your first item
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Save Modal (Add/Edit) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <div className="w-full max-w-md bg-[#0a0f1e] text-white rounded-3xl border border-white/10 shadow-2xl animate-scale-up overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-white/5 bg-[#0f172a]/50">
                            <div>
                                <h3 className="font-black text-xl tracking-tight">{editingItem ? 'Edit Item' : 'Add to Vault'}</h3>
                                <p className="text-xs text-gray-500 mt-1">Secure encryption active</p>
                            </div>
                            <button onClick={closeModal} className="p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleSaveItem} className="p-6 space-y-5">
                            {error && <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2 animate-shake"><svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{error}</div>}

                            <div className="space-y-1.5 font-mono">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] block pl-1">Category</label>
                                <div className="relative">
                                    <select
                                        className="w-full bg-[#060b14] border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500/50 appearance-none text-white font-semibold transition-all"
                                        value={newItem.category}
                                        onChange={(e) => {
                                            setNewItem({ ...newItem, category: e.target.value });
                                            setShowCustomInput(e.target.value === 'custom');
                                        }}
                                    >
                                        <option value="social">Social Account</option>
                                        <option value="crypto">Crypto Wallet</option>
                                        <option value="api">API Key</option>
                                        <option value="exchange">Exchange</option>
                                        <option value="custom">Other / Custom...</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
                                </div>
                            </div>

                            {showCustomInput && (
                                <div className="space-y-1.5 animate-slide-down">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] block pl-1">Custom Category Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Server, Gaming, Personal..."
                                        required
                                        className="w-full bg-[#060b14] border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500/50 text-white placeholder-gray-600 font-semibold"
                                        value={customCategory}
                                        onChange={(e) => setCustomCategory(e.target.value)}
                                    />
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] block pl-1">Label</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Binance UID, Private Key #1..."
                                    required
                                    className="w-full bg-[#060b14] border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500/50 text-white placeholder-gray-600 font-semibold"
                                    value={newItem.label}
                                    onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] block pl-1">Confidential Value</label>
                                <input
                                    type="text"
                                    placeholder="Value to be encrypted..."
                                    required
                                    className="w-full bg-[#060b14] border border-white/10 rounded-2xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-violet-500/50 text-white placeholder-gray-600"
                                    value={newItem.value}
                                    onChange={(e) => setNewItem({ ...newItem, value: e.target.value })}
                                />
                                <p className="text-[10px] text-violet-400 font-medium pt-1 px-1 flex items-center gap-1.5">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    Value will be AES-256 encrypted before storage
                                </p>
                            </div>

                            <div className="pt-4 flex items-center gap-3">
                                <button type="button" onClick={closeModal} className="flex-1 px-4 py-3 text-sm font-bold text-gray-500 hover:text-white transition-colors">Cancel</button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-2 py-3.5 text-sm font-black bg-linear-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white rounded-2xl shadow-xl shadow-violet-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Saving...</> : (editingItem ? 'Update Vault' : 'Secure Now')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {itemToDelete && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
                    <div className="w-full max-w-sm bg-[#0a0f1e] border border-red-500/20 rounded-3xl p-6 shadow-2xl animate-scale-up text-center">
                        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </div>
                        <h3 className="text-xl font-black text-white mb-2">Are you sure?</h3>
                        <p className="text-gray-400 text-sm mb-8 leading-relaxed">This action cannot be undone. This credential will be permanently removed from your secure vault.</p>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={confirmDelete}
                                disabled={isSubmitting}
                                className="w-full py-3.5 bg-red-500 hover:bg-red-400 text-white font-black rounded-2xl shadow-xl shadow-red-500/20 transition-all disabled:opacity-50"
                            >
                                {isSubmitting ? 'Deleting...' : 'Yes, Delete Permanently'}
                            </button>
                            <button onClick={() => setItemToDelete(null)} className="w-full py-3 text-sm font-bold text-gray-500 hover:text-white transition-colors">Go Back</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Global Toast Notification */}
            {showToast && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-100 animate-toast-in">
                    <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-3.5 shadow-2xl flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-green-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <span className="text-white text-sm font-bold tracking-tight">{toastMessage}</span>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes toast-in {
                    0% { opacity: 0; transform: translate(-50%, 20px) scale(0.9); }
                    100% { opacity: 1; transform: translate(-50%, 0) scale(1); }
                }
                @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
                @keyframes scale-up { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
                @keyframes slide-up { 0% { transform: translateY(100%); } 100% { transform: translateY(0); } }
                @keyframes slide-down { 0% { opacity: 0; transform: translateY(-10px); } 100% { opacity: 1; transform: translateY(0); } }
                @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
                .animate-toast-in { animation: toast-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                .animate-scale-up { animation: scale-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }
                .animate-slide-down { animation: slide-down 0.2s ease-out forwards; }
                .animate-shake { animation: shake 0.3s ease-in-out; }
            `}</style>
        </div>
    );
}
