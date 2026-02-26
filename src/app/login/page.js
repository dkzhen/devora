'use client';

import { useState } from 'react';

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Login failed');
            if (data.token) {
                localStorage.setItem('auth_token', data.token);
                localStorage.setItem('user_info', JSON.stringify(data.user));
            }
            window.location.href = '/';
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex bg-[#080d1a] overflow-auto">
            {/* Background orbs */}
            <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-600/8 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-indigo-600/8 blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-900/5 blur-3xl pointer-events-none" />

            {/* Subtle grid */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            {/* Left panel — form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 relative z-10">
                <div className="w-full max-w-sm space-y-8">

                    {/* Logo + heading */}
                    <div>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-blue-500/30">
                                M
                            </div>
                            <span className="text-lg font-black text-white tracking-tight">Devora</span>
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight mb-2">
                            Welcome back
                        </h1>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Sign in to manage your airdrop portfolio and Gmail accounts.
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div className="space-y-3">
                            <input
                                type="email"
                                required
                                placeholder="Email address"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/8 focus:border-blue-500/50 focus:bg-white/8 focus:outline-none focus:ring-1 focus:ring-blue-500/30 text-white placeholder-gray-600 text-sm transition-all"
                            />
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    placeholder="Password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-4 py-3.5 pr-12 rounded-xl bg-white/5 border border-white/8 focus:border-blue-500/50 focus:bg-white/8 focus:outline-none focus:ring-1 focus:ring-blue-500/30 text-white placeholder-gray-600 text-sm transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
                                >
                                    {showPassword ? (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <a href="#" className="text-xs text-gray-600 hover:text-blue-400 transition-colors">Forgot password?</a>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-700/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-white/10"
                        >
                            {loading ? (
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            ) : null}
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>

                        {/* Divider */}
                        <div className="flex items-center gap-4">
                            <div className="h-px bg-white/5 flex-1" />
                            <span className="text-xs text-gray-700">or continue with</span>
                            <div className="h-px bg-white/5 flex-1" />
                        </div>

                        {/* OAuth */}
                        <div className="flex gap-3 justify-center">
                            <a disabled href="/auth/google" className="flex-1 h-12 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center hover:bg-white/8 hover:border-white/15 transition-all">
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                                    <path d="M23.766 12.2764C23.766 11.4607 23.6999 10.6406 23.5588 9.83807H12.24V14.4591H18.7217C18.4528 15.9494 17.5885 17.2678 16.323 18.1056V21.1039H20.19C22.4608 19.0139 23.766 15.9274 23.766 12.2764Z" fill="#4285F4" />
                                    <path d="M12.24 24.0008C15.4766 24.0008 18.2059 22.9382 20.1945 21.1039L16.3275 18.1055C15.2517 18.8375 13.8627 19.252 12.2445 19.252C9.11388 19.252 6.45946 17.1399 5.50705 14.3003H1.5166V17.3912C3.55371 21.4434 7.7029 24.0008 12.24 24.0008Z" fill="#34A853" />
                                    <path d="M5.50253 14.3003C5.00236 12.8099 5.00236 11.1961 5.50253 9.70575V6.61481H1.51649C-0.185514 10.0056 -0.185514 14.0004 1.51649 17.3912L5.50253 14.3003Z" fill="#FBBC05" />
                                    <path d="M12.24 4.74966C13.9509 4.7232 15.6044 5.36697 16.8434 6.54867L20.2695 3.12262C18.1001 1.0855 15.2208 -0.034466 12.24 0.000808666C7.7029 0.000808666 3.55371 2.55822 1.5166 6.61481L5.50264 9.70575C6.45064 6.86173 9.10947 4.74966 12.24 4.74966Z" fill="#EA4335" />
                                </svg>
                            </a>
                            <button disabled type="button" className="flex-1 h-12 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center hover:bg-white/8 hover:border-white/15 transition-all">
                                <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                            </button>
                            <button disabled type="button" className="flex-1 h-12 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center hover:bg-white/8 hover:border-white/15 transition-all">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.1 1.88-2.61 5.79 1.07 7.22-.67 1.72-1.6 3.42-3.12 3.99zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.54 4.33-3.74 4.25z" /></svg>
                            </button>
                        </div>
                    </form>

                    <p className="text-center text-sm text-gray-600">
                        Not a member?{' '}
                        <a href="#" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">Register now</a>
                    </p>
                </div>
            </div>

            {/* Right panel — dark space visual */}
            <div className="hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center">
                {/* Dark gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0d1b3e] via-[#0a0f1e] to-[#080d1a]" />

                {/* Glowing orbs */}
                <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />
                <div className="absolute bottom-1/4 left-1/4 w-48 h-48 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />

                {/* Grid */}
                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

                {/* Separator line */}
                <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-blue-500/20 to-transparent" />

                {/* Content */}
                <div className="relative z-10 px-12 w-full max-w-sm">
                    {/* Heading */}
                    <div className="mb-8 text-center">
                        <h2 className="text-2xl font-black text-white tracking-tight mb-2">
                            Track Every<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Opportunity</span>
                        </h2>
                        <p className="text-gray-600 text-xs">Airdrop hunting, email monitoring & API analytics in one place</p>
                    </div>

                    {/* Staggered 3 cards */}
                    <div className="space-y-3 mb-5">
                        {/* Card 1 — Airdrop Tasks */}
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/3 border border-white/8 backdrop-blur-sm">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[10px] text-gray-600 uppercase tracking-widest font-bold mb-0.5">Airdrop Tasks</div>
                                <div className="text-2xl font-black text-white leading-none">392</div>
                                <div className="mt-2 h-1 rounded-full bg-white/5">
                                    <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-400" />
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <div className="text-xs text-emerald-400 font-bold">↑ 12%</div>
                                <div className="text-[10px] text-gray-600">completed</div>
                            </div>
                        </div>

                        {/* Card 2 — Inbox Volume (translate right) */}
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/3 border border-white/8 backdrop-blur-sm translate-x-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[10px] text-gray-600 uppercase tracking-widest font-bold mb-0.5">Inbox Volume</div>
                                <div className="text-2xl font-black text-white leading-none">31K</div>
                                <div className="text-[10px] text-gray-500 mt-1">24.8K msgs · 6.2K threads</div>
                            </div>
                            <div className="text-right shrink-0">
                                <div className="text-xs text-indigo-400 font-bold">↑ 8%</div>
                                <div className="text-[10px] text-gray-600">this week</div>
                            </div>
                        </div>

                        {/* Card 3 — Request Flow (translate right less) */}
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/3 border border-white/8 backdrop-blur-sm translate-x-2">
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[10px] text-gray-600 uppercase tracking-widest font-bold mb-0.5">Request Flow</div>
                                <div className="text-2xl font-black text-white leading-none">189K</div>
                                <div className="text-[10px] text-emerald-500 mt-1 font-semibold">● Live · avg 2.1ms</div>
                            </div>
                            <div className="text-right shrink-0">
                                <div className="text-xs text-cyan-400 font-bold">↑ 23%</div>
                                <div className="text-[10px] text-gray-600">API calls</div>
                            </div>
                        </div>
                    </div>

                    {/* Activity bar chart */}
                    <div className="p-3 rounded-2xl bg-white/3 border border-white/8 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">Activity</span>
                            <span className="text-[10px] text-blue-400 font-semibold">Last 7 days</span>
                        </div>
                        <div className="flex items-end gap-1.5 h-10">
                            {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                                <div key={i} className="flex-1 flex flex-col justify-end">
                                    <div
                                        className="rounded-sm w-full"
                                        style={{
                                            height: `${h}%`,
                                            background: i === 5 ? 'linear-gradient(to top, #3b82f6, #818cf8)' : 'rgba(255,255,255,0.08)'
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
