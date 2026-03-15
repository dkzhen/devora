'use client';

import { useState, useEffect, useMemo } from 'react';
import { HeroHeader, LoadingState } from '@/components/HeroHeader';

export default function QuickVault() {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [copiedId, setCopiedId] = useState(null);

    // Data State
    const [vaultItems, setVaultItems] = useState([]);
    // Notification State
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [error, setError] = useState(null);

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



    const openEditModal = (item, e) => {
        e.stopPropagation();
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
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

    // Authorization check before rendering anything else
    if (!loading && !isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-[#0a0f1e]">
                <div className="max-w-md w-full bg-[#1a1a24] border-2 border-red-500/30 rounded-2xl p-8 text-center shadow-2xl">
                    <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/30">
                        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
                    <p className="text-gray-400 leading-relaxed">
                        Quick Vault is restricted to logged-in users only. Please sign in to securely store your credentials.
                    </p>
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

    // Optimized: Group and filter items only when data or search changes
    const displayCategories = useMemo(() => {
        const categoryMap = vaultItems.reduce((acc, item) => {
            const cat = item.category || 'other';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(item);
            return acc;
        }, {});

        return Object.keys(categoryMap).map(key => {
            const filtered = filterItems(categoryMap[key]);
            if (filtered.length === 0) return null;

            let title = key.charAt(0).toUpperCase() + key.slice(1);
            let icon = <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>;

            if (key === 'social') {
                title = 'Social Accounts';
                icon = <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
            } else if (key === 'crypto') {
                title = 'Crypto Wallets';
                icon = <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
            } else if (key === 'exchange') {
                title = 'Exchanges';
                icon = <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;
            } else if (key === 'api') {
                title = 'API Keys';
                icon = <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>;
            }

            return { key, title, icon, items: filtered };
        }).filter(Boolean);
    }, [vaultItems, search]);



    return (
        <div className="min-h-screen text-white">
            {/* Grid Pattern Background */}
            <div className="fixed inset-0 opacity-[0.02] pointer-events-none" style={{
                backgroundImage: `linear-gradient(rgba(251,176,52,0.3) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(251,176,52,0.3) 1px, transparent 1px)`,
                backgroundSize: '30px 30px'
            }}></div>

            <div className="flex flex-col space-y-6 relative z-10 w-full">
                <HeroHeader 
                    title="Quick" 
                    badge="Vault" 
                    description="Secure repository for IDs, addresses, and credentials."
                    colorTheme="orange"
                    breadcrumbs={[
                        { label: 'Dashboard', href: '/' },
                        { label: 'Quick Vault' }
                    ]}
                    className="shrink-0"
                />

                {loading ? (
                    <div className="py-24 flex flex-col items-center justify-center bg-[#1a1a24]/30 rounded-2xl border border-white/5 ">
                        <LoadingState message="Connecting to secure storage..." colorTheme="orange" />
                        <p className="text-[10px] text-gray-500 mt-3 font-mono uppercase tracking-[0.3em] animate-pulse">Decrypting local vault...</p>
                    </div>
                ) : (
                    <div className="flex flex-col space-y-10">
                        {/* Controls Section */}
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="relative flex-1 w-full group">
                                <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400 z-10 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search vault items..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full bg-[#1a1a24]/30 border border-orange-500/10 rounded-xl pl-12 pr-6 py-3.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/30 transition-all font-medium "
                                />
                            </div>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="w-full md:w-auto h-[50px] flex items-center justify-center gap-2.5 bg-orange-500/5 hover:bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:border-orange-500/40 px-8 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 group/btn shadow-[0_0_8px_rgba(251,146,60,0.05)]"
                            >
                                <svg className="w-4 h-4 transition-transform group-hover/btn:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                                </svg>
                                <span>Add New Entry</span>
                            </button>
                        </div>

                        <div className="space-y-8 w-full p-1">
                            {displayCategories.map((category) => (
                                <div key={category.key} className="bg-[#1a1a24]/20  rounded-2xl p-5 transition-all border border-white/5">
                                    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/5">
                                        <div className="p-2 bg-linear-to-br from-orange-500/10 to-red-500/10 rounded-lg border border-orange-500/20 text-orange-400">
                                            {category.icon}
                                        </div>
                                        <h2 className="text-base md:text-lg font-bold text-white tracking-tight">{category.title}</h2>
                                        <span className="ml-auto px-3 py-0.5 bg-orange-500/5 text-orange-400/80 rounded-full text-[9px] font-black border border-orange-500/10 uppercase tracking-widest">
                                            {category.items.length} Units
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {category.items.map((item) => (
                                            <div
                                                key={item.id}
                                                onClick={() => handleCopy(item.id, item.value, item.label)}
                                                className="bg-[#0a0f1e] border-2 border-orange-500/20 hover:border-orange-500/60 rounded-xl p-4 transition-all cursor-pointer group relative overflow-hidden hover:shadow-md hover:shadow-orange-500/20"
                                            >
                                                {/* Hover Glow Effect */}
                                                <div className="absolute inset-0 bg-linear-to-br from-orange-500/0 to-red-500/0 group-hover:from-orange-500/5 group-hover:to-red-500/5 transition-all"></div>

                                                <div className="relative z-10">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <span className="text-[10px] font-bold text-orange-400/80 uppercase tracking-widest">{item.label}</span>
                                                        <div className="flex gap-0.5">
                                                            <button
                                                                onClick={(e) => openEditModal(item, e)}
                                                                className="p-1.5 rounded-lg text-gray-500 hover:bg-orange-500/10 hover:text-orange-400 transition-all opacity-0 group-hover:opacity-100"
                                                                title="Edit item"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setItemToDelete(item.id); }}
                                                                className="p-1.5 rounded-lg text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                                                                title="Delete item"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="font-mono text-xs text-white/90 font-medium">{truncate(item.value)}</span>
                                                        {copiedId === item.id ? (
                                                            <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-5 h-5 text-orange-400 shrink-0 group-hover:text-orange-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Empty Search State */}
                        {search && displayCategories.length === 0 && (
                            <div className="text-center py-16 bg-linear-to-br from-[#1a1a24] to-[#0f0f18] rounded-2xl border-2 border-orange-500/20">
                                <svg className="w-16 h-16 mx-auto text-orange-400/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <h3 className="text-xl font-bold text-white mb-2">No matching items</h3>
                                <p className="text-gray-400">We couldn't find any vault entries matching "<span className="text-orange-400 font-semibold">{search}</span>"</p>
                            </div>
                        )}

                        {/* Empty Vault State */}
                        {!search && vaultItems.length === 0 && (
                            <div className="text-center py-16 bg-linear-to-br from-[#1a1a24] to-[#0f0f18] rounded-2xl border-2 border-orange-500/30 shadow-lg shadow-orange-500/10">
                                <div className="w-24 h-24 mx-auto mb-6 bg-linear-to-br from-orange-500/20 to-red-500/20 rounded-2xl flex items-center justify-center border-2 border-orange-500/30">
                                    <svg className="w-12 h-12 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Your Vault is Empty</h3>
                                <p className="text-gray-400 mb-6 max-w-md mx-auto leading-relaxed">
                                    Keep your sensitive credentials, API keys, and phrases securely encrypted.
                                    Everything stored here is encrypted before saving and only accessible by you.
                                </p>

                                <div className="flex items-center justify-center gap-8 mb-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center border border-orange-500/30">
                                            <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        </div>
                                        <div className="text-left">
                                            <div className="text-sm font-bold text-white">AES-256 Secured</div>
                                            <div className="text-xs text-gray-500">Military-grade encryption</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center border border-orange-500/30">
                                            <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </div>
                                        <div className="text-left">
                                            <div className="text-sm font-bold text-white">Private Access</div>
                                            <div className="text-xs text-gray-500">Private only to you</div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="bg-orange-500/5 hover:bg-orange-500/10 text-orange-400 px-8 py-4 rounded-xl text-sm font-bold transition-all flex items-center gap-2 mx-auto border-2 border-orange-500/20 hover:border-orange-500/40 shadow-[0_0_10px_rgba(251,146,60,0.05)] active:scale-95 group/btn"
                                >
                                    <svg className="w-5 h-5 transition-transform group-hover/btn:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add your first item
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Save Modal (Add/Edit) */}
            {isModalOpen && (
                <EntryModal 
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    editingItem={editingItem}
                    onSave={(item, isEdit) => {
                        if (isEdit) {
                            setVaultItems(prev => prev.map(i => i.id === editingItem.id ? item : i));
                        } else {
                            setVaultItems(prev => [item, ...prev]);
                        }
                    }}
                />
            )}

            {/* Delete Confirmation Modal */}
            {itemToDelete && (
                <DeleteModal 
                    itemId={itemToDelete}
                    onClose={() => setItemToDelete(null)}
                    onConfirm={() => {
                        setVaultItems(prev => prev.filter(i => i.id !== itemToDelete));
                        setItemToDelete(null);
                    }}
                />
            )}

            {/* Global Toast Notification */}
            {showToast && (
                <div className="fixed bottom-6 right-6 bg-linear-to-r from-[#fbb034] to-[#ff8c42] text-white px-6 py-4 rounded-xl shadow-lg shadow-orange-500/40 flex items-center gap-3 z-50 border-2 border-orange-400/30">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-bold text-sm">{toastMessage}</span>
                </div>
            )}
        </div>
    );
}

// Isolated Entry Modal for snappier typing behavior
function EntryModal({ isOpen, onClose, editingItem, onSave }) {
    const [newItem, setNewItem] = useState({ category: 'social', label: '', value: '' });
    const [customCategory, setCustomCategory] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (editingItem) {
            const standardCategories = ['social', 'crypto', 'exchange', 'api'];
            if (standardCategories.includes(editingItem.category)) {
                setNewItem({ category: editingItem.category, label: editingItem.label, value: editingItem.value });
                setShowCustomInput(false);
            } else {
                setNewItem({ category: 'custom', label: editingItem.label, value: editingItem.value });
                setCustomCategory(editingItem.category);
                setShowCustomInput(true);
            }
        }
    }, [editingItem]);

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
                // Pass back the updated item with full decrypted value if editing
                const savedItem = editingItem ? { ...data.item, value: payload.value } : data.item;
                onSave(savedItem, !!editingItem);
                onClose();
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

    return (
        <div className="fixed inset-0 bg-black/80  flex items-center justify-center p-4 z-50">
            <div className="bg-linear-to-br from-[#1a1a24] to-[#0f0f18] rounded-2xl max-w-md w-full border-2 border-orange-500/30 shadow-lg shadow-orange-500/20 overflow-hidden">
                <div className="bg-linear-to-r from-[#fbb034] via-[#ff8c42] to-[#e60000] p-6">
                    <h3 className="text-2xl font-black text-white flex items-center gap-2">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        {editingItem ? 'Edit Item' : 'Add to Vault'}
                    </h3>
                    <p className="text-white/80 text-xs mt-1 font-medium flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                        Secure encryption active
                    </p>
                </div>

                <form onSubmit={handleSaveItem} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2">
                            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-orange-400 mb-2">Category</label>
                        <select
                            value={newItem.category}
                            onChange={(e) => {
                                setNewItem({ ...newItem, category: e.target.value });
                                setShowCustomInput(e.target.value === 'custom');
                            }}
                            className="w-full bg-[#0a0f1e] border-2 border-orange-500/20 focus:border-orange-500/60 rounded-xl px-4 py-3 text-white focus:outline-none transition-all font-medium"
                        >
                            <option value="social">Social Account</option>
                            <option value="crypto">Crypto Wallet</option>
                            <option value="api">API Key</option>
                            <option value="exchange">Exchange</option>
                            <option value="custom">Other / Custom...</option>
                        </select>
                    </div>

                    {showCustomInput && (
                        <div>
                            <label className="block text-sm font-bold text-orange-400 mb-2">Custom Category Name</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g., Gaming, Banking"
                                value={customCategory}
                                onChange={(e) => setCustomCategory(e.target.value)}
                                className="w-full bg-[#0a0f1e] border-2 border-orange-500/20 focus:border-orange-500/60 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none transition-all font-medium"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-orange-400 mb-2">Label</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g., Twitter Handle, BTC Wallet"
                            value={newItem.label}
                            onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
                            className="w-full bg-[#0a0f1e] border-2 border-orange-500/20 focus:border-orange-500/60 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none transition-all font-medium"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-orange-400 mb-2">Confidential Value</label>
                        <textarea
                            required
                            rows={3}
                            placeholder="Your credential or sensitive data"
                            value={newItem.value}
                            onChange={(e) => setNewItem({ ...newItem, value: e.target.value })}
                            className="w-full bg-[#0a0f1e] border-2 border-orange-500/20 focus:border-orange-500/60 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none transition-all font-medium resize-none font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Value will be AES-256 encrypted before storage
                        </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1 py-3 text-sm font-bold text-gray-400 hover:text-white transition-colors border-2 border-gray-700 hover:border-gray-600 rounded-xl"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 bg-linear-to-r from-[#fbb034] via-[#ff8c42] to-[#e60000] hover:from-[#f9a825] hover:via-[#ff7043] hover:to-[#dc2626] text-white py-3 rounded-xl text-sm font-bold transition-all shadow-md shadow-orange-500/30 disabled:opacity-50 border-2 border-orange-400/30"
                        >
                            {isSubmitting ? <><svg className="animate-spin h-4 w-4 inline mr-2" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Saving...</> : (editingItem ? 'Update Vault' : 'Secure Now')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Isolated Delete Confirmation Modal
function DeleteModal({ itemId, onClose, onConfirm }) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleDelete = async () => {
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/quick-vault/${itemId}`, { method: 'DELETE' });
            if (res.ok) {
                onConfirm();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80  flex items-center justify-center p-4 z-50">
            <div className="bg-linear-to-br from-[#1a1a24] to-[#0f0f18] rounded-2xl max-w-sm w-full border-2 border-red-500/30 shadow-lg shadow-red-500/20 p-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center border-2 border-red-500/30">
                    <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-white text-center mb-2">Are you sure?</h3>
                <p className="text-gray-400 text-sm text-center mb-6">
                    This action cannot be undone. This credential will be permanently removed from your secure vault.
                </p>
                <div className="space-y-3">
                    <button
                        onClick={handleDelete}
                        disabled={isSubmitting}
                        className="w-full bg-linear-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white py-3 rounded-xl text-sm font-bold transition-all shadow-md shadow-red-500/30 disabled:opacity-50 border-2 border-red-500/30"
                    >
                        {isSubmitting ? 'Deleting...' : 'Yes, Delete Permanently'}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="w-full py-3 text-sm font-bold text-gray-500 hover:text-white transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    );
}
