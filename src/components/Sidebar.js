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
    const [maintenanceConfigs, setMaintenanceConfigs] = useState([]);
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
        const fetchMaintenance = async () => {
            try {
                const res = await fetch('/api/maintenance', { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    setMaintenanceConfigs(data);
                }
            } catch { }
        };

        fetchUser();
        fetchMaintenance();
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
                {
                    name: 'Temp Mail',
                    href: '/temp-mail',
                    icon: <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M11.5947 19H6.2C5.07989 19 4.51984 19 4.09202 18.782C3.71569 18.5903 3.40973 18.2843 3.21799 17.908C3 17.4802 3 16.9201 3 15.8V8.2C3 7.0799 3 6.51984 3.21799 6.09202C3.40973 5.71569 3.71569 5.40973 4.09202 5.21799C4.51984 5 5.0799 5 6.2 5H17.8C18.9201 5 19.4802 5 19.908 5.21799C20.2843 5.40973 20.5903 5.71569 20.782 6.09202C21 6.51984 21 7.0799 21 8.2V12M20.6067 8.26229L15.5499 11.6335C14.2669 12.4888 13.6254 12.9165 12.932 13.0827C12.3192 13.2295 11.6804 13.2295 11.0677 13.0827C10.3743 12.9165 9.73279 12.4888 8.44975 11.6335L3.14746 8.09863M18 13.5L19.4107 15.5584L21.8042 16.2639L20.2825 18.2416L20.3511 20.7361L18 19.9L15.6489 20.7361L15.7175 18.2416L14.1958 16.2639L16.5893 15.5584L18 13.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path> </g></svg>
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
                {
                    name: 'Telegram Console',
                    href: '/telegram-console',
                    icon: <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M23.1117 4.49449C23.4296 2.94472 21.9074 1.65683 20.4317 2.227L2.3425 9.21601C0.694517 9.85273 0.621087 12.1572 2.22518 12.8975L6.1645 14.7157L8.03849 21.2746C8.13583 21.6153 8.40618 21.8791 8.74917 21.968C9.09216 22.0568 9.45658 21.9576 9.70712 21.707L12.5938 18.8203L16.6375 21.8531C17.8113 22.7334 19.5019 22.0922 19.7967 20.6549L23.1117 4.49449ZM3.0633 11.0816L21.1525 4.0926L17.8375 20.2531L13.1 16.6999C12.7019 16.4013 12.1448 16.4409 11.7929 16.7928L10.5565 18.0292L10.928 15.9861L18.2071 8.70703C18.5614 8.35278 18.5988 7.79106 18.2947 7.39293C17.9906 6.99479 17.4389 6.88312 17.0039 7.13168L6.95124 12.876L3.0633 11.0816ZM8.17695 14.4791L8.78333 16.6015L9.01614 15.321C9.05253 15.1209 9.14908 14.9366 9.29291 14.7928L11.5128 12.573L8.17695 14.4791Z" fill="currentColor"></path> </g></svg>
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
                    icon: <svg className="w-4.5 h-4.5" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="none"><path fill="currentColor" fillRule="evenodd" d="M.5 2.75a2.25 2.25 0 114.28.97l1.345 1.344.284-.284a2.25 2.25 0 013.182 0l.284.284 1.344-1.344a2.25 2.25 0 111.06 1.06l-1.343 1.345.284.284a2.25 2.25 0 010 3.182l-.284-.284 1.344 1.344a2.25 2.25 0 11-1.06 1.06l-1.345-1.343-.284.284a2.25 2.25 0 01-3.182 0l-.284-.284-1.344 1.344a2.25 2.25 0 11-1.06-1.06l1.343-1.345-.284-.284a2.25 2.25 0 010-3.182l.284-.284L3.72 4.781A2.25 2.25 0 01.5 2.75zM2.75 2a.75.75 0 100 1.5.75.75 0 000-1.5zm0 10.5a.75.75 0 100 1.5.75.75 0 000-1.5zm9.75.75a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM13.25 2a.75.75 0 100 1.5.75.75 0 000-1.5zM7.47 5.841a.75.75 0 011.06 0L10.16 7.47a.75.75 0 010 1.06L8.53 10.16a.75.75 0 01-1.06 0L5.84 8.53a.75.75 0 010-1.06L7.47 5.84z" clipRule="evenodd"></path></svg>
                },
                {
                    name: 'Maintenance',
                    href: '/maintenance-control',
                    icon: <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 427.323 427.323"><g><path d="M373.679,263.601c-55.111-51.291-110.833-105.896-169.762-152.797c13.082-57.855-31.26-127.056-99.707-107.389 c-6.248,1.796-9.031,6.674-9.226,11.737c-4.207,4.381-6.28,10.681-2.629,16.393c10.553,16.512,30.867,30.324,48.187,43.168 c-3.764,3.399-7.563,6.757-11.313,10.166c-3.824,3.475-7.651,6.948-11.472,10.425l-5.736,5.212 c-3.544,6.439-5.701,7.459-6.471,3.06c-3.453-0.999-15.049-13.271-18.767-16.083c-9.355-7.083-18.722-14.007-28.782-20.06 c-5.179-3.116-10.053-0.204-11.867,4.135c-0.437,0.164-0.991-0.001-1.368,0.275c-27.247,19.989-17.748,73.064,8.066,90.04 c25.301,16.636,66.447,19.65,97.889,8.753c49.894,62.49,108.493,132.423,171.243,181.466c21.402,16.729,56.583,25.425,71.46,2.155 C424.664,326.104,399.42,287.558,373.679,263.601z M378.355,340.455c-6.482,4.772-14.387,5.319-23.046,2.992 c-0.516-1.167-1.349-2.206-2.774-2.742c-10.28-3.879-18.443-22.19-11.628-31.533c6.937-9.519,18.232-6.784,28.09-6.061 c0.887,0.065,1.657-0.354,2.462-0.634C377.606,314.727,380.647,327.457,378.355,340.455z"></path> <path d="M194.213,264.78c2.704-3.6,1.447-9.787-1.641-12.732c-5.827-5.566-11.56-11.116-17.974-16 c-3.641-2.778-7.39-0.988-9.591,2.111c-1.54,0.105-3.037,0.605-4.214,1.555c-12.836,10.371-26.433,23.792-36.952,37.238 c-12.483-4.069-28.285-7.8-29.461,4.113c-29.584,20.679-54.143,48.868-80.85,72.997c-5.43,4.908-3.405,13.507,2.205,17.121 c20.776,13.372,37.269,29.351,50.741,50.08c4.402,6.773,13.527,8.238,19.509,2.512c31.367-30.032,79.601-65.696,66.102-112.561 c0.443-0.311,0.906-0.488,1.333-0.885C168.472,296.382,181.899,281.185,194.213,264.78z"></path> <path d="M412.29,45.041c-13.418-26.02-45.3-21.835-65.29-6.552c-29.043,22.208-63.145,51.65-84.972,80.842 c-1.993,2.667-1.422,5.838,0.138,8.485c-1.217,2.5-1.551,5.418,0.824,8.112c7.808,8.851,16.691,16.71,25.119,24.958 c7.446,7.286,14.103,15.172,25.165,14.478c2.154-0.135,3.871-0.934,5.352-1.981c0.155-0.011,0.287,0.055,0.438,0.038 c32.215-3.517,47.551-37.674,68.79-58.256C406.369,97.221,426.243,72.091,412.29,45.041z"></path> </g></svg>
                },
                {
                    name: 'Config',
                    href: '/config',
                    icon: <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 48 48"><g> <g> <g> <path d="M24,48v-8c-8.836,0-16-7.164-16-16c0-8.837,7.164-16,16-16V0h-5.021v4.661 c-2.212,0.573-4.284,1.494-6.129,2.735L9.857,4.402l-5.656,5.657l3.042,3.042c-1.163,1.784-2.036,3.766-2.583,5.883H0v10.032h4.66 c0.56,2.164,1.458,4.192,2.66,6.008l-3.118,3.119l5.656,5.655l3.119-3.118c1.819,1.205,3.853,2.104,6.023,2.664V48H24z" /> <path d="M24,29c-2.762,0-5-2.238-5-5c0-2.761,2.238-5,5-5v-4c-4.971,0-9,4.029-9,9c0,4.971,4.029,9,9,9V29z" /> <path d="M36.218,48V37.129C43.188,33.699,48,26.547,48,18.253C48,10.436,43.729,3.629,37.402,0v17.741 l-10.447,9.161V48H36.218z" /> </g> </g> </g></svg>
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
                                            const isLocked = (!user && item.href !== '/' && item.href !== '/airdrops' && item.href !== '/app-library' && item.href !== '/http-client' && item.href !== '/temp-mail') || ((item.href === '/endpoints' || item.href === '/users' || item.href === '/maintenance-control' || item.href === '/config' || item.href === '/telegram-console') && user?.role !== 'ULTRA');
                                            const isMaintenance = maintenanceConfigs.find(c => c.feature === item.href.replace('/', ''))?.enabled;
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
                                                    {isMaintenance ? (
                                                        <svg className="ml-auto w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M12 6.25C12.4142 6.25 12.75 6.58579 12.75 7V13C12.75 13.4142 12.4142 13.75 12 13.75C11.5858 13.75 11.25 13.4142 11.25 13V7C11.25 6.58579 11.5858 6.25 12 6.25Z" fill="#f5c211"></path> <path d="M13 16C13 16.5523 12.5523 17 12 17C11.4477 17 11 16.5523 11 16C11 15.4477 11.4477 15 12 15C12.5523 15 13 15.4477 13 16Z" fill="#f5c211"></path> <path fillRule="evenodd" clipRule="evenodd" d="M12 1.25C11.2954 1.25 10.6519 1.44359 9.94858 1.77037C9.26808 2.08656 8.48039 2.55304 7.49457 3.13685L6.74148 3.58283C5.75533 4.16682 4.96771 4.63324 4.36076 5.07944C3.73315 5.54083 3.25177 6.01311 2.90334 6.63212C2.55548 7.25014 2.39841 7.91095 2.32306 8.69506C2.24999 9.45539 2.24999 10.3865 2.25 11.556V12.444C2.24999 13.6135 2.24999 14.5446 2.32306 15.3049C2.39841 16.0891 2.55548 16.7499 2.90334 17.3679C3.25177 17.9869 3.73315 18.4592 4.36076 18.9206C4.96771 19.3668 5.75533 19.8332 6.74148 20.4172L7.4946 20.8632C8.48038 21.447 9.2681 21.9135 9.94858 22.2296C10.6519 22.5564 11.2954 22.75 12 22.75C12.7046 22.75 13.3481 22.5564 14.0514 22.2296C14.7319 21.9134 15.5196 21.447 16.5054 20.8632L17.2585 20.4172C18.2446 19.8332 19.0323 19.3668 19.6392 18.9206C20.2669 18.4592 20.7482 17.9869 21.0967 17.3679C21.4445 16.7499 21.6016 16.0891 21.6769 15.3049C21.75 14.5446 21.75 13.6135 21.75 12.4441V11.556C21.75 10.3866 21.75 9.45538 21.6769 8.69506C21.6016 7.91095 21.4445 7.25014 21.0967 6.63212C20.7482 6.01311 20.2669 5.54083 19.6392 5.07944C19.0323 4.63324 18.2447 4.16683 17.2585 3.58285L16.5054 3.13685C15.5196 2.55303 14.7319 2.08656 14.0514 1.77037C13.3481 1.44359 12.7046 1.25 12 1.25ZM8.22524 4.44744C9.25238 3.83917 9.97606 3.41161 10.5807 3.13069C11.1702 2.85676 11.5907 2.75 12 2.75C12.4093 2.75 12.8298 2.85676 13.4193 3.13069C14.0239 3.41161 14.7476 3.83917 15.7748 4.44744L16.4609 4.85379C17.4879 5.46197 18.2109 5.89115 18.7508 6.288C19.2767 6.67467 19.581 6.99746 19.7895 7.36788C19.9986 7.73929 20.1199 8.1739 20.1838 8.83855C20.2492 9.51884 20.25 10.378 20.25 11.5937V12.4063C20.25 13.622 20.2492 14.4812 20.1838 15.1614C20.1199 15.8261 19.9986 16.2607 19.7895 16.6321C19.581 17.0025 19.2767 17.3253 18.7508 17.712C18.2109 18.1089 17.4879 18.538 16.4609 19.1462L15.7748 19.5526C14.7476 20.1608 14.0239 20.5884 13.4193 20.8693C12.8298 21.1432 12.4093 21.25 12 21.25C11.5907 21.25 11.1702 21.1432 10.5807 20.8693C9.97606 20.5884 9.25238 20.1608 8.22524 19.5526L7.53909 19.1462C6.5121 18.538 5.78906 18.1089 5.24924 17.712C4.72326 17.3253 4.419 17.0025 4.2105 16.6321C4.00145 16.2607 3.88005 15.8261 3.81618 15.1614C3.7508 14.4812 3.75 13.622 3.75 12.4063V11.5937C3.75 10.378 3.7508 9.51884 3.81618 8.83855C3.88005 8.1739 4.00145 7.73929 4.2105 7.36788C4.419 6.99746 4.72326 6.67467 5.24924 6.288C5.78906 5.89115 6.5121 5.46197 7.53909 4.85379L8.22524 4.44744Z" fill="#f5c211"></path> </g></svg>
                                                    ) : isActive && (
                                                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
                                                    )}
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
                                            const isLocked = (!user && item.href !== '/' && item.href !== '/airdrops' && item.href !== '/app-library' && item.href !== '/http-client' && item.href !== '/temp-mail') || ((item.href === '/endpoints' || item.href === '/users' || item.href === '/maintenance-control' || item.href === '/config' || item.href === '/telegram-console') && user?.role !== 'ULTRA');
                                            const isMaintenance = maintenanceConfigs.find(c => c.feature === item.href.replace('/', ''))?.enabled;

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
                                                    {isMaintenance ? (
                                                        <svg className="ml-auto w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M12 6.25C12.4142 6.25 12.75 6.58579 12.75 7V13C12.75 13.4142 12.4142 13.75 12 13.75C11.5858 13.75 11.25 13.4142 11.25 13V7C11.25 6.58579 11.5858 6.25 12 6.25Z" fill="#f5c211"></path> <path d="M13 16C13 16.5523 12.5523 17 12 17C11.4477 17 11 16.5523 11 16C11 15.4477 11.4477 15 12 15C12.5523 15 13 15.4477 13 16Z" fill="#f5c211"></path> <path fillRule="evenodd" clipRule="evenodd" d="M12 1.25C11.2954 1.25 10.6519 1.44359 9.94858 1.77037C9.26808 2.08656 8.48039 2.55304 7.49457 3.13685L6.74148 3.58283C5.75533 4.16682 4.96771 4.63324 4.36076 5.07944C3.73315 5.54083 3.25177 6.01311 2.90334 6.63212C2.55548 7.25014 2.39841 7.91095 2.32306 8.69506C2.24999 9.45539 2.24999 10.3865 2.25 11.556V12.444C2.24999 13.6135 2.24999 14.5446 2.32306 15.3049C2.39841 16.0891 2.55548 16.7499 2.90334 17.3679C3.25177 17.9869 3.73315 18.4592 4.36076 18.9206C4.96771 19.3668 5.75533 19.8332 6.74148 20.4172L7.4946 20.8632C8.48038 21.447 9.2681 21.9135 9.94858 22.2296C10.6519 22.5564 11.2954 22.75 12 22.75C12.7046 22.75 13.3481 22.5564 14.0514 22.2296C14.7319 21.9134 15.5196 21.447 16.5054 20.8632L17.2585 20.4172C18.2446 19.8332 19.0323 19.3668 19.6392 18.9206C20.2669 18.4592 20.7482 17.9869 21.0967 17.3679C21.4445 16.7499 21.6016 16.0891 21.6769 15.3049C21.75 14.5446 21.75 13.6135 21.75 12.4441V11.556C21.75 10.3866 21.75 9.45538 21.6769 8.69506C21.6016 7.91095 21.4445 7.25014 21.0967 6.63212C20.7482 6.01311 20.2669 5.54083 19.6392 5.07944C19.0323 4.63324 18.2447 4.16683 17.2585 3.58285L16.5054 3.13685C15.5196 2.55303 14.7319 2.08656 14.0514 1.77037C13.3481 1.44359 12.7046 1.25 12 1.25ZM8.22524 4.44744C9.25238 3.83917 9.97606 3.41161 10.5807 3.13069C11.1702 2.85676 11.5907 2.75 12 2.75C12.4093 2.75 12.8298 2.85676 13.4193 3.13069C14.0239 3.41161 14.7476 3.83917 15.7748 4.44744L16.4609 4.85379C17.4879 5.46197 18.2109 5.89115 18.7508 6.288C19.2767 6.67467 19.581 6.99746 19.7895 7.36788C19.9986 7.73929 20.1199 8.1739 20.1838 8.83855C20.2492 9.51884 20.25 10.378 20.25 11.5937V12.4063C20.25 13.622 20.2492 14.4812 20.1838 15.1614C20.1199 15.8261 19.9986 16.2607 19.7895 16.6321C19.581 17.0025 19.2767 17.3253 18.7508 17.712C18.2109 18.1089 17.4879 18.538 16.4609 19.1462L15.7748 19.5526C14.7476 20.1608 14.0239 20.5884 13.4193 20.8693C12.8298 21.1432 12.4093 21.25 12 21.25C11.5907 21.25 11.1702 21.1432 10.5807 20.8693C9.97606 20.5884 9.25238 20.1608 8.22524 19.5526L7.53909 19.1462C6.5121 18.538 5.78906 18.1089 5.24924 17.712C4.72326 17.3253 4.419 17.0025 4.2105 16.6321C4.00145 16.2607 3.88005 15.8261 3.81618 15.1614C3.7508 14.4812 3.75 13.622 3.75 12.4063V11.5937C3.75 10.378 3.7508 9.51884 3.81618 8.83855C3.88005 8.1739 4.00145 7.73929 4.2105 7.36788C4.419 6.99746 4.72326 6.67467 5.24924 6.288C5.78906 5.89115 6.5121 5.46197 7.53909 4.85379L8.22524 4.44744Z" fill="#f5c211"></path> </g></svg>
                                                    ) : isActive && (
                                                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
                                                    )}
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
                        className="flex items-center justify-center gap-2 w-full p-2.5 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl transition-all font-semibold text-sm shadow-lg shadow-blue-700/25 active:scale-95 border border-white/10"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                        Sign In
                    </Link>
                ) : (
                    <div className="flex items-center gap-3 p-2.5 bg-white/4 rounded-xl border border-white/8">
                        <div className={`w-8 h-8 rounded-lg bg-linear-to-br ${ROLE_COLORS[user.role] || ROLE_COLORS.MEMBER} flex items-center justify-center text-xs font-black text-white shadow-sm shrink-0`}>
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
                <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-blue-500/30 to-transparent" />

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
                        <div className={`w-8 h-8 rounded-xl bg-linear-to-br ${ROLE_COLORS[user.role] || ROLE_COLORS.MEMBER} flex items-center justify-center text-xs font-black text-white shadow-sm`}>
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
