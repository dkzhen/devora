'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
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
                {
                    name: 'Chatbot',
                    href: '/chatbot',
                    icon: (
                        <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" color="currentColor">
                                <path d="M11 8h2c2.828 0 4.243 0 5.121.879C19 9.757 19 11.172 19 14s0 4.243-.879 5.121C17.243 20 15.828 20 13 20h-1s-.5 2-4 2c0 0 1-1.009 1-2.017c-1.553-.047-2.48-.22-3.121-.862C5 18.243 5 16.828 5 14s0-4.243.879-5.121C6.757 8 8.172 8 11 8m8 3.5h.5c.935 0 1.402 0 1.75.201a1.5 1.5 0 0 1 .549.549c.201.348.201.815.201 1.75s0 1.402-.201 1.75a1.5 1.5 0 0 1-.549.549c-.348.201-.815.201-1.75.201H19m-14-5h-.5c-.935 0-1.402 0-1.75.201a1.5 1.5 0 0 0-.549.549C2 12.598 2 13.065 2 14s0 1.402.201 1.75a1.5 1.5 0 0 0 .549.549c.348.201.815.201 1.75.201H5m8.5-13a1.5 1.5 0 1 1-3 0a1.5 1.5 0 0 1 3 0M12 5v3m-3 4v1m6-1v1" />
                                <path d="M10 16.5s.667.5 2 .5s2-.5 2-.5" />
                            </g>
                        </svg>
                    )
                },
                {
                    name: 'App Library',
                    href: '/app-library',
                    icon: <svg className="w-4.5 h-4.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14"><path fill="currentColor" fillRule="evenodd" d="M.352 1.305c0-.025.001-.05.003-.073l5.63 5.629l-5.63 5.63a.917.917 0 0 1-.003-.073zM1.61 13.357c.1-.019.2-.053.298-.102l6.943-3.527l-1.806-1.806zm6.496-6.496l2.152 2.152l2.586-1.314c.719-.365.719-1.31 0-1.675L10.257 4.71zm.745-2.866L1.908.468A1.122 1.122 0 0 0 1.61.366L7.045 5.8z" clipRule="evenodd" /></svg>
                },
                {
                    name: 'HTTP Client',
                    href: '/http-client',
                    icon: <svg className="w-4.5 h-4.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 306" fill="currentColor"><path d="M256 66.28C255.732 29.408 224.974 0 188.102 0H67.96C31.366 0 .719 28.947.01 65.553a66.896 66.896 0 0 0 66.85 68.097h53.676a3.894 3.894 0 0 1 1.552 7.412L39.803 177.13C15.463 187.92-.163 212.112.011 238.736c.279 36.878 31.017 66.312 67.902 66.312H96.07c37.144 0 68.07-29.79 68.012-66.935c-.076-27.213-16.624-51.67-41.856-61.86a3.855 3.855 0 0 1-.065-7.1l94.11-41.266c24.316-10.808 39.916-34.998 39.73-61.607Z" /></svg>
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
                    icon: <svg className="w-4.5 h-4.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14"><path fill="currentColor" fillRule="evenodd" d="m1.25 6.164l2.393 1.533v3.687H1.535a.284.284 0 0 1-.285-.282zm2.518-4.409C2.143.715 0 1.875 0 3.808v7.294c0 .849.69 1.533 1.535 1.533h2.733c.345 0 .625-.28.625-.625V8.498l1.77 1.134a.63.63 0 0 0 .674 0l1.77-1.134v3.511c0 .346.28.625.625.625h2.733c.846 0 1.536-.684 1.536-1.532V3.808c0-1.433-1.178-2.441-2.45-2.443a2.44 2.44 0 0 0-1.32.39l-.836.536l-.012.009L7 3.826L4.605 2.29zm5.34 2.205l-1.77 1.134a.63.63 0 0 1-.675 0L4.893 3.96v3.053L7 8.363l2.107-1.35zm1.25 3.737l2.393-1.533v4.938a.284.284 0 0 1-.286.283h-2.108z" clipRule="evenodd" /></svg>
                },
                {
                    name: 'Drive Center',
                    href: '/drive-center',
                    icon: <svg className="w-4.5 h-4.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 464 408"><path fill="currentColor" d="m140 35l73 128L73 408L0 280zm43 245h280l-73 128H110zm268-21H305L158 3h146z" /></svg>
                },

            ]
        },
        {
            label: 'System',
            items: [
                {
                    name: 'Users',
                    href: '/users',
                    icon: <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                },
                {
                    name: 'Endpoints',
                    href: '/endpoints',
                    icon: <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                },
                {
                    name: 'Maintenance',
                    href: '/maintenance-control',
                    icon: <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                },
                {
                    name: 'Config',
                    href: '/config',
                    icon: <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                },
            ]
        },
    ];

    if (pathname === '/login') return null;
    if (!mounted) return <SidebarSkeleton />;

    const SidebarContent = () => (
        <aside className="h-full w-64 bg-[#0a0f1e] border-r border-white/5 flex flex-col">
            {/* Logo */}
            <div className="px-5 py-5  flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 overflow-hidden relative">
                    <img src="/icons/devora-icon.png" alt="Devora" className="w-full h-full object-cover" />
                </div>
                <span className="text-xl font-passero text-white tracking-wide mt-1">Devora</span>
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
                                            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                                            const isLocked = (!user && item.href !== '/' && item.href !== '/airdrops' && item.href !== '/app-library') || ((item.href === '/endpoints' || item.href === '/users' || item.href === '/maintenance-control' || item.href === '/config') && user?.role !== 'ULTRA') || (item.href === '/drive-center' && user?.role !== 'PRO' && user?.role !== 'ULTRA');
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
                                            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                                            const isLocked = (!user && item.href !== '/' && item.href !== '/airdrops' && item.href !== '/app-library') || ((item.href === '/endpoints' || item.href === '/users' || item.href === '/maintenance-control' || item.href === '/config') && user?.role !== 'ULTRA') || (item.href === '/drive-center' && user?.role !== 'PRO' && user?.role !== 'ULTRA');
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

                        <span className="text-xl font-passero text-white tracking-wide mt-1">Devora</span>
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
