'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HeroHeader, LoadingState } from '@/components/HeroHeader';
import LoadingImage from '@/components/LoadingImage';
import Link from 'next/link';

const PROJECT_LIST = [
    {
        slug: 'nara-agent',
        name: 'Nara Agent',
        logo: 'https://nara.build/favicon-v3.svg',
        description: 'Advanced AI-powered agent for real-time Web3 ecosystem monitoring, risk analysis, and automated interaction protocols. One skill, everything on-chain.',
        category: 'AI Agent',
        isFeatured: true
    }
];

export default function Web3ProjectsPage() {
    const [search, setSearch] = useState('');
    const [user, setUser] = useState(null);
    const [mounted, setMounted] = useState(false);

    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        const storedUser = localStorage.getItem('user_info');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) { console.error(e); }
        }
    }, []);

    const filteredProjects = PROJECT_LIST.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase())) ||
        (p.category && p.category.toLowerCase().includes(search.toLowerCase()))
    );

    if (!mounted) return <LoadingState colorTheme="web3_projects" message="Initializing Projects..." />;

    return (
        <div className="space-y-6 md:space-y-8">
            <HeroHeader
                breadcrumbs={[
                    { label: 'Dashboard', href: '/' },
                    { label: 'Web3 Projects' }
                ]}
                title="Web3"
                badge="Projects"
                description="Explore the latest decentralized applications, protocols, and blockchain eco-system projects."
                colorTheme="web3_projects"
            />

            {/* Search Bar */}
            <div className="relative group max-w-2xl mx-auto w-full">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-[#ffd89b]/60 group-focus-within:text-[#ffd89b] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                    type="text"
                    placeholder="Search projects..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-[#0a0312] border border-[#ffd89b]/20 rounded-2xl text-xs text-[#FDF2D9] placeholder:text-[#ffd89b]/30 focus:border-[#ffd89b]/40 focus:ring-2 focus:ring-[#ffd89b]/5 focus:outline-none font-mono transition-all shadow-[0_0_15px_rgba(255,216,155,0.05)]"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project, idx) => {
                    const isLocked = !user && project.slug === 'nara-agent';
                    
                    return (
                        <div 
                            key={idx}
                            onClick={() => !isLocked && router.push(`/web3-projects/${project.slug}`)}
                            className={`group relative bg-[#0a0312] border border-[#ffd89b]/20 rounded-2xl p-5 transition-all duration-300 overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.3)] ${
                                isLocked ? 'opacity-60 cursor-not-allowed' : 'hover:border-[#ffd89b]/50 cursor-pointer'
                            }`}
                        >
                            {/* Hover Gradient Overlay */}
                            {!isLocked && <div className="absolute inset-0 bg-linear-to-br from-[#ffd89b]/5 via-transparent to-[#19547b]/5 opacity-0 group-hover:opacity-100 transition-opacity" />}
                            
                            <div className="relative z-10 flex items-start gap-4">
                                <div className="w-14 h-14 rounded-xl border border-[#ffd89b]/30 bg-[#1A082E] flex items-center justify-center shrink-0 overflow-hidden shadow-[0_0_10px_rgba(255,216,155,0.2)]">
                                    <img 
                                        src={project.logo} 
                                        alt={project.name}
                                        className={`w-full h-full object-contain p-2 ${isLocked ? 'grayscale' : ''}`}
                                        onError={(e) => e.target.src = '/icons/digital-currency.png'}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className={`text-base font-bold text-white truncate uppercase tracking-wider transition-colors ${!isLocked && 'group-hover:text-[#ffd89b]'}`}>
                                        {project.name}
                                    </h3>
                                    <span className="inline-block px-2 py-0.5 mt-1 rounded bg-[#ffd89b]/10 text-[#ffd89b] border border-[#ffd89b]/20 text-[9px] font-black uppercase tracking-widest leading-none">
                                        {project.category || 'Protocol'}
                                    </span>
                                </div>
                            </div>

                            <div className="relative z-10 mt-4 h-12 overflow-hidden">
                                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed font-mono">
                                    {project.description}
                                </p>
                            </div>

                            <div className="relative z-10 mt-4 pt-4 border-t border-[#ffd89b]/10 flex items-center justify-between">
                                {isLocked ? (
                                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        Login Required
                                    </div>
                                ) : (
                                    <div className="text-[10px] font-black text-[#ffd89b] uppercase tracking-[0.2em] flex items-center gap-1">
                                        Explore Registry
                                        <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                )}
                                {project.isFeatured && (
                                    <span className="flex items-center gap-1 text-[9px] font-bold text-amber-400/80">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                        Featured
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
