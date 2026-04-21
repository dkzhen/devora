'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LandingPage() {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState(null);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch('/api/auth/me', { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user);
                }
            } catch (error) {
                console.error('Failed to fetch user', error);
            }
        };

        const fetchPublicStats = async () => {
            try {
                const res = await fetch('/api/monitoring');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error('Failed to fetch stats', error);
            }
        };

        fetchUser();
        fetchPublicStats();
    }, []);

    return (
        <div className="min-h-screen bg-[#0c0e1a]">
            {/* Navbar */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0c0e1a]/95 backdrop-blur-lg border-b border-white/5' : 'bg-transparent'}`}>
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center justify-between h-20">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="w-10 h-10">
                                <img src="/icons/devora-icon-dark.png" alt="Devora" className="w-full h-full object-contain" />
                            </div>
                            <span className="text-2xl font-passero tracking-wider text-white">
                                Devora
                            </span>
                        </Link>

                        <div className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-sm text-slate-400 hover:text-white transition-colors">Features</a>
                            <a href="#how-it-works" className="text-sm text-slate-400 hover:text-white transition-colors">How it Works</a>
                            <Link href="/docs" className="text-sm text-slate-400 hover:text-white transition-colors">Docs</Link>
                        </div>

                        <div className="flex items-center gap-4">
                            <Link
                                href="/dashboard"
                                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg font-medium text-sm transition-all"
                            >
                                Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px]" />
                </div>

                <div className="relative max-w-7xl mx-auto px-6 py-20">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
                            <span className="text-white">One Platform.</span>
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400">
                                Endless Possibilities.
                            </span>
                        </h1>
                        
                        <p className="text-lg md:text-xl text-slate-400 mb-10 leading-relaxed max-w-3xl mx-auto">
                            Unified platform to organize, automate, and manage tools and connected services in one place.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link
                                href="/register"
                                className="group px-7 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg font-semibold text-base transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 flex items-center gap-2"
                            >
                                Get Started Free
                                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </Link>
                            <Link
                                href="/docs"
                                className="px-7 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg font-semibold text-base transition-all border border-white/10"
                            >
                                Documentation
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick API Setup Section */}
            <section className="relative py-12 md:py-20 bg-gradient-to-b from-transparent via-indigo-500/5 to-transparent">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-8 md:mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 md:mb-4">
                            Get Started in Seconds
                        </h2>
                        <p className="text-lg text-slate-400">
                            Create your API key and start making requests instantly.
                        </p>
                    </div>

                    {/* API Setup Steps */}
                    <div className="relative">
                        <div className="bg-[#1a1d2e] rounded-xl md:rounded-2xl border border-white/10 overflow-hidden">
                            {/* Terminal Header */}
                            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 border-b border-white/10 bg-white/5">
                                <div className="flex gap-1.5 sm:gap-2">
                                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500"></div>
                                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></div>
                                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500"></div>
                                </div>
                                <span className="text-[10px] sm:text-xs text-slate-400 ml-2 sm:ml-4 font-mono">API Setup</span>
                            </div>
                            
                            {/* Setup Content */}
                            <div className="p-4 sm:p-6 font-mono text-xs sm:text-sm overflow-x-auto">
                                <div className="mb-3 sm:mb-4">
                                    <div className="text-purple-400 mb-1.5 sm:mb-2 text-xs sm:text-sm"># Step 1: Create API Key</div>
                                    <div className="text-slate-400 ml-2 sm:ml-4 text-[11px] sm:text-sm break-words">Dashboard → Tools → API Key → Create Key</div>
                                </div>
                                
                                <div className="mb-3 sm:mb-4">
                                    <div className="text-purple-400 mb-1.5 sm:mb-2 text-xs sm:text-sm"># Step 2: Make Your First Request</div>
                                    <div className="flex items-start gap-1.5 sm:gap-2 mb-1">
                                        <span className="text-green-400 shrink-0">$</span>
                                        <span className="text-slate-300 text-[11px] sm:text-sm break-all">curl -H "Authorization: Bearer devora_..." \</span>
                                    </div>
                                    <div className="text-slate-300 ml-2 sm:ml-4 text-[11px] sm:text-sm break-all">https://devora.my.id/api/v1/...</div>
                                </div>
                                
                                <div className="text-slate-500 ml-2 sm:ml-4 mt-3 sm:mt-4 space-y-1 text-[11px] sm:text-sm">
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <span className="text-green-400 shrink-0">✓</span>
                                        <span>API key created successfully</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <span className="text-green-400 shrink-0">✓</span>
                                        <span>Ready to make requests</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <span className="text-cyan-400 shrink-0">→</span>
                                        <span>Check <span className="text-indigo-400">/docs</span> for all endpoints</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-6 mt-8 md:mt-12 text-center">
                        <div>
                            <div className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-0.5 sm:mb-1">30 sec</div>
                            <div className="text-[10px] sm:text-xs md:text-sm text-slate-400">Setup Time</div>
                        </div>
                        <div>
                            <div className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-0.5 sm:mb-1">RESTful</div>
                            <div className="text-[10px] sm:text-xs md:text-sm text-slate-400">Easy Integration</div>
                        </div>
                        <div>
                            <div className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-0.5 sm:mb-1">Free</div>
                            <div className="text-[10px] sm:text-xs md:text-sm text-slate-400">Get Started Now</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How it Works Section */}
            <section id="how-it-works" className="relative py-32">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            How it Works
                        </h2>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                            Get started in minutes with our simple three-step process
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="relative p-8 bg-gradient-to-b from-white/5 to-transparent rounded-2xl border border-white/10">
                            <div className="absolute -top-4 left-8 w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                                01
                            </div>
                            <div className="mt-8">
                                <h3 className="text-2xl font-bold text-white mb-4">Register Account</h3>
                                <p className="text-slate-400 leading-relaxed">
                                    Sign up for free in seconds. No credit card required. Get instant access to your dashboard and all features.
                                </p>
                            </div>
                        </div>

                        <div className="relative p-8 bg-gradient-to-b from-white/5 to-transparent rounded-2xl border border-white/10">
                            <div className="absolute -top-4 left-8 w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                                02
                            </div>
                            <div className="mt-8">
                                <h3 className="text-2xl font-bold text-white mb-4">Explore Features</h3>
                                <p className="text-slate-400 leading-relaxed">
                                    Access temp mail, airdrops tracker, LLM console, app library, and more. Use dashboard tools or generate API key for programmatic access.
                                </p>
                            </div>
                        </div>

                        <div className="relative p-8 bg-gradient-to-b from-white/5 to-transparent rounded-2xl border border-white/10">
                            <div className="absolute -top-4 left-8 w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                                03
                            </div>
                            <div className="mt-8">
                                <h3 className="text-2xl font-bold text-white mb-4">Automate & Scale</h3>
                                <p className="text-slate-400 leading-relaxed">
                                    Use web interface for manual tasks or integrate via API for automation. Scale your workflow with powerful tools.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Problem-Solution Section */}
            <section className="relative py-32 border-y border-white/5">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        {/* Problem */}
                        <div>
                            <div className="inline-block px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-sm font-medium mb-6">
                                The Problem
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-6">
                                Developer Tools Scattered Everywhere
                            </h3>
                            <ul className="space-y-4">
                                {[
                                    'Managing temp emails across multiple providers',
                                    'Tracking Web3 airdrops manually on different sites',
                                    'Switching between AI providers for LLM access',
                                    'No centralized place for app distribution',
                                    'Complex API integrations for simple tasks'
                                ].map((problem, i) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-400">
                                        <svg className="w-5 h-5 text-red-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                        {problem}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Solution */}
                        <div>
                            <div className="inline-block px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-sm font-medium mb-6">
                                The Solution
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-6">
                                All Developer Tools in One Place
                            </h3>
                            <ul className="space-y-4">
                                {[
                                    'Unified temp mail with multiple provider support',
                                    'Comprehensive airdrop tracker with real-time updates',
                                    'Multi-LLM console with intelligent routing',
                                    'App library for easy distribution and version control',
                                    'RESTful API for seamless integration'
                                ].map((solution, i) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-300">
                                        <svg className="w-5 h-5 text-green-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        {solution}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="relative py-32 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Powerful Features
                        </h2>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                            Everything you need to streamline your development workflow
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            {
                                title: 'Temp Mail',
                                description: 'Generate temporary email addresses instantly with multiple providers support',
                                icon: <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.5947 19H6.2C5.07989 19 4.51984 19 4.09202 18.782C3.71569 18.5903 3.40973 18.2843 3.21799 17.908C3 17.4802 3 16.9201 3 15.8V8.2C3 7.0799 3 6.51984 3.21799 6.09202C3.40973 5.71569 3.71569 5.40973 4.09202 5.21799C4.51984 5 5.0799 5 6.2 5H17.8C18.9201 5 19.4802 5 19.908 5.21799C20.2843 5.40973 20.5903 5.71569 20.782 6.09202C21 6.51984 21 7.0799 21 8.2V12M20.6067 8.26229L15.5499 11.6335C14.2669 12.4888 13.6254 12.9165 12.932 13.0827C12.3192 13.2295 11.6804 13.2295 11.0677 13.0827C10.3743 12.9165 9.73279 12.4888 8.44975 11.6335L3.14746 8.09863M18 13.5L19.4107 15.5584L21.8042 16.2639L20.2825 18.2416L20.3511 20.7361L18 19.9L15.6489 20.7361L15.7175 18.2416L14.1958 16.2639L16.5893 15.5584L18 13.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>,
                                href: '/temp-mail'
                            },
                            {
                                title: 'Airdrops',
                                description: 'Track and manage Web3 airdrops with real-time updates and analytics',
                                icon: <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 21v-6m0 0l-3 3m3-3l3 3" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5.5 11C5.5 7.41 8.41 4.5 12 4.5S18.5 7.41 18.5 11" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 11a9 9 0 0118 0" /><line strokeLinecap="round" strokeWidth={1.5} x1="12" y1="15" x2="5.5" y2="11" /><line strokeLinecap="round" strokeWidth={1.5} x1="12" y1="15" x2="18.5" y2="11" /></svg>,
                                href: '/airdrops'
                            },
                            {
                                title: 'LLM Console',
                                description: 'Powerful AI console with multiple LLM providers and intelligent routing',
                                icon: <svg className="w-12 h-12" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M45.6,18.7,41,14.9V7.5a1,1,0,0,0-.6-.9L30.5,2.1h-.4l-.6.2L24,5.9,18.5,2.2,17.9,2h-.4L7.6,6.6a1,1,0,0,0-.6.9v7.4L2.4,18.7a.8.8,0,0,0-.4.8v9H2a.8.8,0,0,0,.4.8L7,33.1v7.4a1,1,0,0,0,.6.9l9.9,4.5h.4l.6-.2L24,42.1l5.5,3.7.6.2h.4l9.9-4.5a1,1,0,0,0,.6-.9V33.1l4.6-3.8a.8.8,0,0,0,.4-.7V19.4h0A.8.8,0,0,0,45.6,18.7Zm-5.1,6.8H42v1.6l-3.5,2.8-.4.3-.4-.2a1.4,1.4,0,0,0-2,.7,1.5,1.5,0,0,0,.6,2l.7.3h0v5.4l-6.6,3.1-4.2-2.8-.7-.5V25.5H27a1.5,1.5,0,0,0,0-3H25.5V9.7l.7-.5,4.2-2.8L37,9.5v5.4h0l-.7.3a1.5,1.5,0,0,0-.6,2,1.4,1.4,0,0,0,1.3.9l.7-.2.4-.2.4.3L42,20.9v1.6H40.5a1.5,1.5,0,0,0,0,3ZM21,25.5h1.5V38.3l-.7.5-4.2,2.8L11,38.5V33.1h0l.7-.3a1.5,1.5,0,0,0,.6-2,1.4,1.4,0,0,0-2-.7l-.4.2-.4-.3L6,27.1V25.5H7.5a1.5,1.5,0,0,0,0-3H6V20.9l3.5-2.8.4-.3.4.2.7.2a1.4,1.4,0,0,0,1.3-.9,1.5,1.5,0,0,0-.6-2L11,15h0V9.5l6.6-3.1,4.2,2.8.7.5V22.5H21a1.5,1.5,0,0,0,0,3Z" /></svg>,
                                href: '/llm-console'
                            },
                            {
                                title: 'App Library',
                                description: 'Manage and distribute your Android applications with version control',
                                icon: <svg className="w-12 h-12" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14"><path fill="currentColor" fillRule="evenodd" d="M.352 1.305c0-.025.001-.05.003-.073l5.63 5.629l-5.63 5.63a.917.917 0 0 1-.003-.073zM1.61 13.357c.1-.019.2-.053.298-.102l6.943-3.527l-1.806-1.806zm6.496-6.496l2.152 2.152l2.586-1.314c.719-.365.719-1.31 0-1.675L10.257 4.71zm.745-2.866L1.908.468A1.122 1.122 0 0 0 1.61.366L7.045 5.8z" clipRule="evenodd" /></svg>,
                                href: '/app-library'
                            },
                            {
                                title: 'Gmail Center',
                                description: 'Integrated Gmail management with automation capabilities and monitoring',
                                icon: <svg className="w-12 h-12" viewBox="0 0 24 24" fill="currentColor"><path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" /></svg>,
                                href: '/gmail-center'
                            },
                            {
                                title: 'HTTP Client',
                                description: 'Advanced HTTP client for API testing and development workflows',
                                icon: <svg className="w-12 h-12" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 306" fill="currentColor"><path d="M256 66.28C255.732 29.408 224.974 0 188.102 0H67.96C31.366 0 .719 28.947.01 65.553a66.896 66.896 0 0 0 66.85 68.097h53.676a3.894 3.894 0 0 1 1.552 7.412L39.803 177.13C15.463 187.92-.163 212.112.011 238.736c.279 36.878 31.017 66.312 67.902 66.312H96.07c37.144 0 68.07-29.79 68.012-66.935c-.076-27.213-16.624-51.67-41.856-61.86a3.855 3.855 0 0 1-.065-7.1l94.11-41.266c24.316-10.808 39.916-34.998 39.73-61.607Z" /></svg>,
                                href: '/http-client'
                            }
                        ].map((feature, index) => (
                            <Link
                                key={index}
                                href={feature.href}
                                className="group p-8 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 hover:border-white/20 transition-all"
                            >
                                <div className="text-indigo-400 mb-4">{feature.icon}</div>
                                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-indigo-300 transition-colors">
                                    {feature.title}
                                </h3>
                                <p className="text-slate-400 leading-relaxed mb-4">
                                    {feature.description}
                                </p>
                                <div className="flex items-center text-indigo-400 text-sm font-medium">
                                    Learn more
                                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="relative py-32 bg-gradient-to-b from-transparent via-indigo-500/5 to-transparent">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Simple, Transparent Pricing
                        </h2>
                        <p className="text-lg text-slate-400">
                            Start free, upgrade when you need more
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {/* Free Tier - POPULAR */}
                        <div className="relative p-8 bg-[#1a1d2e] backdrop-blur-xl rounded-2xl border border-purple-500/50">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full text-white text-sm font-bold">
                                POPULAR
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
                            <div className="text-4xl font-bold text-white mb-6">
                                $0<span className="text-lg text-slate-400">/month</span>
                            </div>
                            <ul className="space-y-3 mb-8">
                                {[
                                    'API access',
                                    'Generate private API key',
                                    'Unlimited temp mail',
                                    'Custom OAuth credentials',
                                    'Dashboard access'
                                ].map((feature, i) => (
                                    <li key={i} className="flex items-center gap-2 text-slate-300">
                                        <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <Link
                                href="/login"
                                className="block w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg font-semibold text-center transition-all"
                            >
                                Get Started
                            </Link>
                        </div>

                        {/* Pro Tier - Coming Soon */}
                        <div className="relative p-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 opacity-60">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-slate-600 rounded-full text-white text-sm font-bold">
                                COMING SOON
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                            <div className="text-4xl font-bold text-white mb-6">
                                $9<span className="text-lg text-slate-400">/month</span>
                            </div>
                            <ul className="space-y-3 mb-8">
                                {[
                                    '10,000 API requests/day',
                                    'Unlimited services',
                                    'Advanced automation',
                                    'Priority support',
                                    'Custom integrations',
                                    'Analytics & insights'
                                ].map((feature, i) => (
                                    <li key={i} className="flex items-center gap-2 text-slate-400">
                                        <svg className="w-5 h-5 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <div className="block w-full px-6 py-3 bg-white/5 text-slate-400 rounded-lg font-semibold text-center border border-white/10 cursor-not-allowed">
                                Coming Soon
                            </div>
                        </div>

                        {/* Ultra Tier - Coming Soon */}
                        <div className="relative p-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 opacity-60">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-slate-600 rounded-full text-white text-sm font-bold">
                                COMING SOON
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Ultra</h3>
                            <div className="text-4xl font-bold text-white mb-6">
                                $29<span className="text-lg text-slate-400">/month</span>
                            </div>
                            <ul className="space-y-3 mb-8">
                                {[
                                    'Unlimited API requests',
                                    'Everything in Pro',
                                    'White-label options',
                                    'Dedicated support',
                                    'Custom development',
                                    'SLA guarantee'
                                ].map((feature, i) => (
                                    <li key={i} className="flex items-center gap-2 text-slate-400">
                                        <svg className="w-5 h-5 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <div className="block w-full px-6 py-3 bg-white/5 text-slate-400 rounded-lg font-semibold text-center border border-white/10 cursor-not-allowed">
                                Coming Soon
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative py-32">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/10 to-transparent pointer-events-none" />
                <div className="relative max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                        Ready to Get Started?
                    </h2>
                    <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto">
                        Join developers who trust Devora for their automation needs. Start building today.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/register"
                            className="group px-7 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg font-semibold text-base transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 flex items-center justify-center gap-2"
                        >
                            Create Free Account
                            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>
                        <Link
                            href="/login"
                            className="px-7 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg font-semibold text-base transition-all border border-white/10"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative py-12 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8">
                                <img src="/icons/devora-icon-dark.png" alt="Devora" className="w-full h-full object-contain" />
                            </div>
                            <span className="text-xl font-passero tracking-wider text-white">
                                Devora
                            </span>
                        </div>
                        
                        <div className="flex gap-8">
                            <Link href="/docs" className="text-sm text-slate-400 hover:text-white transition-colors">
                                Documentation
                            </Link>
                            <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors">
                                Dashboard
                            </Link>
                            <Link href="/docs/what-is-devora" className="text-sm text-slate-400 hover:text-white transition-colors">
                                About
                            </Link>
                        </div>
                    </div>
                    
                    <div className="mt-8 pt-8 border-t border-white/5 text-center text-sm text-slate-500">
                        © 2026 Devora. Built with passion by{' '}
                        <Link href="/docs/what-is-devora" className="text-indigo-400 hover:text-purple-400 transition-colors font-medium">
                            Zhen
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
