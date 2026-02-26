'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import SidebarSkeleton from './SidebarSkeleton';

const ROLE_COLORS = {
    ULTRA: 'from-purple-500 to-pink-500',
    PRO: 'from-blue-500 to-indigo-500',
    MEMBER: 'from-gray-500 to-gray-600',
};

const ROLE_BADGE = {
    ULTRA: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    PRO: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    MEMBER: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
};

export default function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [user, setUser] = useState(null);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        const fetchUser = async () => {
            try {
                const res = await fetch('/api/auth/me', {
                    cache: 'no-store',
                    headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
                });
                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user);
                    localStorage.setItem('user_info', JSON.stringify(data.user));
                } else {
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user_info');
                    setUser(null);
                }
            } catch {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_info');
                setUser(null);
            }
        };
        fetchUser();
    }, [router]);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_info');
            window.location.href = '/login';
        } catch { /* silent */ }
    };

    const [search, setSearch] = useState('');

    const menuCategories = [
        {
            label: 'General',
            items: [
                {
                    name: 'Dashboard',
                    href: '/',
                    icon: <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                },
                {
                    name: 'Airdrops',
                    href: '/airdrops',
                    icon: <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 21v-6m0 0l-3 3m3-3l3 3" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5.5 11C5.5 7.41 8.41 4.5 12 4.5S18.5 7.41 18.5 11" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 11a9 9 0 0118 0" /><line strokeLinecap="round" strokeWidth={1.5} x1="12" y1="15" x2="5.5" y2="11" /><line strokeLinecap="round" strokeWidth={1.5} x1="12" y1="15" x2="18.5" y2="11" /></svg>
                },
            ]
        },
        {
            label: 'Tools',
            items: [
                {
                    name: 'Gmail Center',
                    href: '/gmail-center',
                    icon: <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" /></svg>
                },
                {
                    name: 'Mail Control',
                    href: '/mail-control',
                    icon: <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                },

            ]
        },
        {
            label: 'System',
            items: [
                {
                    name: 'Endpoints',
                    href: '/endpoints',
                    icon: <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                },
            ]
        },
    ];

    if (pathname === '/login') return null;
    if (!mounted) return <SidebarSkeleton />;

    const SidebarContent = () => (
        <aside className="h-full w-64 bg-[#0a0f1e] border-r border-white/5 flex flex-col">
            {/* Logo */}
            <div className="px-5 py-5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-500/30">
                    M
                </div>
                <span className="text-lg font-black text-white tracking-tight">Devora</span>
            </div>

            {/* Search */}
            <div className="px-3 pb-2">
                <div className="relative">
                    <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search menu..."
                        className="w-full bg-white/4 border border-white/8 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500/40 focus:bg-blue-500/5 transition-all"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {(() => {
                    const q = search.trim().toLowerCase();
                    if (q) {
                        const results = menuCategories.flatMap(cat => cat.items).filter(item =>
                            item.name.toLowerCase().includes(q)
                        );
                        return (
                            <div>
                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 px-2">
                                    Results {results.length > 0 ? `(${results.length})` : ''}
                                </div>
                                {results.length === 0 ? (
                                    <div className="px-3 py-4 text-center text-xs text-gray-400">No results found</div>
                                ) : (
                                    <div className="space-y-0.5">
                                        {results.map(item => {
                                            const isActive = pathname === item.href;
                                            const isLocked = (!user && item.href !== '/' && item.href !== '/airdrops') || (item.href === '/endpoints' && user?.role !== 'ULTRA');
                                            if (isLocked) return (
                                                <div key={item.href} className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 cursor-not-allowed">
                                                    <div className="flex items-center gap-3">{item.icon}{item.name}</div>
                                                    <svg className="w-3.5 h-3.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                                </div>
                                            );
                                            return (
                                                <Link key={item.href} href={item.href} onClick={() => { setIsOpen(false); setSearch(''); }}
                                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${isActive ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}>
                                                    {item.icon}{item.name}
                                                    {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    return (
                        <div className="space-y-4">
                            {menuCategories.map(cat => (
                                <div key={cat.label}>
                                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 px-2">{cat.label}</div>
                                    <div className="space-y-0.5">
                                        {cat.items.map(item => {
                                            const isActive = pathname === item.href;
                                            const isLocked = (!user && item.href !== '/' && item.href !== '/airdrops') || (item.href === '/endpoints' && user?.role !== 'ULTRA');
                                            if (isLocked) return (
                                                <div key={item.href} className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 cursor-not-allowed">
                                                    <div className="flex items-center gap-3">{item.icon}{item.name}</div>
                                                    <svg className="w-3.5 h-3.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                                </div>
                                            );
                                            return (
                                                <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}
                                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${isActive ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}>
                                                    {item.icon}{item.name}
                                                    {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                })()}
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-white/5 space-y-1">
                {/* Settings - PRO/ULTRA only */}
                {(user?.role === 'PRO' || user?.role === 'ULTRA') && (
                    <Link
                        href="/settings"
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${pathname === '/settings'
                            ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                            : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                            }`}
                    >
                        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Settings
                    </Link>
                )}

                {/* User card / Sign In */}
                {!user ? (
                    <Link
                        href="/login"
                        className="flex items-center justify-center gap-2 w-full p-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl transition-all font-semibold text-sm shadow-lg shadow-blue-700/25 active:scale-95 border border-white/10"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                        Sign In
                    </Link>
                ) : (
                    <div className="flex items-center gap-3 p-2.5 bg-white/4 rounded-xl border border-white/8">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${ROLE_COLORS[user.role] || ROLE_COLORS.MEMBER} flex items-center justify-center text-xs font-black text-white shadow-sm shrink-0`}>
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-white truncate">{user.name || 'User'}</div>
                            <span className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${ROLE_BADGE[user.role] || ROLE_BADGE.MEMBER}`}>
                                {user.role || 'MEMBER'}
                            </span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Sign Out"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );

    return (
        <>
            {/* Mobile Top Bar */}
            <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-14">
                {/* Glass background */}
                <div className="absolute inset-0 bg-[#080d1a]/80 backdrop-blur-xl" />
                {/* Gradient bottom border */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

                <div className="relative flex items-center justify-between h-full px-4">
                    {/* Hamburger + Brand */}
                    <div className="flex items-center gap-2.5">
                        <button
                            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-white/8 transition-all active:scale-95"
                            onClick={() => setIsOpen(!isOpen)}
                        >
                            {isOpen ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                            )}
                        </button>
                        <span className="text-sm font-black text-white tracking-tight">Devora</span>
                    </div>

                    {/* Right — user avatar */}
                    {user ? (
                        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${ROLE_COLORS[user.role] || ROLE_COLORS.MEMBER} flex items-center justify-center text-xs font-black text-white shadow-sm`}>
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                    ) : (
                        <div className="w-8 h-8" />
                    )}
                </div>
            </header>

            {/* Mobile Overlay */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsOpen(false)} />
            )}

            {/* Sidebar */}
            <div className={`fixed left-0 top-0 h-full z-50 transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <SidebarContent />
            </div>
        </>
    );
}
