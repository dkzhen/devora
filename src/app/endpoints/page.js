'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EndpointsPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const storedUser = localStorage.getItem('user_info');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                if (parsedUser.role !== 'ULTRA') {
                    router.push('/');
                    return;
                }
                setUser(parsedUser);
                setLoading(false);
            } catch (e) {
                console.error(e);
            }
        } else {
            fetch('/api/auth/me')
                .then(res => res.json())
                .then(data => {
                    if (data.user) {
                        if (data.user.role !== 'ULTRA') {
                            router.push('/');
                        } else {
                            setUser(data.user);
                            setLoading(false);
                        }
                    } else {
                        router.push('/login');
                    }
                })
                .catch(() => router.push('/login'));
        }
    }, [router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    const endpoints = [
        { method: 'GET', path: '/api/v1/airdrops', desc: 'Retrieve all airdrops data', status: 'Active' },
        { method: 'POST', path: '/api/v1/airdrops', desc: 'Create a new airdrop entry', status: 'Active' },
        { method: 'GET', path: '/api/v1/users/stats', desc: 'Get current user statistics', status: 'Beta' },
        { method: 'DELETE', path: '/api/v1/projects/:id', desc: 'Remove an existing project', status: 'Active' },
    ];

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-[#1a0b2e] to-gray-900" />
                <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-16 -left-8 w-56 h-56 rounded-full bg-pink-500/10 blur-3xl pointer-events-none" />
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.2) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

                <div className="relative z-10 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
                            <span className="text-white">API </span>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400">Endpoints</span>
                        </h1>
                        <p className="text-gray-400 text-sm max-w-xl">
                            Exclusive access to developer endpoints. Integrate Devora's data directly into your own applications with our REST API.
                        </p>
                    </div>
                    <div className="shrink-0">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                            Ultra Exclusive
                        </span>
                    </div>
                </div>
            </div>

            {/* API Key Section */}
            <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/20 rounded-2xl p-6 shadow-lg shadow-purple-900/5">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0 border border-purple-500/30">
                        <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-white font-bold mb-1">Your Personal API Key</h3>
                        <p className="text-xs text-purple-200/60 mb-3 md:mb-0">Include this key in the Authorization header of your requests to authenticate.</p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex-1 md:w-64 relative bg-black/40 border border-purple-500/30 rounded-lg overflow-hidden flex items-center">
                            <input
                                type="password"
                                value="ultra_live_sk_8f92j2k1l9m2n8b7v6c5x4z"
                                readOnly
                                className="w-full bg-transparent px-3 py-2.5 text-xs text-purple-300 font-mono outline-none"
                            />
                        </div>
                        <button className="px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-purple-500/25 active:scale-95 shrink-0">
                            Copy Key
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="bg-[#0f172a]/80 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
                <div className="p-6 border-b border-white/5">
                    <h2 className="text-lg font-bold text-white">Available Endpoints</h2>
                </div>

                <div className="p-6 space-y-3">
                    {endpoints.map((ep, idx) => (
                        <div key={idx} className="group bg-white/5 border border-white/5 hover:border-purple-500/30 hover:bg-white/10 rounded-xl p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-1.5">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ep.method === 'GET' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                            ep.method === 'POST' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                                'bg-red-500/10 text-red-400 border border-red-500/20'
                                        }`}>
                                        {ep.method}
                                    </span>
                                    <code className="text-sm font-mono text-gray-200">{ep.path}</code>
                                    {ep.status === 'Beta' && (
                                        <span className="px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 text-[9px] font-bold border border-yellow-500/20">BETA</span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500">{ep.desc}</p>
                            </div>

                            <button className="shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-black/20 hover:bg-black/40 text-gray-300 rounded-lg text-xs font-semibold transition-colors border border-white/5 group-hover:border-purple-500/30 group-hover:text-purple-300">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                Copy ID
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
