'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Trophy, ListTodo, CircleDollarSign } from 'lucide-react';

function StatCard({ title, value, icon, color, subtext }) {
    return (
        <div className="bg-[#0f172a] p-6 rounded-2xl border border-white/8 shadow-sm flex flex-col justify-between h-full relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity`}>
                {icon}
            </div>
            <div>
                <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
                <div className="text-2xl font-bold text-white">{value}</div>
            </div>
            {subtext && <div className="mt-4 text-xs text-gray-400">{subtext}</div>}
            <div className={`absolute bottom-0 left-0 h-1 w-full bg-${color}-500`}></div>
        </div>
    );
}

function AirdropRow({ airdrop, isAdmin, onDelete, onEdit }) {
    const router = useRouter();

    return (
        <tr
            className="hover:bg-[#0f172a] transition-colors border-b border-white/8 last:border-0 cursor-pointer"
            onClick={() => router.push(`/airdrops/${airdrop.id}`)}
        >
            <td className="py-4 px-4 w-1/3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-lg shrink-0 overflow-hidden">
                        {airdrop.icon ? <img src={airdrop.icon} alt={airdrop.name} className="w-full h-full object-cover" /> : airdrop.name[0]}
                    </div>
                    <div>
                        <div className="font-bold text-white flex items-center gap-2">
                            {airdrop.name}
                            {airdrop.status === 'New' && <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500 text-white font-bold">NEW</span>}
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
                                    <span key={idx} className="px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-gray-100">
                                        {category.toUpperCase()}
                                    </span>
                                ))}
                                {hiddenCategories.length > 0 && (
                                    <div className="relative group cursor-help">
                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-600">
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
                <div className="text-xs text-gray-500">Cost: {airdrop.cost} • Time: {airdrop.time}</div>
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
                {airdrop.statusDate && <div className="text-[10px] text-gray-400 mt-1 ml-1">{new Date(airdrop.statusDate).toLocaleDateString()}</div>}
            </td>
            <td className="py-4 px-4 text-right">
                <div className="flex items-center justify-end gap-2">
                    {isAdmin && (
                        <>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(airdrop);
                                }}
                                className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                                title="Edit Project"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(airdrop.id);
                                }}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                title="Delete Project"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </>
                    )}
                    <button className="text-gray-400 hover:text-white transition-colors">
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
    const [showAddModal, setShowAddModal] = useState(false);
    const [showSuggestModal, setShowSuggestModal] = useState(false);
    const [recommendedProjects, setRecommendedProjects] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [currencyType, setCurrencyType] = useState('$');
    const [selectedSuggestion, setSelectedSuggestion] = useState(null);
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

                // If this was audited from a suggestion, delete the suggestion
                if (selectedSuggestion) {
                    await fetch(`/api/airdrops/suggest/${selectedSuggestion.id}`, { method: 'DELETE' });
                    setRecommendedProjects(recommendedProjects.filter(p => p.id !== selectedSuggestion.id));
                    setSelectedSuggestion(null);
                }

                setShowAddModal(false);
                setEditingProject(null);
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

    const handleDeleteSuggestion = async (id, e) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this suggestion?')) return;

        try {
            const res = await fetch(`/api/airdrops/suggest/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setRecommendedProjects(recommendedProjects.filter(p => p.id !== id));
            } else {
                alert('Failed to delete suggestion');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSuggestProject = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.target);

        try {
            const res = await fetch('/api/airdrops/suggest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.get('name'),
                    link: formData.get('link'),
                    description: formData.get('description'),
                    sender: user ? (user.name || user.username || user.email) : 'Anonymous',
                }),
            });

            if (res.ok) {
                alert('Project suggested successfully!');
                setShowSuggestModal(false);
            } else {
                alert('Failed to suggest project');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
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
        const checkMaintenanceAndAuth = async () => {
            let role = 'MEMBER';

            // Auth Check
            const storedUser = localStorage.getItem('user_info');
            if (storedUser) {
                try {
                    const parsed = JSON.parse(storedUser);
                    setUser(parsed);
                    role = parsed.role || 'MEMBER';
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
                            role = data.user.role || 'MEMBER';
                        }
                    }
                } catch (e) { console.error(e); }
            }

            // Maintenance Check (skip for ULTRA)
            if (role !== 'ULTRA') {
                try {
                    const mRes = await fetch('/api/maintenance', { cache: 'no-store' });
                    if (mRes.ok) {
                        const configs = await mRes.json();
                        const cfg = configs.find(c => c.feature === 'airdrops');
                        if (cfg?.enabled) {
                            window.location.href = `/maintenance?feature=airdrops&message=${encodeURIComponent(cfg.message || '')}`;
                            return;
                        }
                    }
                } catch (e) { console.error('Maintenance check failed', e); }
            }
        };

        checkMaintenanceAndAuth();

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

        const fetchRecommendations = async () => {
            try {
                const res = await fetch('/api/airdrops/suggest');
                if (res.ok) {
                    const data = await res.json();
                    setRecommendedProjects(data);
                }
            } catch (error) {
                console.error('Failed to fetch recommendations', error);
            }
        };

        fetchAirdrops();
        fetchRecommendations();
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
        return matchesName && matchesGlobal && matchesTaskType && matchesStatus;
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
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-xs text-gray-500 animate-pulse">Loading airdrops…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {toast && (
                <div className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium animate-fade-in-up ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {toast.message}
                </div>
            )}
            {/* ===== MOBILE HEADER (futuristic) ===== */}
            <div className="md:hidden relative overflow-hidden rounded-2xl mb-2">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-[#0d1b3e] to-gray-900" />
                {/* Glowing orbs */}
                <div className="absolute -top-8 -left-8 w-52 h-52 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-12 right-0 w-44 h-44 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
                {/* Grid overlay */}
                <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                <div className="relative z-10 p-5 pt-4">
                    {/* Breadcrumb */}
                    <nav className="flex text-xs text-blue-300/70 mb-4" aria-label="Breadcrumb">
                        <a href="/" className="flex items-center gap-1 hover:text-blue-300 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                            Dashboard
                        </a>
                        <svg className="w-3 h-3 mx-1.5 text-blue-400/40 mt-px self-center" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        <span className="font-semibold text-blue-200">Airdrops</span>
                    </nav>

                    {/* Title row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight leading-none">
                                Drop <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Hunting</span>
                            </h1>
                            <p className="text-gray-400 text-xs mt-1.5 leading-relaxed">Track and manage your airdrop activities</p>
                        </div>
                        {/* Suggest button */}
                        <button
                            onClick={() => setShowSuggestModal(true)}
                            className="shrink-0 flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-700/30 transition-all active:scale-95 border border-white/10"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            Suggest
                        </button>
                    </div>

                    {/* Stats chips */}
                    <div className="grid grid-cols-4 gap-2 mt-4">
                        {[
                            { icon: <Activity className="w-5 h-5 text-blue-400" />, label: 'New Activity', value: newActivityCount.toString(), color: 'text-white' },
                            { icon: <Trophy className="w-5 h-5 text-orange-400" />, label: 'Confirmed', value: confirmedCount.toString(), color: 'text-white' },
                            { icon: <ListTodo className="w-5 h-5 text-purple-400" />, label: 'To Check', value: toCheckCount.toString(), color: 'text-white' },
                            { icon: <CircleDollarSign className="w-5 h-5 text-emerald-400" />, label: 'Avg. Raised', value: formattedRaised, color: 'text-emerald-400' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-[#0f172a]/5 border border-white/10 rounded-xl p-2 flex flex-col items-center text-center">
                                <span className="flex items-center justify-center p-1.5 rounded-full bg-white/5 mb-1">{stat.icon}</span>
                                <span className={`text-sm font-bold ${stat.color}`}>{stat.value}</span>
                                <span className="text-[9px] text-gray-500 mt-0.5 leading-none">{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ===== DESKTOP HEADER ===== */}
            <div className="hidden md:block">
                <div className="relative overflow-hidden rounded-2xl mb-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-[#0d1b3e] to-gray-900" />
                    <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-16 -left-8 w-56 h-56 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.2) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
                    <div className="relative z-10 p-8 flex items-end justify-between">
                        <div>
                            <nav className="flex text-xs text-blue-300/60 mb-4">
                                <a href="/" className="flex items-center gap-1 hover:text-blue-300 transition-colors">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                    Dashboard
                                </a>
                                <svg className="w-3 h-3 mx-2 text-blue-400/30 self-center" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                <span className="text-blue-200 font-semibold">Airdrops</span>
                            </nav>
                            <h1 className="text-4xl font-black tracking-tight">
                                <span className="text-white">Drop </span>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Hunting</span>
                            </h1>
                            <p className="text-gray-400 mt-2 text-sm">Track and manage your airdrop activities</p>
                        </div>
                        <button
                            onClick={() => setShowSuggestModal(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold shadow-xl shadow-blue-700/30 transition-all active:scale-95 border border-white/10"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            Suggest Project
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="hidden md:flex xl:col-span-1 bg-gray-900 rounded-2xl p-6 relative overflow-hidden text-white flex-col justify-between">
                    <h3 className="text-gray-400 text-sm font-medium mb-4">Current Activity Overview</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                                <Activity className="w-3.5 h-3.5 text-blue-400" /> New activity
                            </div>
                            <div className="text-2xl font-bold">{newActivityCount}</div>
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                                <Trophy className="w-3.5 h-3.5 text-orange-400" /> Award confirmed
                            </div>
                            <div className="text-2xl font-bold">{confirmedCount}</div>
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                                <ListTodo className="w-3.5 h-3.5 text-purple-400" /> Rewards to check
                            </div>
                            <div className="text-2xl font-bold">{toCheckCount}</div>
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                                <CircleDollarSign className="w-3.5 h-3.5 text-emerald-400" /> Avg. Raised
                            </div>
                            <div className="text-2xl font-bold text-emerald-400">{formattedRaised}</div>
                        </div>
                    </div>
                </div>

                {/* Next Reward - MOBILE */}
                <div className="md:hidden relative overflow-hidden rounded-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a]" />
                    <div className="absolute -top-6 right-4 w-36 h-36 rounded-full bg-indigo-600/20 blur-2xl pointer-events-none" />
                    <div className="relative z-10 p-4">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-semibold text-indigo-300/70 uppercase tracking-widest">Events</span>
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-300 text-[10px] font-bold">
                                🔥 Hot
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-4xl font-black text-white tracking-tight">Now</div>
                            <div className="flex-1 bg-[#0f172a]/5 border border-white/10 rounded-xl px-3 py-2.5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-pink-500/30">S</div>
                                    <span className="font-bold text-sm text-white">Sentient</span>
                                </div>
                                <span className="text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-lg cursor-pointer hover:bg-blue-500/20 transition-colors">Claim →</span>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Next Reward - DESKTOP */}
                <div className="hidden md:flex xl:col-span-1 relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] rounded-2xl border border-indigo-900/40 p-6 flex-col justify-between">
                    <div className="absolute -top-6 right-4 w-36 h-36 rounded-full bg-indigo-600/20 blur-2xl pointer-events-none" />
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-indigo-300/60 text-xs font-semibold uppercase tracking-widest">Events</h3>
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-300 text-[10px] font-bold">
                            🔥 Hot
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-4xl font-black text-white tracking-tight">Now</div>
                        <div className="flex-1 bg-[#0f172a]/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-sm font-bold text-white shadow-md shadow-pink-500/30">S</div>
                                <span className="font-bold text-sm text-white">Sentient</span>
                            </div>
                            <span className="text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg cursor-pointer hover:bg-blue-500/20 transition-colors">Claim →</span>
                        </div>
                    </div>
                </div>

                {/* Suggested Projects – MOBILE */}
                <div className="md:hidden relative overflow-hidden rounded-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-[#0d1a2e]" />
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-blue-700/10 blur-2xl pointer-events-none" />
                    <div className="relative z-10 p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Suggested Projects</span>
                            {recommendedProjects.length > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-blue-600/20 text-blue-400 text-[10px] font-bold border border-blue-600/30">{recommendedProjects.length}</span>
                            )}
                        </div>
                        <div
                            className="flex gap-3 overflow-x-auto pb-2 snap-x"
                            style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(59,130,246,0.35) rgba(15,23,42,0.4)' }}
                        >
                            {recommendedProjects.map((project, idx) => (
                                <div key={idx} className="group bg-[#0f172a]/5 border border-white/10 hover:border-blue-500/40 rounded-xl p-3 transition-all cursor-pointer min-w-[220px] snap-center shrink-0" onClick={() => window.open(project.link, '_blank')}>
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <span className="font-bold text-white text-sm truncate">{project.name}</span>
                                        <span className="shrink-0 text-[9px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded-md font-semibold">Suggested</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-gray-500">by <span className="text-gray-400">{project.sender}</span></span>
                                        <span className="text-[10px] text-blue-400 flex items-center gap-0.5">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                            Link
                                        </span>
                                    </div>
                                    {user?.role === 'ULTRA' && (
                                        <div className="flex gap-2 mt-2 pt-2 border-t border-white/5">
                                            <button onClick={(e) => { e.stopPropagation(); setSelectedSuggestion(project); setShowAddModal(true); }} className="flex-1 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-[10px] font-bold rounded-lg border border-blue-500/30 transition-colors">Audit</button>
                                            <button onClick={(e) => handleDeleteSuggestion(project.id, e)} className="flex-1 py-1 bg-red-900/30 hover:bg-red-800/50 text-red-400 text-[10px] font-bold rounded-lg border border-red-900/40 transition-colors">Delete</button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {recommendedProjects.length === 0 && (
                                <div className="flex items-center justify-center h-16 w-full text-gray-600 text-xs border border-dashed border-gray-700/50 rounded-xl">
                                    No recommendations yet
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {/* Suggested Projects – DESKTOP */}
                <div className="hidden md:block xl:col-span-2 bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-gray-400 text-sm font-medium">Suggested Projects</h3>
                        {recommendedProjects.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-400 text-xs font-bold border border-blue-600/30">{recommendedProjects.length}</span>
                        )}
                    </div>
                    <div
                        className="flex gap-4 overflow-x-auto pb-3 snap-x"
                        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(59,130,246,0.4) rgba(15,23,42,0.5)' }}
                    >
                        {recommendedProjects.map((project, idx) => (
                            <div key={idx} className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-blue-500/50 transition-colors cursor-pointer group flex flex-col justify-between min-w-[260px] max-w-[300px] snap-start shrink-0" onClick={() => window.open(project.link, '_blank')}>
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-bold text-white text-base truncate">{project.name}</div>
                                        <span className="text-[10px] text-gray-500 bg-gray-900 px-2 py-1 rounded border border-gray-800 group-hover:bg-blue-900/20 group-hover:text-blue-400 group-hover:border-blue-800/50 transition-colors shrink-0 ml-2">Suggested</span>
                                    </div>
                                    <div className="text-[10px] text-gray-500 mb-2">by <span className="text-gray-400">{project.sender}</span></div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="text-xs text-gray-400 truncate" title={project.description}>{project.description || 'No description'}</div>
                                        <div className="text-xs font-medium text-blue-400 flex items-center gap-1 shrink-0">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                            Link
                                        </div>
                                    </div>
                                    {user?.role === 'ULTRA' && (
                                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-700/50">
                                            <button onClick={(e) => { e.stopPropagation(); setSelectedSuggestion(project); setShowAddModal(true); }} className="flex-1 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-bold rounded-lg border border-blue-500/30 transition-colors">Audit</button>
                                            <button onClick={(e) => handleDeleteSuggestion(project.id, e)} className="flex-1 py-1.5 bg-red-900/40 hover:bg-red-800/60 text-red-400 text-xs font-bold rounded-lg border border-red-900/50 transition-colors">Delete</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {recommendedProjects.length === 0 && (
                            <div className="flex items-center justify-center h-24 w-full text-gray-500 text-sm border border-dashed border-gray-700 rounded-xl">
                                No recommendations yet. Click "Suggest Project"!
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ===== MOBILE: Filter Bar + Card List ===== */}
            <div className="md:hidden space-y-3">
                {/* Mobile Filter Bar */}
                <div className="relative overflow-hidden rounded-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-[#0c1628]" />
                    <div className="relative z-10 p-3 space-y-2">
                        {/* Row 1: Search inputs */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                    <svg className="h-3.5 w-3.5 text-blue-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                                </div>
                                <input type="text" placeholder="Project Name" value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} className="w-full pl-7 pr-2 py-2 bg-[#0f172a]/5 border border-white/10 rounded-xl text-xs text-gray-100 placeholder-gray-500 focus:ring-1 focus:ring-blue-500 focus:outline-none" />
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                    <svg className="h-3.5 w-3.5 text-blue-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                                <input type="text" placeholder="Global Search" value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} className="w-full pl-7 pr-2 py-2 bg-[#0f172a]/5 border border-white/10 rounded-xl text-xs text-gray-100 placeholder-gray-500 focus:ring-1 focus:ring-blue-500 focus:outline-none" />
                            </div>
                        </div>
                        {/* Row 2: dropdowns + add button */}
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <select value={taskTypeFilter} onChange={(e) => setTaskTypeFilter(e.target.value)} className="w-full appearance-none bg-[#0f172a]/5 border border-white/10 rounded-xl pl-2.5 pr-6 py-2 text-xs text-gray-300 outline-none focus:ring-1 focus:ring-blue-500">
                                    <option value="">All Types</option>
                                    {uniqueTaskTypes.map(type => <option key={type} value={type}>{type.toUpperCase()}</option>)}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
                            </div>
                            <div className="relative flex-1">
                                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full appearance-none bg-[#0f172a]/5 border border-white/10 rounded-xl pl-2.5 pr-6 py-2 text-xs text-gray-300 outline-none focus:ring-1 focus:ring-blue-500">
                                    <option value="">All Status</option>
                                    {uniqueStatuses.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
                            </div>
                            {user?.role === 'ULTRA' && (
                                <button onClick={() => setShowAddModal(true)} className="shrink-0 flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-700/30 transition-all active:scale-95">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    Add
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile Stats bar */}
                <div className="flex items-center justify-between px-1">
                    <span className="text-xs text-gray-500">{filteredAirdrops.length} project{filteredAirdrops.length !== 1 ? 's' : ''} found</span>
                    {(nameFilter || globalSearch || taskTypeFilter || statusFilter) && (
                        <button onClick={() => { setNameFilter(''); setGlobalSearch(''); setTaskTypeFilter(''); setStatusFilter(''); }} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Clear filters</button>
                    )}
                </div>

                {/* Mobile Card List */}
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="animate-pulse bg-[#0f172a]/5 rounded-2xl h-20" />
                    ))
                ) : filteredAirdrops.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-600">
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
                            'New': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                            'Confirmed': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
                            'Potential': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
                            'Verification Check': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                            'Ended': 'bg-gray-500/10 text-gray-400 border-gray-500/20',
                        };
                        const statusStyle = statusColors[airdrop.status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';

                        return (
                            <div
                                key={airdrop.id}
                                className="relative overflow-hidden rounded-2xl bg-[#0f172a]/5 border border-white/10 active:scale-[0.99] transition-all cursor-pointer"
                                onClick={() => window.location.href = `/airdrops/${airdrop.id}`}
                            >
                                {/* Glow accent for new */}
                                {airdrop.status === 'New' && <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/60 to-transparent" />}
                                <div className="p-3 flex items-center gap-3">
                                    {/* Project Icon */}
                                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-lg shrink-0 overflow-hidden border border-white/10 shadow-md">
                                        {airdrop.icon ? <img src={airdrop.icon} alt={airdrop.name} className="w-full h-full object-cover" /> : <span className="text-white font-bold">{airdrop.name[0]}</span>}
                                    </div>
                                    {/* Project Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <span className="font-bold text-sm text-white truncate">{airdrop.name}</span>
                                            {airdrop.status === 'New' && <span className="shrink-0 px-1 py-0.5 rounded text-[9px] bg-blue-600/80 text-white font-bold">NEW</span>}
                                        </div>
                                        {/* Categories */}
                                        <div className="flex flex-wrap gap-1">
                                            {categories.slice(0, 2).map((cat, idx) => (
                                                <span key={idx} className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-gray-700/60 text-gray-300 border border-gray-600/50">{cat.toUpperCase()}</span>
                                            ))}
                                            {categories.length > 2 && <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">+{categories.length - 2}</span>}
                                        </div>
                                        <div className="text-[10px] text-gray-500 mt-0.5">{airdrop.cost && `Cost: ${airdrop.cost}`}{airdrop.cost && airdrop.time && ' · '}{airdrop.time && `Time: ${airdrop.time}`}</div>
                                    </div>
                                    {/* Status + chevron */}
                                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${statusStyle}`}>{airdrop.status?.toUpperCase()}</span>
                                        {airdrop.statusDate && <span className="text-[9px] text-gray-600">{new Date(airdrop.statusDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>}
                                    </div>
                                </div>
                                {/* Admin actions */}
                                {user?.role === 'ULTRA' && (
                                    <div className="px-3 pb-2 flex gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); setEditingProject(airdrop); setShowAddModal(true); }} className="flex-1 py-1 text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors">Edit</button>
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
                <div className="relative overflow-hidden rounded-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-[#0c1628]" />
                    <div className="relative z-10 px-5 py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-wrap">
                            {/* Project Name */}
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-4 w-4 text-blue-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                                </div>
                                <input type="text" placeholder="Project Name" value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} className="pl-9 pr-4 py-2 bg-[#0f172a]/5 border border-white/10 rounded-xl text-sm text-gray-100 placeholder-gray-600 focus:ring-1 focus:ring-blue-500 focus:outline-none w-44" />
                            </div>
                            {/* Global Search */}
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-4 w-4 text-blue-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                                <input type="text" placeholder="Global Search" value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} className="pl-9 pr-4 py-2 bg-[#0f172a]/5 border border-white/10 rounded-xl text-sm text-gray-100 placeholder-gray-600 focus:ring-1 focus:ring-blue-500 focus:outline-none w-44" />
                            </div>
                            {/* Task Type */}
                            <div className="relative">
                                <select value={taskTypeFilter} onChange={(e) => setTaskTypeFilter(e.target.value)} className="appearance-none bg-[#0f172a]/5 border border-white/10 rounded-xl pl-3 pr-8 py-2 text-sm text-gray-300 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer">
                                    <option value="">Task Type: All</option>
                                    {uniqueTaskTypes.map(type => <option key={type} value={type}>{type.toUpperCase()}</option>)}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
                            </div>
                            {/* Status */}
                            <div className="relative">
                                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="appearance-none bg-[#0f172a]/5 border border-white/10 rounded-xl pl-3 pr-8 py-2 text-sm text-gray-300 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer">
                                    <option value="">Status: All</option>
                                    {uniqueStatuses.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
                            </div>
                            {/* Results count */}
                            <span className="text-xs text-gray-600 pl-1">{filteredAirdrops.length} projects</span>
                        </div>
                        {/* Add button */}
                        {user?.role === 'ULTRA' ? (
                            <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-700/25 transition-all active:scale-95 border border-white/10">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                Add Project
                            </button>
                        ) : (
                            <div className="flex items-center justify-center p-2 bg-[#0f172a]/5 rounded-xl border border-white/10 cursor-not-allowed" title="Requires ULTRA role">
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </div>
                        )}
                    </div>
                </div>
                {/* Table */}
                <div className="relative overflow-hidden rounded-2xl border border-white/5">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gradient-to-r from-gray-900 to-[#0c1628] text-xs uppercase text-blue-300/50 font-bold tracking-widest border-b border-white/5">
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
                                            isAdmin={user?.role === 'ULTRA'}
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
                    <div className="bg-gradient-to-r from-gray-900 to-[#0c1628] px-6 py-3 border-t border-white/5 flex justify-between items-center">
                        <span className="text-xs text-gray-500">Showing {filteredAirdrops.length} projects</span>
                        <div className="flex gap-2">
                            <button className="px-4 py-1.5 rounded-xl text-xs font-medium text-gray-400 bg-[#0f172a]/5 border border-white/10 hover:bg-[#0f172a]/10 transition-colors">Previous</button>
                            <button className="px-4 py-1.5 rounded-xl text-xs font-medium text-gray-400 bg-[#0f172a]/5 border border-white/10 hover:bg-[#0f172a]/10 transition-colors">Next</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Suggest Project Modal */}
            {showSuggestModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-[#0f172a] rounded-2xl w-full max-w-xl border border-white/10 shadow-2xl p-6 md:p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">Suggest a Project</h2>
                            <button onClick={() => setShowSuggestModal(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 mb-6">Know a great airdrop project? Suggest it here and we might add it to our list.</p>
                        <form onSubmit={handleSuggestProject} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Project Name *</label>
                                <input required name="name" type="text" className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" placeholder="e.g. ZkSync" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Source / Social Link *</label>
                                <input required name="link" type="url" className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" placeholder="https://twitter.com/..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Description / Reason</label>
                                <textarea name="description" rows={3} className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" placeholder="Why should we add this project?" />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                                <button type="button" onClick={() => setShowSuggestModal(false)} className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-800 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center gap-2">
                                    {isSubmitting ? 'Sending...' : 'Submit Suggestion'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )
            }

            {/* Add/Edit Project Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-[#0f172a] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl p-6 md:p-8 custom-scrollbar">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">
                                {editingProject ? 'Edit Project' : (selectedSuggestion ? 'Audit Suggested Project' : 'Add New Project')}
                            </h2>
                            <button onClick={() => { setShowAddModal(false); setSelectedSuggestion(null); setEditingProject(null); }} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleAddProject} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Project Name *</label>
                                    <input required name="name" type="text" defaultValue={editingProject?.name || selectedSuggestion?.name || ''} className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" placeholder="e.g. Optimism" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Icon URL</label>
                                    <input name="icon" type="url" defaultValue={editingProject?.icon || ''} className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" placeholder="https://example.com/logo.png" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Project Type</label>
                                    <input name="projectType" type="text" defaultValue={editingProject?.projectType || ''} className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" placeholder="e.g. Blockchain Infra" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                                    <select name="status" defaultValue={editingProject?.status || 'New'} className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 appearance-none">
                                        <option value="New">New</option>
                                        <option value="Potential">Potential</option>
                                        <option value="Confirmed">Confirmed</option>
                                        <option value="Verification Check">Verification Check</option>
                                        <option value="Ended">Ended</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Reward Date</label>
                                    <input name="rewardDate" type="text" defaultValue={editingProject?.rewardDate || "TBA"} className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Cost (Number Only)</label>
                                    <div className="flex">
                                        <select
                                            value={currencyType}
                                            onChange={(e) => setCurrencyType(e.target.value)}
                                            className="bg-gray-800 border border-white/10 rounded-l-lg px-3 py-2 text-white focus:outline-none"
                                        >
                                            <option value="$">$</option>
                                            <option value="Rp">Rp</option>
                                        </select>
                                        <input name="cost" type="number" defaultValue={(editingProject?.cost || '').replace(/[^0-9]/g, '') || ''} placeholder="500" className="w-full bg-[#0f172a] border border-l-0 border-white/10 rounded-r-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Time to Complete (Minutes)</label>
                                    <input name="time" type="number" defaultValue={(editingProject?.time || '').replace(/[^0-9]/g, '') || ''} placeholder="e.g. 10" className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Raised</label>
                                    <div className="flex">
                                        <span className="bg-gray-800 border border-white/10 rounded-l-lg px-4 py-2 text-gray-500">$</span>
                                        <input name="raise" type="text" defaultValue={(editingProject?.raise || '').replace(/^\$/, '') || ''} placeholder="e.g. 11M or 11,000,000" className="w-full bg-[#0f172a] border border-l-0 border-white/10 rounded-r-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-white/10 pt-6">
                                <h3 className="text-sm font-bold text-white mb-4">Official Links (Optional)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Website</label>
                                        <input name="linkWeb" type="url" defaultValue={editingProject?.links?.find(l => l.name === 'web')?.url || ''} className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="https://..." />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">X (Twitter)</label>
                                        <input name="linkX" type="url" defaultValue={editingProject?.links?.find(l => l.name === 'x')?.url || ''} className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="https://twitter.com/..." />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">GitHub</label>
                                        <input name="linkGit" type="url" defaultValue={editingProject?.links?.find(l => l.name === 'github')?.url || ''} className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="https://github.com/..." />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Telegram</label>
                                        <input name="linkTele" type="url" defaultValue={editingProject?.links?.find(l => l.name === 'telegram')?.url || ''} className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="https://t.me/..." />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Discord</label>
                                        <input name="linkDiscord" type="url" defaultValue={editingProject?.links?.find(l => l.name === 'discord')?.url || ''} className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="https://discord.gg/..." />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                                <textarea name="description" rows={3} defaultValue={editingProject?.description || selectedSuggestion?.description || ''} className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" placeholder="Instructions or details about the project..." />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                                <button type="button" onClick={() => { setShowAddModal(false); setSelectedSuggestion(null); setEditingProject(null); }} className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-800 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center gap-2">
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
