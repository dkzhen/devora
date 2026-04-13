'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Trophy, ListTodo, CircleDollarSign } from 'lucide-react';
import { ActionHero, HeroHeader, LoadingState } from '@/components/HeroHeader';
import LoadingImage from '@/components/LoadingImage';

function StatCard({ title, value, icon, color, subtext }) {
    return (
        <div className="bg-[#0a0312] p-6 rounded-2xl border border-white/8 shadow-sm flex flex-col justify-between h-full relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity`}>
                {icon}
            </div>
            <div>
                <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
                <div className="text-2xl font-bold text-white">{value}</div>
            </div>
            {subtext && <div className="mt-4 text-xs text-slate-400">{subtext}</div>}
            <div className={`absolute bottom-0 left-0 h-1 w-full bg-purple-900/50`}></div>
        </div>
    );
}

function AirdropRow({ airdrop, user, onDelete, onEdit }) {
    const router = useRouter();

    return (
        <tr
            className="group hover:bg-[#0a0e1a]/90 transition-all border-b border-purple-500/10 last:border-0 cursor-pointer hover:shadow-[inset_4px_0_0_rgba(168,85,247,0.5)]"
            onClick={() => router.push(`/airdrops/${airdrop.id}`)}
        >
            <td className="py-4 px-4 w-1/3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0a0312] border border-purple-500/30 flex items-center justify-center text-lg shrink-0 overflow-hidden shadow-[0_0_10px_rgba(168,85,247,0.2)] group-hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-shadow">
                        <LoadingImage 
                            src={airdrop.icon} 
                            alt={airdrop.name} 
                            className="w-full h-full object-cover" 
                            fallback="/icons/digital-currency.png"
                        />
                    </div>
                    <div>
                        <div className="font-bold text-white flex items-center gap-2">
                            {airdrop.name}
                            {!airdrop.isPublic && airdrop.publishStatus !== 'PENDING' && <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-500/20 text-slate-400 border border-gray-500/30 font-bold">PRIVATE</span>}
                            {!airdrop.isPublic && airdrop.publishStatus === 'PENDING' && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-bold" title="Pending Publish Request">
                                    PENDING
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </td>
            <td className="py-4 px-4">
                <div className="flex flex-wrap gap-1.5 mb-1.5 items-center">
                    {(() => {
                        let categories = [];
                        if (airdrop.tasks && airdrop.tasks.length > 0) {
                            categories = airdrop.tasks.map(t => t.category.trim());
                        } else if (airdrop.taskType) {
                            categories = airdrop.taskType.split(',').map(t => t.trim());
                        }

                        // Deduplicate case-insensitively, keeping the first encountered case
                        const seen = new Set();
                        categories = categories.filter(c => {
                            const lower = c.toLowerCase();
                            if (seen.has(lower)) return false;
                            seen.add(lower);
                            return true;
                        });

                        if (categories.length === 0) {
                            return <span className="text-sm font-medium text-white">-</span>;
                        }

                        const displayedCategories = categories.slice(0, 2);
                        const hiddenCategories = categories.slice(2);

                        return (
                            <>
                                {displayedCategories.map((category, idx) => (
                                    <span key={idx} className="px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-slate-100">
                                        {category.toUpperCase()}
                                    </span>
                                ))}
                                {hiddenCategories.length > 0 && (
                                    <div className="relative group cursor-help">
                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-500/10 text-purple-400">
                                            +{hiddenCategories.length}
                                        </span>
                                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50 w-max max-w-xs bg-gray-900 text-white rounded-lg shadow-xl border border-gray-700/50 overflow-hidden">
                                            <div className="flex flex-col py-1">
                                                {hiddenCategories.map((category, idx) => (
                                                    <span key={idx} className="px-3 py-1.5 text-xs font-medium hover:bg-gray-800">
                                                        {category}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        );
                    })()}
                </div>
                <div className="text-xs text-slate-500">Cost: {airdrop.cost} • Time: {airdrop.time}</div>
            </td>
            <td className="py-4 px-4">
                <div className="flex items-center gap-2">
                    {airdrop.status === 'Confirmed' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-600">
                            CONFIRMED
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-600">
                            {airdrop.status ? airdrop.status.toUpperCase() : 'POTENTIAL'}
                        </span>
                    )}
                </div>
                {airdrop.statusDate && <div className="text-[10px] text-slate-400 mt-1 ml-1">{new Date(airdrop.statusDate).toLocaleDateString()}</div>}
            </td>
            <td className="py-4 px-4 text-right">
                <div className="flex items-center justify-end gap-2">
                    {(user?.role === 'ULTRA' || airdrop.userId === user?.id) && (
                        <>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(airdrop);
                                }}
                                className="p-2 text-slate-400 hover:text-purple-400 transition-colors"
                                title="Edit Project"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(airdrop.id);
                                }}
                                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                title="Delete Project"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </>
                    )}
                    <button className="text-slate-400 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            </td>
        </tr>
    );
}

export default function AirdropsPage() {
    const [airdrops, setAirdrops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [nameFilter, setNameFilter] = useState('');
    const [globalSearch, setGlobalSearch] = useState('');
    const [taskTypeFilter, setTaskTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [visibilityFilter, setVisibilityFilter] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [selectedSuggestion, setSelectedSuggestion] = useState(null);
    const [currencyType, setCurrencyType] = useState('$');
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleAddProject = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.target);

        // Formatting inputs based on mapping specs
        const rawTime = formData.get('time');
        const formattedTime = rawTime ? `${rawTime.replace(/[^0-9]/g, '')} minutes` : '';

        const rawCost = formData.get('cost');
        const formattedCost = rawCost ? (currencyType === '$' ? `$${rawCost.replace(/[^0-9]/g, '')}` : `Rp.${rawCost.replace(/[^0-9]/g, '')}`) : '$0';

        const rawRaise = formData.get('raise');
        const formattedRaise = rawRaise ? `$${rawRaise.trim().replace(/^\$*/, '')}` : '';

        // Extracting links JSON
        const linksData = {
            web: formData.get('linkWeb'),
            x: formData.get('linkX'),
            github: formData.get('linkGit'),
            telegram: formData.get('linkTele'),
            discord: formData.get('linkDiscord')
        };
        const activeLinks = Object.entries(linksData)
            .filter(([_, url]) => url && url.trim() !== '')
            .map(([name, url]) => ({ name, url }));

        try {
            const url = editingProject ? `/api/airdrops/${editingProject.id}` : '/api/airdrops';
            const method = editingProject ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.get('name'),
                    icon: formData.get('icon'),
                    stage: formData.get('stage'),
                    status: formData.get('status'),
                    rewardType: formData.get('rewardType'),
                    cost: formattedCost,
                    time: formattedTime,
                    raise: formattedRaise,
                    projectType: formData.get('projectType'),
                    links: activeLinks.length > 0 ? activeLinks : null,
                    description: formData.get('description'),
                    ...(user?.role === 'ULTRA' ? { isPublic: formData.get('isPublic') === 'true' } : {}),
                }),
            });

            if (res.ok) {
                const refreshedProject = await res.json();

                if (editingProject) {
                    setAirdrops(airdrops.map(a => a.id === editingProject.id ? refreshedProject : a));
                    showToast('Project updated successfully!');
                } else {
                    setAirdrops([refreshedProject, ...airdrops]);
                    showToast('Project created successfully!');
                }

                setShowAddModal(false);
                setEditingProject(null);
                setSelectedSuggestion(null);
            } else {
                showToast(`Failed to ${editingProject ? 'edit' : 'add'} project`, 'error');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteAirdrop = async (id) => {
        if (!confirm('Are you sure you want to delete this project? All associated tasks and progress will be lost.')) return;

        try {
            const res = await fetch(`/api/airdrops/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setAirdrops(airdrops.filter(a => a.id !== id));
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete project');
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred while deleting the project');
        }
    };


    const uniqueTaskTypes = Array.from(new Set(
        airdrops.flatMap(a => {
            if (a.tasks && a.tasks.length > 0) {
                return a.tasks.map(t => t.category.trim().toLowerCase());
            } else if (a.taskType) {
                return a.taskType.split(',').map(t => t.trim().toLowerCase());
            }
            return [];
        })
    )).sort();
    const uniqueStatuses = Array.from(new Set(airdrops.map(a => a.status).filter(Boolean)));

    useEffect(() => {
        const checkAuth = async () => {
            // Auth Check
            const storedUser = localStorage.getItem('user_info');
            if (storedUser) {
                try {
                    const parsed = JSON.parse(storedUser);
                    setUser(parsed);
                } catch (e) {
                    console.error(e);
                }
            } else {
                try {
                    const res = await fetch('/api/auth/me');
                    if (res.ok) {
                        const data = await res.json();
                        if (data.user) {
                            setUser(data.user);
                        }
                    }
                } catch (e) { console.error(e); }
            }

            // Maintenance check handled globally in providers.js
        };

        checkAuth();

        const fetchAirdrops = async () => {
            try {
                const res = await fetch('/api/airdrops');
                if (res.ok) {
                    const data = await res.json();
                    setAirdrops(data);
                }
            } catch (error) {
                console.error('Failed to fetch airdrops', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAirdrops();
    }, []);

    const filteredAirdrops = airdrops.filter(airdrop => {
        const matchesName = airdrop.name.toLowerCase().includes(nameFilter.toLowerCase());

        // Build search string including dynamic tasks
        let dynamicTaskCategories = '';
        if (airdrop.tasks && airdrop.tasks.length > 0) {
            dynamicTaskCategories = Array.from(new Set(airdrop.tasks.map(t => t.category.toLowerCase()))).join(' ');
        }
        const searchStr = `${airdrop.name} ${airdrop.taskType || ''} ${dynamicTaskCategories} ${airdrop.stage || ''} ${airdrop.status || ''}`.toLowerCase();
        const matchesGlobal = searchStr.includes(globalSearch.toLowerCase());

        let projectCategories = [];
        if (airdrop.tasks && airdrop.tasks.length > 0) {
            projectCategories = Array.from(new Set(airdrop.tasks.map(t => t.category.trim().toLowerCase())));
        } else if (airdrop.taskType) {
            projectCategories = airdrop.taskType.split(',').map(t => t.trim().toLowerCase());
        }

        const matchesTaskType = taskTypeFilter === '' || projectCategories.includes(taskTypeFilter.toLowerCase());
        const matchesStatus = statusFilter === '' || airdrop.status === statusFilter;

        let matchesVisibility = true;
        if (visibilityFilter === 'public') {
            matchesVisibility = airdrop.isPublic === true;
        } else if (visibilityFilter === 'private') {
            matchesVisibility = !airdrop.isPublic && airdrop.publishStatus !== 'PENDING';
        } else if (visibilityFilter === 'pending') {
            matchesVisibility = !airdrop.isPublic && airdrop.publishStatus === 'PENDING';
        }

        return matchesName && matchesGlobal && matchesTaskType && matchesStatus && matchesVisibility;
    });

    const newActivityCount = airdrops.filter(a => a.status === 'New').length;
    const confirmedCount = airdrops.filter(a => a.status === 'Confirmed').length;
    const toCheckCount = airdrops.filter(a => a.status === 'Verification Check').length;

    // Calculate total raised
    // Calculate total raised to get average
    let projectsWithRaiseData = 0;
    const totalRaised = airdrops.reduce((sum, airdrop) => {
        if (!airdrop.raise) return sum;
        // Remove $ and non-numeric characters except '.' and 'M', 'B', 'K'
        const valueStr = airdrop.raise.replace(/[^0-9.MBKkmb]/g, '').toUpperCase();
        let multiplier = 1;
        if (valueStr.includes('B')) multiplier = 1000; // if Billion, we will normalize to Millions
        else if (valueStr.includes('K')) multiplier = 0.001; // if K, it is 0.001 Million

        const numericVal = parseFloat(valueStr.replace(/[^0-9.]/g, ''));
        if (!isNaN(numericVal)) {
            projectsWithRaiseData++;
            if (valueStr.includes('B')) {
                return sum + (numericVal * 1000); // Normalize to Millions
            } else if (valueStr.includes('K')) {
                return sum + (numericVal / 1000); // Normalize to Millions
            }
            return sum + numericVal; // Assuming default 'M' if not specified but looks like a float
        }
        return sum;
    }, 0);

    const avgRaised = projectsWithRaiseData > 0 ? (totalRaised / projectsWithRaiseData) : 0;

    const formattedRaised = avgRaised > 0
        ? `$${avgRaised >= 1000 ? (avgRaised / 1000).toFixed(2) + 'B' : avgRaised.toFixed(1) + 'M'}`
        : '$0M';

    if (loading) {
        return (
            <div className="space-y-8">
                <HeroHeader
                    title="Drop"
                    badge="Hunting"
                    description="Track and manage your airdrop activities"
                    
                    breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Airdrops' }]}
                />
                <LoadingState message="Scanning blockchain for airdrops..."  />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {toast && (
                <div className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium animate-fade-in-up ${toast.type === 'success' ? 'bg-purple-600' : 'bg-red-500'}`}>
                    {toast.message}
                </div>
            )}
            <HeroHeader
                title="Drop"
                badge="Hunting"
                description="Track and manage your airdrop activities"
                
                breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Airdrops' }]}
            />

            {/* Mobile Stats chips */}
            <div className="md:hidden grid grid-cols-4 gap-2">
                {[
                    { icon: <Activity className="w-5 h-5 text-purple-400" />, label: 'New Activity', value: newActivityCount.toString(), color: 'text-white' },
                    { icon: <Trophy className="w-5 h-5 text-orange-400" />, label: 'Confirmed', value: confirmedCount.toString(), color: 'text-white' },
                    { icon: <ListTodo className="w-5 h-5 text-indigo-400" />, label: 'To Check', value: toCheckCount.toString(), color: 'text-white' },
                    { icon: <CircleDollarSign className="w-5 h-5 text-cyan-400" />, label: 'Avg. Raised', value: formattedRaised, color: 'text-cyan-400' },
                ].map((stat, i) => (
                    <div key={i} className="bg-[#0a0312]/40 border border-purple-500/10 rounded-xl p-2 flex flex-col items-center text-center shadow-lg shadow-black/20 backdrop-blur-md">
                        <span className="flex items-center justify-center p-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 mb-1">{stat.icon}</span>
                        <span className={`text-sm font-black tracking-tight ${stat.color}`}>{stat.value}</span>
                        <span className="text-[9px] text-purple-400/60 mt-0.5 leading-none font-bold uppercase tracking-wider">{stat.label}</span>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="bg-[#0a0312]/80 backdrop-blur-xl border border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.05)] rounded-2xl p-6 relative overflow-hidden text-white group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full pointer-events-none group-hover:bg-purple-500/20 transition-colors" />
                    <span className="absolute top-0 left-0 w-16 h-1 bg-linear-to-r from-purple-500 to-transparent" />
                    <span className="absolute bottom-0 right-0 w-16 h-1 bg-linear-to-l from-indigo-500 to-transparent" />
                    <h3 className="text-purple-400/80 text-sm font-bold uppercase tracking-wider mb-6 border-b border-purple-500/10 pb-4 relative z-10">Activity Overview</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                        <div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                                <Activity className="w-4 h-4 text-purple-400" /> New activity
                            </div>
                            <div className="text-3xl font-bold">{newActivityCount}</div>
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                                <Trophy className="w-4 h-4 text-orange-400" /> Award confirmed
                            </div>
                            <div className="text-3xl font-bold">{confirmedCount}</div>
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                                <ListTodo className="w-4 h-4 text-indigo-400" /> Rewards to check
                            </div>
                            <div className="text-3xl font-bold">{toCheckCount}</div>
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                                <CircleDollarSign className="w-4 h-4 text-cyan-400" /> Avg. Raised
                            </div>
                            <div className="text-3xl font-bold text-cyan-400">{formattedRaised}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== MOBILE: Filter Bar + Card List ===== */}
            <div className="md:hidden space-y-3">
                {/* Mobile Filter Bar */}
                <div className="relative overflow-hidden rounded-2xl">
                    <div className="absolute inset-0 bg-linear-to-br from-[#0a0312] via-purple-900/40 to-[#0a0312]" />
                    <div className="relative z-10 p-3 space-y-2">
                        {/* Row 1: Search inputs */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                    <svg className="h-3.5 w-3.5 text-purple-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                                </div>
                                <input type="text" placeholder="Project Name" value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} className="w-full pl-7 pr-2 py-2 bg-black/20 border border-white/10 rounded-xl text-xs text-slate-100 placeholder-gray-500 focus:ring-1 focus:ring-purple-500 focus:outline-none" />
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                    <svg className="h-3.5 w-3.5 text-purple-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                                <input type="text" placeholder="Global Search" value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} className="w-full pl-7 pr-2 py-2 bg-black/20 border border-white/10 rounded-xl text-xs text-slate-100 placeholder-gray-500 focus:ring-1 focus:ring-purple-500 focus:outline-none" />
                            </div>
                        </div>
                        {/* Row 2: dropdowns + add button */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="relative">
                                <select value={taskTypeFilter} onChange={(e) => setTaskTypeFilter(e.target.value)} className="w-full appearance-none bg-black/20 border border-white/10 rounded-xl pl-2.5 pr-6 py-2 text-xs text-slate-300 outline-none focus:ring-1 focus:ring-purple-500">
                                    <option value="">All Types</option>
                                    {uniqueTaskTypes.map(type => <option key={type} value={type}>{type.toUpperCase()}</option>)}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
                            </div>
                            <div className="relative">
                                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full appearance-none bg-black/20 border border-white/10 rounded-xl pl-2.5 pr-6 py-2 text-xs text-slate-300 outline-none focus:ring-1 focus:ring-purple-500">
                                    <option value="">All Status</option>
                                    {uniqueStatuses.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
                            </div>
                            <div className="relative">
                                <select value={visibilityFilter} onChange={(e) => setVisibilityFilter(e.target.value)} className="w-full appearance-none bg-black/20 border border-white/10 rounded-xl pl-2.5 pr-6 py-2 text-xs text-slate-300 outline-none focus:ring-1 focus:ring-purple-500">
                                    <option value="">All Visibility</option>
                                    <option value="public">Public</option>
                                    <option value="private">Private</option>
                                    {user?.role === 'ULTRA' && <option value="pending">Pending</option>}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
                            </div>
                            {user && (
                                <button onClick={() => setShowAddModal(true)} className="flex items-center justify-center gap-1.5 px-3 py-2 bg-linear-to-r from-purple-600 to-indigo-600 hover:from-[#F25278]/90 hover:to-[#FEA47F]/90 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-500/30 transition-all active:scale-95 border border-white/10">
                                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    Add Project
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile Stats bar */}
                <div className="flex items-center justify-between px-1">
                    <span className="text-xs text-slate-500">{filteredAirdrops.length} project{filteredAirdrops.length !== 1 ? 's' : ''} found</span>
                    {(nameFilter || globalSearch || taskTypeFilter || statusFilter || visibilityFilter) && (
                        <button onClick={() => { setNameFilter(''); setGlobalSearch(''); setTaskTypeFilter(''); setStatusFilter(''); setVisibilityFilter(''); }} className="text-xs text-purple-400 hover:text-purple-300 transition-colors">Clear filters</button>
                    )}
                </div>

                {/* Mobile Card List */}
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="animate-pulse bg-[#0c0e1a]/5 rounded-2xl h-20" />
                    ))
                ) : filteredAirdrops.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-600">
                        <svg className="w-10 h-10 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <p className="text-sm">No projects found</p>
                    </div>
                ) : (
                    filteredAirdrops.map((airdrop) => {
                        let categories = [];
                        if (airdrop.tasks && airdrop.tasks.length > 0) {
                            const seen = new Set();
                            categories = airdrop.tasks.map(t => t.category.trim()).filter(c => { const l = c.toLowerCase(); return seen.has(l) ? false : seen.add(l) && true; });
                        } else if (airdrop.taskType) {
                            categories = airdrop.taskType.split(',').map(t => t.trim());
                        }

                        const statusColors = {
                            'New': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                            'Confirmed': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
                            'Potential': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
                            'Verification Check': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                            'Ended': 'bg-gray-500/10 text-slate-400 border-gray-500/20',
                        };
                        const statusStyle = statusColors[airdrop.status] || 'bg-gray-500/10 text-slate-400 border-gray-500/20';

                        return (
                            <div
                                key={airdrop.id}
                                className="group relative overflow-hidden rounded-2xl bg-[#0a0e1a]/80 backdrop-blur-md border border-purple-500/10 active:scale-[0.99] transition-all cursor-pointer hover:border-purple-500/30 shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
                                onClick={() => window.location.href = `/airdrops/${airdrop.id}`}
                            >
                                {/* Glow accent for new */}
                                {airdrop.status === 'New' && <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-purple-500/60 to-transparent" />}
                                <div className="p-3 flex items-center gap-3 relative z-10">
                                    {/* Project Icon */}
                                    <div className="w-11 h-11 rounded-xl bg-[#0c0e1a] shadow-[0_0_10px_rgba(168,85,247,0.15)] group-hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] flex items-center justify-center text-lg shrink-0 overflow-hidden border border-blue-500/30">
                                        <LoadingImage 
                                            src={airdrop.icon} 
                                            alt={airdrop.name} 
                                            className="w-full h-full object-cover" 
                                            fallback="/icons/digital-currency.png"
                                        />
                                    </div>
                                    {/* Project Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <span className="font-bold text-sm text-white truncate">{airdrop.name}</span>
                                            {!airdrop.isPublic && airdrop.publishStatus !== 'PENDING' && <span className="shrink-0 px-1 py-0.5 rounded text-[9px] bg-gray-500/20 text-slate-400 font-bold border border-gray-500/30">PRIVATE</span>}
                                            {!airdrop.isPublic && airdrop.publishStatus === 'PENDING' && (
                                                <span className="shrink-0 px-1 py-0.5 rounded text-[9px] bg-yellow-500/20 text-yellow-400 font-bold border border-yellow-500/30" title="Pending Publish Request">
                                                    PENDING
                                                </span>
                                            )}
                                        </div>
                                        {/* Categories */}
                                        <div className="flex flex-wrap gap-1">
                                            {categories.slice(0, 2).map((cat, idx) => (
                                                <span key={idx} className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-gray-700/60 text-slate-300 border border-gray-600/50">{cat.toUpperCase()}</span>
                                            ))}
                                            {categories.length > 2 && <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">+{categories.length - 2}</span>}
                                        </div>
                                        <div className="text-[10px] text-slate-500 mt-0.5">{airdrop.cost && `Cost: ${airdrop.cost}`}{airdrop.cost && airdrop.time && ' · '}{airdrop.time && `Time: ${airdrop.time}`}</div>
                                    </div>
                                    {/* Status + chevron */}
                                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${statusStyle}`}>{airdrop.status?.toUpperCase()}</span>
                                        {airdrop.statusDate && <span className="text-[9px] text-slate-600">{new Date(airdrop.statusDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>}
                                    </div>
                                </div>
                                {/* Admin actions */}
                                {(user?.role === 'ULTRA' || airdrop.userId === user?.id) && (
                                    <div className="px-3 pb-2 flex gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); setEditingProject(airdrop); setShowAddModal(true); }} className="flex-1 py-1 text-[10px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-lg hover:bg-blue-500/20 transition-colors">Edit</button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteAirdrop(airdrop.id, e); }} className="flex-1 py-1 text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors">Delete</button>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* ===== DESKTOP: Filter Bar + Table ===== */}
            <div className="hidden md:block space-y-4">
                {/* Futuristic Filter Bar */}
                <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.03)] bg-[#0a0312]/80 backdrop-blur-xl">
                    <div className="relative z-10 px-5 py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-wrap">
                            {/* Project Name */}
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-4 w-4 text-purple-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                                </div>
                                <input type="text" placeholder="Project Name" value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} className="pl-9 pr-4 py-2 bg-black/20 border border-white/10 rounded-xl text-sm text-slate-100 placeholder-gray-600 focus:ring-1 focus:ring-purple-500 focus:outline-none w-44" />
                            </div>
                            {/* Global Search */}
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-4 w-4 text-purple-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                                <input type="text" placeholder="Global Search" value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} className="pl-9 pr-4 py-2 bg-black/20 border border-white/10 rounded-xl text-sm text-slate-100 placeholder-gray-600 focus:ring-1 focus:ring-purple-500 focus:outline-none w-44" />
                            </div>
                            {/* Task Type */}
                            <div className="relative">
                                <select value={taskTypeFilter} onChange={(e) => setTaskTypeFilter(e.target.value)} className="appearance-none bg-black/20 border border-white/10 rounded-xl pl-3 pr-8 py-2 text-sm text-slate-300 outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer">
                                    <option value="">Task Type: All</option>
                                    {uniqueTaskTypes.map(type => <option key={type} value={type}>{type.toUpperCase()}</option>)}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
                            </div>
                            {/* Status */}
                            <div className="relative">
                                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="appearance-none bg-black/20 border border-white/10 rounded-xl pl-3 pr-8 py-2 text-sm text-slate-300 outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer">
                                    <option value="">Status: All</option>
                                    {uniqueStatuses.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
                            </div>
                            {/* Visibility */}
                            <div className="relative">
                                <select value={visibilityFilter} onChange={(e) => setVisibilityFilter(e.target.value)} className="appearance-none bg-black/20 border border-white/10 rounded-xl pl-3 pr-8 py-2 text-sm text-slate-300 outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer">
                                    <option value="">Visibility: All</option>
                                    <option value="public">Public</option>
                                    <option value="private">Private</option>
                                    {user?.role === 'ULTRA' && <option value="pending">Pending</option>}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
                            </div>
                            {/* Results count */}
                            <span className="text-xs text-slate-600 pl-1">{filteredAirdrops.length} projects</span>
                        </div>
                        {/* Add button */}
                        {user ? (
                            <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-purple-600 to-indigo-600 hover:from-[#F25278]/90 hover:to-[#FEA47F]/90 text-white rounded-xl text-sm font-semibold shadow-lg shadow-purple-500/25 transition-all active:scale-95 border border-white/10">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                Add Project
                            </button>
                        ) : (
                            <div className="flex items-center justify-center p-2 bg-black/20 rounded-xl border border-white/10 cursor-not-allowed" title="Requires Login to Add Project">
                                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </div>
                        )}
                    </div>
                </div>
                {/* Table */}
                <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.05)] bg-[#0a0312]/80 backdrop-blur-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-linear-to-r from-[#F25278]/10 to-[#FEA47F]/10 text-xs uppercase text-purple-400/80 font-bold tracking-widest border-b border-purple-500/20">
                                    <th className="py-4 px-6 w-1/3">Name</th>
                                    <th className="py-4 px-6">Task Type</th>
                                    <th className="py-4 px-6">Status</th>
                                    <th className="py-4 px-6 w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse bg-gray-900/50">
                                            <td className="py-4 px-6"><div className="h-10 w-10 bg-gray-800 rounded-xl inline-block mr-3"></div><div className="h-4 w-28 bg-gray-800 rounded inline-block"></div></td>
                                            <td className="py-4 px-6"><div className="h-5 w-20 bg-gray-800 rounded-lg"></div></td>
                                            <td className="py-4 px-6"><div className="h-6 w-24 bg-gray-800 rounded-xl"></div></td>
                                            <td></td>
                                        </tr>
                                    ))
                                ) : (
                                    filteredAirdrops.map((airdrop) => (
                                        <AirdropRow
                                            key={airdrop.id}
                                            airdrop={airdrop}
                                            user={user}
                                            onDelete={handleDeleteAirdrop}
                                            onEdit={(project) => {
                                                setEditingProject(project);
                                                setShowAddModal(true);
                                            }}
                                        />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination */}
                    <div className="bg-purple-500/10 px-6 py-3 border-t border-purple-500/20 flex justify-between items-center relative z-10">
                        <span className="text-xs text-purple-400/60 font-medium">Showing {filteredAirdrops.length} projects</span>
                        <div className="flex gap-2">
                            <button className="px-4 py-1.5 rounded-xl text-xs font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 hover:bg-[#F25278]/20 transition-all active:scale-95 shadow-[0_0_10px_rgba(168,85,247,0.1)]">Previous</button>
                            <button className="px-4 py-1.5 rounded-xl text-xs font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 hover:bg-[#F25278]/20 transition-all active:scale-95 shadow-[0_0_10px_rgba(168,85,247,0.1)]">Next</button>
                        </div>
                    </div>
                </div>
            </div>


            {/* Add/Edit Project Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-[#0a0312] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-purple-500/30 shadow-2xl p-6 md:p-8 custom-scrollbar">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">
                                {editingProject ? 'Edit Project' : (selectedSuggestion ? 'Audit Suggested Project' : 'Add New Project')}
                            </h2>
                            <button onClick={() => { setShowAddModal(false); setSelectedSuggestion(null); setEditingProject(null); }} className="text-slate-400 hover:text-slate-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleAddProject} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Project Name *</label>
                                    <input required name="name" type="text" defaultValue={editingProject?.name || selectedSuggestion?.name || ''} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#F25278]" placeholder="e.g. Optimism" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Icon URL</label>
                                    <input name="icon" type="url" defaultValue={editingProject?.icon || ''} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#F25278]" placeholder="https://example.com/logo.png" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Project Type</label>
                                    <input name="projectType" type="text" defaultValue={editingProject?.projectType || ''} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#F25278]" placeholder="e.g. Blockchain Infra" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                                    <select name="status" defaultValue={editingProject?.status || 'New'} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#F25278] appearance-none">
                                        <option value="New">New</option>
                                        <option value="Potential">Potential</option>
                                        <option value="Confirmed">Confirmed</option>
                                        <option value="Verification Check">Verification Check</option>
                                        <option value="Ended">Ended</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Reward Date</label>
                                    <input name="rewardDate" type="text" defaultValue={editingProject?.rewardDate || "TBA"} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#F25278]" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Cost (Number Only)</label>
                                    <div className="flex">
                                        <select
                                            value={currencyType}
                                            onChange={(e) => setCurrencyType(e.target.value)}
                                            className="bg-black/40 border border-white/10 rounded-l-lg px-3 py-2 text-white focus:outline-none"
                                        >
                                            <option value="$">$</option>
                                            <option value="Rp">Rp</option>
                                        </select>
                                        <input name="cost" type="number" defaultValue={(editingProject?.cost || '').replace(/[^0-9]/g, '') || ''} placeholder="500" className="w-full bg-black/20 border border-l-0 border-white/10 rounded-r-lg px-4 py-2 text-white focus:outline-none focus:border-[#F25278]" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Time to Complete (Minutes)</label>
                                    <input name="time" type="number" defaultValue={(editingProject?.time || '').replace(/[^0-9]/g, '') || ''} placeholder="e.g. 10" className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#F25278]" />
                                </div>
                                {user?.role === 'ULTRA' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Visibility</label>
                                        <div className="flex items-center gap-4 py-2">
                                            <label className="flex items-center gap-2 text-white cursor-pointer select-none hover:text-purple-400">
                                                <input type="radio" name="isPublic" value="true" defaultChecked={editingProject ? editingProject.isPublic : true} className="w-4 h-4 text-purple-400 bg-black border-gray-700 focus:ring-purple-500" />
                                                Public
                                            </label>
                                            <label className="flex items-center gap-2 text-white cursor-pointer select-none hover:text-slate-300">
                                                <input type="radio" name="isPublic" value="false" defaultChecked={editingProject ? !editingProject.isPublic : false} className="w-4 h-4 text-purple-400 bg-black border-gray-700 focus:ring-purple-500" />
                                                Private
                                            </label>
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Raised</label>
                                    <div className="flex">
                                        <span className="bg-black/40 border border-white/10 rounded-l-lg px-4 py-2 text-slate-500">$</span>
                                        <input name="raise" type="text" defaultValue={(editingProject?.raise || '').replace(/^\$/, '') || ''} placeholder="e.g. 11M or 11,000,000" className="w-full bg-black/20 border border-l-0 border-white/10 rounded-r-lg px-4 py-2 text-white focus:outline-none focus:border-[#F25278]" />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-white/10 pt-6">
                                <h3 className="text-sm font-bold text-white mb-4">Official Links (Optional)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1">Website</label>
                                        <input name="linkWeb" type="url" defaultValue={editingProject?.links?.find(l => l.name === 'web')?.url || ''} className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#F25278]" placeholder="https://..." />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1">X (Twitter)</label>
                                        <input name="linkX" type="url" defaultValue={editingProject?.links?.find(l => l.name === 'x')?.url || ''} className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#F25278]" placeholder="https://twitter.com/..." />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1">GitHub</label>
                                        <input name="linkGit" type="url" defaultValue={editingProject?.links?.find(l => l.name === 'github')?.url || ''} className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#F25278]" placeholder="https://github.com/..." />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1">Telegram</label>
                                        <input name="linkTele" type="url" defaultValue={editingProject?.links?.find(l => l.name === 'telegram')?.url || ''} className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#F25278]" placeholder="https://t.me/..." />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1">Discord</label>
                                        <input name="linkDiscord" type="url" defaultValue={editingProject?.links?.find(l => l.name === 'discord')?.url || ''} className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#F25278]" placeholder="https://discord.gg/..." />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                                <textarea name="description" rows={3} defaultValue={editingProject?.description || selectedSuggestion?.description || ''} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#F25278]" placeholder="Instructions or details about the project..." />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                                <button type="button" onClick={() => { setShowAddModal(false); setSelectedSuggestion(null); setEditingProject(null); }} className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-gray-800 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-[#F25278] hover:bg-[#F25278]/90 active:scale-95 text-white rounded-xl font-medium shadow-lg shadow-[#F25278]/20 transition-all disabled:opacity-50 flex items-center gap-2">
                                    {isSubmitting ? (editingProject ? 'Saving...' : (selectedSuggestion ? 'Auditing...' : 'Creating...')) : (editingProject ? 'Save Changes' : (selectedSuggestion ? 'Audit Project' : 'Create Project'))}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
