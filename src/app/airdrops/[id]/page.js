'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { HeroHeader, LoadingState } from '@/components/HeroHeader';
import LoadingImage from '@/components/LoadingImage';

export default function AirdropDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [airdrop, setAirdrop] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [progress, setProgress] = useState([]);
    const [activeTask, setActiveTask] = useState(null);
    const [showAddTask, setShowAddTask] = useState(false);
    const [activeCategory, setActiveCategory] = useState(null);
    const [newSteps, setNewSteps] = useState([{ text: '', link: '', image: '', isPrivate: false }]);
    const [isEditingTask, setIsEditingTask] = useState(false);
    const [fullscreenImage, setFullscreenImage] = useState(null);

    // Telegram Post States
    const [showTelegramModal, setShowTelegramModal] = useState(false);
    const [telegramPreview, setTelegramPreview] = useState(null); // { caption, imageUrl, detailUrl }
    const [telegramLoading, setTelegramLoading] = useState(false);
    const [telegramPosting, setTelegramPosting] = useState(false);
    const [telegramSuccess, setTelegramSuccess] = useState(false);
    const [telegramError, setTelegramError] = useState(null);
    const [customBannerUrl, setCustomBannerUrl] = useState('');
    const [isTogglingVisibility, setIsTogglingVisibility] = useState(false);

    const handleToggleVisibility = async () => {
        setIsTogglingVisibility(true);
        try {
            const res = await fetch(`/api/airdrops/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPublic: !airdrop.isPublic })
            });
            if (res.ok) {
                setAirdrop(prev => ({ ...prev, isPublic: !prev.isPublic, publishStatus: !prev.isPublic ? 'APPROVED' : 'NONE' }));
            } else {
                alert('Failed to update visibility');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsTogglingVisibility(false);
        }
    };

    const [isPublishRequesting, setIsPublishRequesting] = useState(false);

    const handlePublishRequest = async (action) => {
        // action can be 'PENDING', 'APPROVED', 'REJECTED'
        setIsPublishRequesting(true);
        try {
            const res = await fetch(`/api/airdrops/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ publishStatus: action })
            });
            if (res.ok) {
                const updatedAirdrop = await res.json();
                setAirdrop(updatedAirdrop);
            } else {
                alert('Failed to update publish status');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsPublishRequesting(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch User
                const userRes = await fetch('/api/auth/me');
                let currentUser = null;
                if (userRes.ok) {
                    const data = await userRes.json();
                    currentUser = data.user;
                    setUser(currentUser);
                }

                // Fetch Airdrop Detail
                const res = await fetch('/api/airdrops');
                if (res.ok) {
                    const data = await res.json();
                    const found = data.find(a => a.id === id);
                    setAirdrop(found);
                }

                // Fetch Tasks
                const tasksRes = await fetch(`/api/airdrops/${id}/tasks`);
                if (tasksRes.ok) {
                    const tasksData = await tasksRes.json();

                    const now = new Date();
                    const processedTasks = tasksData.map(task => {
                        if (task.status === 'Open' && task.deadline) {
                            const deadlineDate = new Date(task.deadline);
                            deadlineDate.setHours(23, 59, 59, 999);
                            if (now > deadlineDate) {
                                return { ...task, status: 'Closed' };
                            }
                        }
                        return task;
                    });

                    setTasks(processedTasks);
                    if (processedTasks.length > 0) setActiveTask(processedTasks[0]);
                }

                // Fetch Progress if user is logged in
                if (currentUser) {
                    const progRes = await fetch(`/api/airdrops/tasks/progress?airdropId=${id}`);
                    if (progRes.ok) {
                        const progData = await progRes.json();
                        setProgress(progData);
                    }
                }

            } catch (error) {
                console.error('Failed to fetch data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleToggleComplete = async (taskId, currentStatus) => {
        try {
            const res = await fetch(`/api/airdrops/tasks/progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskId, completed: !currentStatus })
            });
            if (res.ok) {
                const updated = await res.json();
                setProgress(prev => {
                    const filtered = prev.filter(p => p.taskId !== taskId);
                    return [...filtered, updated];
                });
            } else {
                alert('Failed to update progress, please upgrade your plan.');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!confirm('Are you sure you want to delete this task?')) return;

        try {
            const res = await fetch(`/api/airdrops/${id}/tasks/${taskId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                const remainingTasks = tasks.filter(t => t.id !== taskId);
                setTasks(remainingTasks);
                if (activeTask?.id === taskId) {
                    setActiveTask(remainingTasks.length > 0 ? remainingTasks[0] : null);
                }
            } else {
                alert('Failed to delete task');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        // Filter out empty steps
        const validSteps = newSteps.filter(s => s.text.trim() !== '' || s.image.trim() !== '' || s.link.trim() !== '');

        const data = {
            title: formData.get('title'),
            description: formData.get('description'),
            category: formData.get('category'),
            deadline: formData.get('deadline'),
            status: 'Open',
            steps: validSteps
        };

        try {
            const res = await fetch(`/api/airdrops/${id}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                const newTask = await res.json();
                setTasks([...tasks, newTask]);
                setShowAddTask(false);
                setActiveTask(newTask);
                setNewSteps([{ text: '', link: '', image: '' }]); // Reset form state
            } else {
                alert('Failed to add task');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleEditTask = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        // Filter out empty steps
        const validSteps = newSteps.filter(s => s.text.trim() !== '' || s.image.trim() !== '' || s.link.trim() !== '');

        const data = {
            title: formData.get('title'),
            description: formData.get('description'),
            category: formData.get('category'),
            deadline: formData.get('deadline'),
            status: formData.get('status'), // Status can be changed in edit
            steps: validSteps
        };

        try {
            const res = await fetch(`/api/airdrops/${id}/tasks/${activeTask.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                const updatedTask = await res.json();
                setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
                setIsEditingTask(false);
                setActiveTask(updatedTask);
            } else {
                alert('Failed to update task');
            }
        } catch (error) {
            console.error(error);
        }
    };

    // ---- Telegram handlers ----
    const handleTelegramPreview = async () => {
        setTelegramLoading(true);
        setTelegramError(null);
        setTelegramSuccess(false);
        setTelegramPreview(null);
        setShowTelegramModal(true);
        try {
            const res = await fetch('/api/airdrops/telegram-post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ airdrop, tasks, action: 'preview' })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to generate preview');
            setTelegramPreview(data);
            setCustomBannerUrl(data.imageUrl || '');
        } catch (err) {
            setTelegramError(err.message);
        } finally {
            setTelegramLoading(false);
        }
    };

    const handleTelegramPost = async () => {
        if (!telegramPreview) return;
        setTelegramPosting(true);
        setTelegramError(null);
        try {
            const res = await fetch('/api/airdrops/telegram-post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    airdrop,
                    tasks,
                    action: 'post',
                    caption: telegramPreview.caption,
                    imageUrl: customBannerUrl || telegramPreview.imageUrl
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error + (data.details ? ': ' + data.details : ''));
            setTelegramSuccess(true);
        } catch (err) {
            setTelegramError(err.message);
        } finally {
            setTelegramPosting(false);
        }
    };

    const closeTelegramModal = () => {
        setShowTelegramModal(false);
        setTelegramPreview(null);
        setTelegramSuccess(false);
        setTelegramError(null);
        setCustomBannerUrl('');
    };
    // ---- End Telegram handlers ----

    if (loading) {
        return (
            <div className="space-y-6">
                <HeroHeader
                    title="Airdrop"
                    badge="Detail"
                    description="Loading project information..."
                    colorTheme="blue"
                    breadcrumbs={[
                        { label: 'Dashboard', href: '/' },
                        { label: 'Airdrops', href: '/airdrops' },
                        { label: '...' }
                    ]}
                />
                <LoadingState message="Decrypting Mission Details..." colorTheme="blue" />
            </div>
        );
    }


    if (!airdrop) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
                <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#0f172a]/50 p-10 text-center backdrop-blur-xl shadow-2xl">
                    <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 via-transparent to-indigo-500/5" />

                    <div className="relative z-10 flex flex-col items-center">
                        {/* Icon Container */}
                        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-[#0f172a] shadow-inner border border-white/5">
                            <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-gray-500/10 to-transparent blur-md"></div>
                            <svg className="h-10 w-10 text-gray-400 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>

                        <h2 className="mb-3 text-2xl font-black text-white tracking-tight">Project Not Found</h2>
                        <p className="mb-8 text-sm text-gray-400 leading-relaxed">
                            The airdrop you're looking for doesn't exist, has been removed, or is currently set to private.
                        </p>

                        <button
                            onClick={() => router.push('/airdrops')}
                            className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#0f172a] px-6 py-3.5 w-full text-sm font-bold text-gray-300 transition-all border border-white/10 hover:border-blue-500/40 hover:text-white"
                        >
                            <span className="relative z-10 flex items-center gap-2 transition-transform group-hover:-translate-x-1">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Back to Airdrops
                            </span>
                            <div className="absolute inset-0 z-0 bg-linear-to-r from-blue-600/10 to-indigo-600/10 opacity-0 transition-opacity group-hover:opacity-100" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
                        {/* ===== HERO CARD ===== */}
            <HeroHeader
                title={airdrop.name}
                badge={airdrop.symbol}
                description={airdrop.projectType || 'Project'}
                colorTheme="blue"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/' },
                    { label: 'Airdrops', href: '/airdrops' },
                    { label: airdrop.name }
                ]}
                actionContent={
                    <div className="flex flex-col items-end gap-2">
                        <div className="w-16 h-16 rounded-xl bg-[#0f172a]/60 border border-blue-500/30 flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(59,130,246,0.3)] backdrop-blur-md">
                            <LoadingImage 
                                src={airdrop.icon} 
                                alt={airdrop.name} 
                                className="w-12 h-12 object-contain" 
                                fallback="/icons/digital-currency.png"
                            />
                        </div>
                        {airdrop.raise && (
                            <div className="flex items-center gap-1.5 bg-[#0a0e1a]/80 px-2 py-1 rounded-lg border border-blue-500/20">
                                <span className="text-blue-400/60 text-[10px] font-bold uppercase tracking-wider">Raised</span>
                                <span className="text-sm font-black text-white">{airdrop.raise}</span>
                            </div>
                        )}
                    </div>
                }
            />

            {/* Links & Status Chips Section */}
            <div className="relative z-10 p-5 mt-4 bg-[#0a0e1a]/80 backdrop-blur-xl border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.05)] rounded-2xl flex flex-col gap-5 group overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none transition-colors" />
                <span className="absolute top-0 left-0 w-16 h-1 bg-linear-to-r from-blue-500 to-transparent" />
                
                {/* Links */}
                {(airdrop.links && airdrop.links !== '[]') && (
                    <div className="flex flex-wrap items-center gap-2">
                        {(() => {
                            try {
                                let links = typeof airdrop.links === 'string' ? JSON.parse(airdrop.links) : airdrop.links;
                                const iconMap = {
                                    'web': <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>,
                                    'x': <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 3.974H5.078z" /></svg>,
                                    'github': <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>,
                                    'telegram': <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.45.9-4.08 2.68-.39.26-.74.39-1.05.38-.34-.01-.98-.19-1.46-.35-.59-.19-1.05-.29-1.01-.61.02-.17.29-.35.81-.54 3.19-1.39 5.32-2.32 6.38-2.76 3.03-1.26 3.66-1.48 4.07-1.48.09 0 .28.02.4.1.1.07.13.18.14.28.01.07.01.18 0 .2z" /></svg>,
                                    'discord': <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" /></svg>
                                };
                                const nameMap = { 'web': 'Website', 'x': 'X', 'github': 'GitHub', 'telegram': 'Telegram', 'discord': 'Discord' };
                                return links.map((link, i) => (
                                    <a href={link.url} target="_blank" rel="noreferrer" key={i}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0f172a]/40 hover:bg-blue-500/10 text-xs font-semibold transition-all border border-blue-500/20 hover:border-blue-500/40 text-blue-200 hover:text-white shadow-[0_0_10px_rgba(59,130,246,0.05)]">
                                        {iconMap[link.name.toLowerCase()]}
                                        {nameMap[link.name.toLowerCase()] || link.name}
                                    </a>
                                ));
                            } catch (e) { return null; }
                        })()}
                    </div>
                )}

                {/* Status Chips & Post to Telegram */}
                <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-blue-500/10">
                    {[
                        { label: 'Reward Type', value: airdrop.rewardType || 'Airdrop', color: 'blue' },
                        { label: 'Status', value: airdrop.status || 'Verification Check', color: airdrop.status === 'New' ? 'indigo' : airdrop.status === 'Confirmed' ? 'emerald' : 'blue' },
                        { label: 'Reward Date', value: airdrop.rewardDate || 'TBA', color: 'slate' },
                    ].map((chip, i) => (
                        <div key={i} className="flex items-center gap-2 bg-[#0a0e1a] border border-blue-500/20 px-3 py-1.5 rounded-lg text-xs shadow-inner">
                            <span className="text-blue-400/60 font-medium uppercase tracking-wider text-[10px]">{chip.label}:</span>
                            <span className="text-blue-100 font-bold">{chip.value}</span>
                        </div>
                    ))}

                    <div className="flex items-center gap-2 bg-[#0a0e1a] border border-blue-500/20 px-3 py-1.5 rounded-lg text-xs shadow-inner">
                        <span className="text-blue-400/60 font-medium uppercase tracking-wider text-[10px]">Visibility:</span>
                        <span className={airdrop.isPublic ? "text-green-400 font-bold" : "text-gray-400 font-bold"}>
                            {airdrop.isPublic ? 'PUBLIC' : 'PRIVATE'}
                        </span>
                        {!airdrop.isPublic && airdrop.publishStatus === 'PENDING' && (
                            <span className="ml-2 text-yellow-500 font-bold tracking-wider px-1.5 py-0.5 rounded text-[9px] bg-yellow-500/10 border border-yellow-500/20">
                                PENDING
                            </span>
                        )}
                    </div>

                    {/* Admin Actions */}
                    <div className="flex flex-wrap gap-2 ml-auto">
                        {/* Publish/Unpublish Button - ULTRA only */}
                        {user?.role === 'ULTRA' && airdrop.publishStatus !== 'PENDING' && (
                            <button
                                onClick={handleToggleVisibility}
                                disabled={isTogglingVisibility}
                                className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all border border-blue-500/30 bg-[#0f172a] hover:bg-blue-500/10 text-gray-300 hover:text-white disabled:opacity-50"
                            >
                                {isTogglingVisibility ? 'Updating...' : (airdrop.isPublic ? 'Unpublish' : 'Publish')}
                            </button>
                        )}

                        {/* Owner Request Publish Buttons */}
                        {user?.id === airdrop.userId && !airdrop.isPublic && user?.role !== 'ULTRA' && (
                            <>
                                {(airdrop.publishStatus === 'NONE' || airdrop.publishStatus === 'REJECTED') && (
                                    <button
                                        onClick={() => handlePublishRequest('PENDING')}
                                        disabled={isPublishRequesting}
                                        className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all border border-blue-500/30 bg-linear-to-r from-blue-600/20 to-indigo-600/20 hover:from-blue-600/40 hover:to-indigo-600/40 text-blue-300 hover:text-white disabled:opacity-50"
                                    >
                                        {isPublishRequesting ? 'Requesting...' : 'Request Publish'}
                                    </button>
                                )}
                                {airdrop.publishStatus === 'PENDING' && (
                                    <button disabled className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 opacity-80 cursor-not-allowed">
                                        Pending Validation...
                                    </button>
                                )}
                            </>
                        )}

                        {/* ULTRA Accept/Decline Buttons for PENDING */}
                        {user?.role === 'ULTRA' && !airdrop.isPublic && airdrop.publishStatus === 'PENDING' && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handlePublishRequest('APPROVED')}
                                    disabled={isPublishRequesting}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-green-500/30 bg-green-500/10 hover:bg-green-500/20 text-green-400 hover:text-green-300 disabled:opacity-50"
                                >
                                    Accept
                                </button>
                                <button
                                    onClick={() => handlePublishRequest('REJECTED')}
                                    disabled={isPublishRequesting}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 disabled:opacity-50"
                                >
                                    Decline
                                </button>
                            </div>
                        )}

                        {/* Post to Telegram Button */}
                        {user?.role === 'ULTRA' && airdrop.isPublic && (
                            <button
                                onClick={handleTelegramPreview}
                                disabled={telegramLoading}
                                className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all border border-blue-500/30 bg-linear-to-r from-blue-600/30 to-indigo-600/30 hover:from-blue-600/50 hover:to-indigo-600/50 text-white shadow-lg shadow-blue-500/20 disabled:opacity-50"
                            >
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.45.9-4.08 2.68-.39.26-.74.39-1.05.38-.34-.01-.98-.19-1.46-.35-.59-.19-1.05-.29-1.01-.61.02-.17.29-.35.81-.54 3.19-1.39 5.32-2.32 6.38-2.76 3.03-1.26 3.66-1.48 4.07-1.48.09 0 .28.02.4.1.1.07.13.18.14.28.01.07.01.18 0 .2z" />
                                </svg>
                                {telegramLoading ? 'Loading...' : 'Telegram'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Description */}
                {airdrop.description && (
                    <div className="relative z-10 pt-4 border-t border-blue-500/10">
                        <h3 className="text-xs font-bold text-blue-400/80 uppercase tracking-widest mb-2">Instructions</h3>
                        <p className="text-blue-100/70 text-sm leading-relaxed max-w-5xl">{airdrop.description}</p>
                    </div>
                )}
            </div>
{/* Login / Upgrade Banners */}
            {!user && (
                <div className="relative overflow-hidden rounded-2xl">
                    <div className="absolute inset-0 bg-linear-to-br from-[#070d1f] to-[#0c1628] border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.05)]" />
                    <div className="relative z-10 p-8 text-center flex flex-col items-center">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        </div>
                        <h3 className="text-xl font-black text-white mb-2">Login to Track Your Progress</h3>
                        <p className="text-gray-500 text-sm max-w-md">You must be logged in to track completion and access task progress.</p>
                    </div>
                </div>
            )}
            {user && user.role === 'MEMBER' && (
                <div className="relative overflow-hidden rounded-2xl">
                    <div className="absolute inset-0 bg-linear-to-br from-[#070d1f] to-[#1a1040] border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.05)]" />
                    <div className="relative z-10 p-8 text-center flex flex-col items-center">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                        </div>
                        <h3 className="text-xl font-black text-white mb-2">Upgrade to Track Progress</h3>
                        <p className="text-gray-500 text-sm max-w-md">Upgrade to PRO or ULTRA to unlock task completion tracking.</p>
                    </div>
                </div>
            )}

            {/* ===== TASK TRACKER ===== */}
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex flex-col lg:flex-row gap-6 w-full">
                    {/* Left Pane: Task List */}
                    <div className="w-full lg:w-1/3 flex flex-col gap-4">
                        {/* Categories / Filters */}
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            <span
                                onClick={() => setActiveCategory(null)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer transition-colors ${!activeCategory ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]' : 'bg-[#0f172a]/50 text-gray-400 hover:text-gray-300 border border-white/5 hover:border-white/10 hover:bg-[#0f172a]/80'}`}
                            >
                                All
                            </span>
                            {Array.from(new Set(tasks.map(t => t.category))).map(cat => (
                                <span
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer transition-colors ${activeCategory === cat ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]' : 'bg-[#0f172a]/50 text-gray-400 hover:text-gray-300 border border-white/5 hover:border-white/10 hover:bg-[#0f172a]/80'}`}
                                >
                                    {cat}
                                </span>
                            ))}
                        </div>

                        {/* Task Cards */}
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {tasks.filter(t => !activeCategory || t.category === activeCategory).map(task => {
                                const isCompleted = progress.find(p => p.taskId === task.id)?.completed;
                                const isActive = activeTask?.id === task.id;

                                return (
                                    <div
                                        key={task.id}
                                        onClick={() => setActiveTask(task)}
                                        className={`p-5 rounded-2xl border cursor-pointer transition-all ${isActive
                                            ? 'bg-[#0a0e1a]/80 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)] text-white backdrop-blur-md'
                                            : 'bg-[#0f172a]/40 border-white/5 hover:border-blue-500/20 text-gray-400 hover:text-gray-200 backdrop-blur-sm'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <h4 className={`font-bold text-lg leading-tight ${isActive ? 'text-white' : 'text-gray-200'} max-w-[80%]`}>{task.title}</h4>
                                            {user && (user.role === 'PRO' || user.role === 'ULTRA') && isCompleted && (
                                                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)] shrink-0">Completed</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm mt-6">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${task.status === 'Open' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                <span className="text-gray-400">{task.status}</span>
                                            </div>
                                            {task.deadline && (
                                                <div className="flex items-center gap-2 text-gray-400">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                    <span>Available {task.status === 'Closed' ? 'from' : 'until'} {new Date(task.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                </div>
                                            )}
                                            {!task.deadline && (
                                                <div className="flex items-center gap-2 text-gray-400">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                    <span>No Deadline</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-4 flex items-center justify-between">
                                            <span className="px-3 py-1 rounded-md bg-[#0f172a] text-xs font-semibold text-blue-400/80 border border-blue-500/20">{task.category}</span>
                                            {user && user.role === 'ULTRA' && airdrop.isPublic && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        // Convert the single task into an array to pass to the telegram API
                                                        setActiveTask(task);
                                                        setTelegramPreview(null);
                                                        setTelegramSuccess(false);
                                                        setTelegramError(null);
                                                        setTelegramLoading(true);
                                                        setShowTelegramModal(true);
                                                        
                                                        fetch('/api/airdrops/telegram-post', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ airdrop, tasks: [task], action: 'preview' })
                                                        })
                                                            .then(r => r.json())
                                                            .then(data => {
                                                                setTelegramLoading(false);
                                                                if (data.error) setTelegramError(data.error);
                                                                else setTelegramPreview(data);
                                                            })
                                                            .catch(e => {
                                                                setTelegramLoading(false);
                                                                setTelegramError('Failed to generate preview');
                                                            });
                                                    }}
                                                    className="flex items-center gap-1.5 px-3 py-1 bg-[#229ED9]/10 hover:bg-[#229ED9]/20 text-[#229ED9] text-[10px] font-bold uppercase tracking-wider rounded transition-colors border border-[#229ED9]/30"
                                                >
                                                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.45.9-4.08 2.68-.39.26-.74.39-1.05.38-.34-.01-.98-.19-1.46-.35-.59-.19-1.05-.29-1.01-.61.02-.17.29-.35.81-.54 3.19-1.39 5.32-2.32 6.38-2.76 3.03-1.26 3.66-1.48 4.07-1.48.09 0 .28.02.4.1.1.07.13.18.14.28.01.07.01.18 0 .2z" />
                                                    </svg>
                                                    Post
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {tasks.length === 0 && (
                                <div className="text-center py-8 text-gray-500">No tasks available for this project.</div>
                            )}
                        </div>
                        {user && (user.role === 'ULTRA' || airdrop?.userId === user.id) && (
                            <button
                                onClick={() => setShowAddTask(true)}
                                className="mt-4 w-full py-3 rounded-xl border-2 border-dashed border-blue-500/30 bg-[#0f172a]/30 text-blue-400/70 font-bold hover:border-blue-500/60 hover:text-blue-300 hover:bg-blue-500/10 shadow-[0_0_10px_rgba(59,130,246,0.05)_inset] transition-colors flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                Add New Task
                            </button>
                        )}
                    </div>

                    {/* Right Pane: Task Detail & Progress */}
                    <div className="w-full lg:w-2/3">
                        {/* Progress Header */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 px-2">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="font-bold text-white text-sm">Progress</span>
                                <div className="flex gap-2 text-blue-500">
                                    {tasks.map((t, idx) => {
                                        const isDone = progress.find(p => p.taskId === t.id)?.completed;
                                        return (
                                            <div key={idx} className="flex items-center">
                                                <div className={`w-3 h-3 rounded-full ${isDone ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'bg-[#0f172a]/80 border border-white/5 shadow-inner'}`}></div>
                                                {idx < tasks.length - 1 && <div className="w-4 h-px border-t border-dashed border-gray-600 ml-2"></div>}
                                            </div>
                                        );
                                    })}
                                </div>
                                <span className="text-xs font-medium text-gray-400 bg-gray-800 px-2 py-0.5 rounded ml-2">
                                    {progress.filter(p => p.completed && tasks.some(t => t.id === p.taskId)).length}/{tasks.length} Steps Done
                                </span>
                            </div>
                            {user && (user.role === 'PRO' || user.role === 'ULTRA') && (
                                <div className="flex gap-2 mt-4 sm:mt-0">
                                    {/* Desktop Buttons */}
                                    <div className="hidden sm:flex gap-2">
                                        <button className="px-4 py-1.5 bg-[#0f172a]/60 border border-white/5 hover:border-blue-500/30 text-gray-400 hover:text-blue-300 text-sm font-bold rounded-lg hover:bg-blue-500/10 transition-colors">New</button>
                                        <button className="px-4 py-1.5 bg-[#0f172a]/60 border border-white/5 hover:border-blue-500/30 text-gray-400 hover:text-blue-300 text-sm font-bold rounded-lg hover:bg-blue-500/10 transition-colors">To Do</button>
                                        <button className="px-4 py-1.5 bg-[#0f172a]/40 border border-white/5 text-gray-500 hover:text-gray-300 text-sm font-bold rounded-lg hover:bg-gray-800/60 transition-colors">Completed</button>
                                    </div>
                                    {/* Mobile Dropdown */}
                                    <div className="sm:hidden w-full">
                                        <select className="w-full px-4 py-1.5 bg-gray-800 text-gray-300 text-sm font-medium rounded-lg transition-colors border border-gray-700 focus:outline-none focus:border-blue-500 appearance-none">
                                            <option value="all">All Status</option>
                                            <option value="new">New</option>
                                            <option value="todo">To Do</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Active Task Detail Box */}
                        <div className="bg-[#0a0e1a] rounded-3xl border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.05)] p-8 min-h-[500px] relative overflow-hidden">
                            {showAddTask && user && (user.role === 'ULTRA' || airdrop?.userId === user.id) ? (
                                <div className="max-w-xl mx-auto">
                                    <div className="flex items-center justify-between mb-8">
                                        <h2 className="text-2xl font-bold text-white">Create New Task</h2>
                                        <button onClick={() => setShowAddTask(false)} className="text-gray-500 hover:text-white transition-colors">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                    <form onSubmit={handleAddTask} className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">Task Title</label>
                                            <input required name="title" type="text" className="w-full bg-[#0f172a]/60 border border-white/10 focus:border-blue-500 focus:bg-[#0a0e1a]/80 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-lg px-4 py-3 text-white focus:outline-none" placeholder="e.g. Connect your social accounts" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">Category / Tab</label>
                                            <input required name="category" type="text" className="w-full bg-[#0f172a]/60 border border-white/10 focus:border-blue-500 focus:bg-[#0a0e1a]/80 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-lg px-4 py-3 text-white focus:outline-none" placeholder="e.g. Social, DePIN, Mint NFT" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                                            <textarea required name="description" rows={4} className="w-full bg-[#0f172a]/60 border border-white/10 focus:border-blue-500 focus:bg-[#0a0e1a]/80 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-lg px-4 py-3 text-white focus:outline-none" placeholder="Provide instructions for the task..." />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">Deadline (Optional)</label>
                                            <input name="deadline" type="date" className="w-full bg-[#0f172a]/60 border border-white/10 focus:border-blue-500 focus:bg-[#0a0e1a]/80 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-lg px-4 py-3 text-gray-300 focus:outline-none scheme-dark" />
                                        </div>

                                        <div className="pt-4 border-t border-gray-800">
                                            <div className="flex justify-between items-center mb-4">
                                                <label className="block text-sm font-medium text-gray-400">Task Steps</label>
                                                <button
                                                    type="button"
                                                    onClick={() => setNewSteps([...newSteps, { text: '', link: '', image: '', isPrivate: false }])}
                                                    className="text-xs bg-gray-800 hover:bg-gray-700 text-blue-400 px-3 py-1.5 rounded-lg transition-colors border border-gray-700"
                                                >
                                                    + Add Step
                                                </button>
                                            </div>
                                            <div className="space-y-6">
                                                {newSteps.map((step, index) => (
                                                    <div key={index} className="bg-[#0f172a]/40 border border-white/5 hover:border-white/10 rounded-xl p-4 relative group">
                                                        {newSteps.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setNewSteps(newSteps.filter((_, i) => i !== index))}
                                                                className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                            >
                                                                ×
                                                            </button>
                                                        )}
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <div className="w-6 h-6 rounded-full bg-blue-900/50 text-blue-400 flex items-center justify-center text-xs font-bold border border-blue-500/30">
                                                                {index + 1}
                                                            </div>
                                                            <span className="text-sm font-medium text-gray-300">Step Detail</span>
                                                            <label className="flex items-center gap-2 ml-auto cursor-pointer group/label">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={step.isPrivate || false}
                                                                    onChange={(e) => {
                                                                        const updated = [...newSteps];
                                                                        updated[index].isPrivate = e.target.checked;
                                                                        setNewSteps(updated);
                                                                    }}
                                                                    className="w-4 h-4 rounded-sm bg-gray-900 border-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
                                                                />
                                                                <span className="text-xs font-medium text-gray-400 group-hover/label:text-gray-300">Private Step (Only me)</span>
                                                            </label>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={step.text}
                                                            onChange={(e) => {
                                                                const updated = [...newSteps];
                                                                updated[index].text = e.target.value;
                                                                setNewSteps(updated);
                                                            }}
                                                            className="w-full bg-[#0a0e1a] border border-white/10 focus:border-blue-500 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 mb-3"
                                                            placeholder="Instruction details..."
                                                        />
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <input
                                                                type="url"
                                                                value={step.image}
                                                                onChange={(e) => {
                                                                    const updated = [...newSteps];
                                                                    updated[index].image = e.target.value;
                                                                    setNewSteps(updated);
                                                                }}
                                                                className="w-full bg-[#0a0e1a] border border-white/10 focus:border-blue-500 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                                                                placeholder="Optional Image URL"
                                                            />
                                                            <input
                                                                type="url"
                                                                value={step.link}
                                                                onChange={(e) => {
                                                                    const updated = [...newSteps];
                                                                    updated[index].link = e.target.value;
                                                                    setNewSteps(updated);
                                                                }}
                                                                className="w-full bg-[#0a0e1a] border border-white/10 focus:border-blue-500 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                                                                placeholder="Optional Link URL"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-lg shadow-blue-500/20">
                                            Create Task
                                        </button>
                                    </form>
                                </div>
                            ) : isEditingTask ? (
                                <div className="max-w-xl mx-auto">
                                    <div className="flex items-center justify-between mb-8">
                                        <h2 className="text-2xl font-bold text-white">Edit Task</h2>
                                        <button onClick={() => setIsEditingTask(false)} className="text-gray-500 hover:text-white transition-colors">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                    <form onSubmit={handleEditTask} className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">Task Title</label>
                                            <input required name="title" type="text" defaultValue={activeTask.title} className="w-full bg-[#0f172a]/60 border border-white/10 focus:border-blue-500 focus:bg-[#0a0e1a]/80 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-lg px-4 py-3 text-white focus:outline-none" placeholder="e.g. Connect your social accounts" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">Category / Tab</label>
                                            <input required name="category" type="text" defaultValue={activeTask.category} className="w-full bg-[#0f172a]/60 border border-white/10 focus:border-blue-500 focus:bg-[#0a0e1a]/80 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-lg px-4 py-3 text-white focus:outline-none" placeholder="e.g. Social, DePIN, Mint NFT" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                                            <select name="status" defaultValue={activeTask.status} className="w-full bg-[#0f172a]/60 border border-white/10 focus:border-blue-500 focus:bg-[#0a0e1a]/80 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-lg px-4 py-3 text-white focus:outline-none appearance-none">
                                                <option value="Open">Open</option>
                                                <option value="Closed">Closed</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                                            <textarea required name="description" rows={4} defaultValue={activeTask.description} className="w-full bg-[#0f172a]/60 border border-white/10 focus:border-blue-500 focus:bg-[#0a0e1a]/80 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-lg px-4 py-3 text-white focus:outline-none" placeholder="Provide instructions for the task..." />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">Deadline (Optional)</label>
                                            <input name="deadline" type="date" defaultValue={activeTask.deadline ? activeTask.deadline.split('T')[0] : ''} className="w-full bg-[#0f172a]/60 border border-white/10 focus:border-blue-500 focus:bg-[#0a0e1a]/80 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-lg px-4 py-3 text-gray-300 focus:outline-none scheme-dark" />
                                        </div>

                                        <div className="pt-4 border-t border-gray-800">
                                            <div className="flex justify-between items-center mb-4">
                                                <label className="block text-sm font-medium text-gray-400">Task Steps</label>
                                                <button
                                                    type="button"
                                                    onClick={() => setNewSteps([...newSteps, { text: '', link: '', image: '', isPrivate: false }])}
                                                    className="text-xs bg-gray-800 hover:bg-gray-700 text-blue-400 px-3 py-1.5 rounded-lg transition-colors border border-gray-700"
                                                >
                                                    + Add Step
                                                </button>
                                            </div>
                                            <div className="space-y-6">
                                                {newSteps.map((step, index) => (
                                                    <div key={index} className="bg-[#0f172a]/40 border border-white/5 hover:border-white/10 rounded-xl p-4 relative group">
                                                        {newSteps.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setNewSteps(newSteps.filter((_, i) => i !== index))}
                                                                className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                            >
                                                                ×
                                                            </button>
                                                        )}
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <div className="w-6 h-6 rounded-full bg-blue-900/50 text-blue-400 flex items-center justify-center text-xs font-bold border border-blue-500/30">
                                                                {index + 1}
                                                            </div>
                                                            <span className="text-sm font-medium text-gray-300">Step Detail</span>
                                                            <label className="flex items-center gap-2 ml-auto cursor-pointer group/label">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={step.isPrivate || false}
                                                                    onChange={(e) => {
                                                                        const updated = [...newSteps];
                                                                        updated[index].isPrivate = e.target.checked;
                                                                        setNewSteps(updated);
                                                                    }}
                                                                    className="w-4 h-4 rounded-sm bg-gray-900 border-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
                                                                />
                                                                <span className="text-xs font-medium text-gray-400 group-hover/label:text-gray-300">Private Step (Only me)</span>
                                                            </label>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={step.text}
                                                            onChange={(e) => {
                                                                const updated = [...newSteps];
                                                                updated[index].text = e.target.value;
                                                                setNewSteps(updated);
                                                            }}
                                                            className="w-full bg-[#0a0e1a] border border-white/10 focus:border-blue-500 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 mb-3"
                                                            placeholder="Instruction details..."
                                                        />
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <input
                                                                type="url"
                                                                value={step.image}
                                                                onChange={(e) => {
                                                                    const updated = [...newSteps];
                                                                    updated[index].image = e.target.value;
                                                                    setNewSteps(updated);
                                                                }}
                                                                className="w-full bg-[#0a0e1a] border border-white/10 focus:border-blue-500 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                                                                placeholder="Optional Image URL"
                                                            />
                                                            <input
                                                                type="url"
                                                                value={step.link}
                                                                onChange={(e) => {
                                                                    const updated = [...newSteps];
                                                                    updated[index].link = e.target.value;
                                                                    setNewSteps(updated);
                                                                }}
                                                                className="w-full bg-[#0a0e1a] border border-white/10 focus:border-blue-500 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                                                                placeholder="Optional Link URL"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <button type="submit" className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors shadow-lg shadow-green-500/20">
                                            Save Changes
                                        </button>
                                    </form>
                                </div>
                            ) : activeTask ? (
                                <>
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                                        <h2 className="text-2xl font-bold text-gray-300">{activeTask.title}</h2>
                                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                                <span className={`px-3 py-1.5 rounded ${activeTask.status === 'Closed' ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'} text-xs font-bold border ${activeTask.status === 'Closed' ? 'border-red-900/50' : 'border-green-900/50'}`}>
                                                    {activeTask.status}
                                                </span>
                                                {user && (user.role === 'PRO' || user.role === 'ULTRA') && (
                                                    <button
                                                        onClick={() => handleToggleComplete(activeTask.id, progress.find(p => p.taskId === activeTask.id)?.completed)}
                                                        className={`flex items-center gap-2 group ${activeTask.status === 'Closed' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        disabled={activeTask.status === 'Closed'}
                                                    >
                                                        <span className="text-gray-300 font-medium text-sm">Completed</span>
                                                        <div className={`w-10 h-6 rounded-full p-1 transition-colors ${progress.find(p => p.taskId === activeTask.id)?.completed ? 'bg-blue-600' : 'bg-[#0f172a]/80 border border-white/5 shadow-inner'}`}>
                                                            <div className={`w-4 h-4 bg-[#0f172a] rounded-full transition-transform ${progress.find(p => p.taskId === activeTask.id)?.completed ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                                        </div>
                                                    </button>
                                                )}
                                            </div>
                                            {user && (user.role === 'ULTRA' || airdrop?.userId === user.id) && (
                                                <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                                    <button
                                                        onClick={() => {
                                                            setNewSteps(activeTask.steps && activeTask.steps.length > 0 ? activeTask.steps : [{ text: '', link: '', image: '', isPrivate: false }]);
                                                            setIsEditingTask(true);
                                                        }}
                                                        className="px-3 py-1.5 bg-blue-900/40 hover:bg-blue-800 text-blue-400 text-xs font-bold rounded-lg transition-colors border border-blue-900/50 flex items-center gap-1"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteTask(activeTask.id)}
                                                        className="px-3 py-1.5 bg-red-900/40 hover:bg-red-800 text-red-400 text-xs font-bold rounded-lg transition-colors border border-red-900/50 flex items-center gap-1"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="prose prose-invert max-w-none text-gray-400 text-sm leading-relaxed mb-8 whitespace-pre-line">
                                        {activeTask.description}
                                    </div>

                                    {/* Dynamic Task Steps */}
                                    {activeTask.steps && Array.isArray(activeTask.steps) && activeTask.steps.length > 0 && (
                                        <div className="space-y-12">
                                            {activeTask.steps.map((step, index) => (
                                                <div key={index} className="relative">
                                                    <div className="flex gap-4">
                                                        <div className="flex flex-col items-center">
                                                            <div className={`w-8 h-8 rounded-full ${step.isPrivate ? 'bg-red-900/30 text-red-500 border-red-500/30' : 'bg-blue-900/30 text-blue-400 border-blue-500/30'} flex items-center justify-center text-sm font-bold border z-10 shrink-0`}>
                                                                {step.isPrivate ? (
                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                                                ) : (
                                                                    index + 1
                                                                )}
                                                            </div>
                                                            {index < activeTask.steps.length - 1 && (
                                                                <div className="w-px h-full bg-blue-500/20 mt-2"></div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 pb-2">
                                                            {step.isPrivate && (
                                                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20 mb-2 uppercase tracking-wide">
                                                                    Private Step
                                                                </span>
                                                            )}
                                                            <p className={`${step.isPrivate ? 'text-gray-400' : 'text-gray-300'} mb-4`}>{step.text}</p>
                                                            {step.image && (
                                                                <div
                                                                    className="rounded-xl overflow-hidden border border-blue-500/20 bg-[#0f172a]/40 shadow-[0_0_15px_rgba(59,130,246,0.05)] w-full max-w-4xl mt-4 mb-4 cursor-pointer hover:border-blue-500/50 transition-colors group relative"
                                                                    onClick={() => setFullscreenImage(step.image)}
                                                                >
                                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                                                                    </div>
                                                                    <img src={step.image} alt={`Step ${index + 1} illustration`} className="w-full h-auto object-contain max-h-[400px]" />
                                                                </div>
                                                            )}
                                                            {step.link && (
                                                                <a
                                                                    href={step.link}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-lg text-sm font-medium transition-colors border border-blue-500/20 mt-2"
                                                                >
                                                                    Open Link
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                                    <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                    <p>Select a task from the list to view its details</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Fullscreen Image Modal */}
                {fullscreenImage && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 transition-opacity"
                        onClick={() => setFullscreenImage(null)}
                    >
                        <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex flex-col items-center justify-center">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setFullscreenImage(null);
                                }}
                                className="absolute top-4 right-4 text-white hover:text-gray-300 bg-gray-900/50 hover:bg-gray-900 p-2 rounded-full transition-colors z-50 backdrop-blur-md"
                            >
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                            <figure className="w-full h-full flex flex-col items-center justify-center">
                                <img
                                    src={fullscreenImage}
                                    alt="Fullscreen task illustration"
                                    className="max-w-full max-h-[calc(90vh-40px)] object-contain rounded-lg shadow-2xl"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </figure>
                        </div>
                    </div>
                )}

                {/* ===== TELEGRAM POST MODAL ===== */}
                {showTelegramModal && (
                    <div
                        className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        onClick={(e) => { if (e.target === e.currentTarget) closeTelegramModal(); }}
                    >
                        <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-linear-to-br from-[#0a0f1e] via-[#0d1b3e] to-[#070d1f] shadow-2xl shadow-blue-900/30">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
                                        <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.45.9-4.08 2.68-.39.26-.74.39-1.05.38-.34-.01-.98-.19-1.46-.35-.59-.19-1.05-.29-1.01-.61.02-.17.29-.35.81-.54 3.19-1.39 5.32-2.32 6.38-2.76 3.03-1.26 3.66-1.48 4.07-1.48.09 0 .28.02.4.1.1.07.13.18.14.28.01.07.01.18 0 .2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-base">Post to Telegram</h3>
                                        <p className="text-gray-500 text-xs">Preview &amp; send to your channel</p>
                                    </div>
                                </div>
                                <button onClick={closeTelegramModal} className="text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <div className="px-6 py-5 space-y-5">
                                {/* Loading state */}
                                {telegramLoading && (
                                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                                        <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                                        <div className="text-center">
                                            <p className="text-white font-semibold text-sm">Generating Caption...</p>
                                            <p className="text-gray-500 text-xs mt-1">Groq AI is crafting your post</p>
                                        </div>
                                    </div>
                                )}

                                {/* Success state */}
                                {telegramSuccess && (
                                    <div className="flex flex-col items-center justify-center py-10 gap-4">
                                        <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                                            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-white font-bold text-lg">Posted Successfully!</p>
                                            <p className="text-gray-400 text-sm mt-1">Your message has been sent to the Telegram channel.</p>
                                        </div>
                                        <button onClick={closeTelegramModal} className="mt-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors">
                                            Close
                                        </button>
                                    </div>
                                )}

                                {/* Error state */}
                                {telegramError && !telegramLoading && (
                                    <div className="flex items-start gap-3 p-4 rounded-xl bg-red-900/20 border border-red-500/30">
                                        <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <div>
                                            <p className="text-red-400 font-semibold text-sm">Error</p>
                                            <p className="text-red-300/70 text-xs mt-0.5">{telegramError}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Preview content */}
                                {telegramPreview && !telegramSuccess && (
                                    <>
                                        {/* Banner Image */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Banner Image</label>
                                            <div className="flex gap-2 mb-3">
                                                <input
                                                    type="url"
                                                    value={customBannerUrl}
                                                    onChange={(e) => setCustomBannerUrl(e.target.value)}
                                                    placeholder="Paste image URL or leave empty for no image"
                                                    className="flex-1 bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                                                />
                                            </div>
                                            {customBannerUrl && (
                                                <div className="rounded-xl overflow-hidden border border-gray-700/50 bg-gray-900/50">
                                                    <img
                                                        src={customBannerUrl}
                                                        alt="Banner preview"
                                                        className="w-full h-44 object-cover"
                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Caption Preview */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">Caption Preview</label>
                                                <span className="text-xs text-blue-400/60">Groq AI · MarkdownV2</span>
                                            </div>
                                            {/* Telegram-style preview box */}
                                            <div className="relative rounded-2xl overflow-hidden">
                                                <div className="absolute inset-0 bg-[#17212b]" />
                                                <div className="relative p-4">
                                                    <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/5">
                                                        {telegramPreview.channelInfo?.photoUrl ? (
                                                            <img src={telegramPreview.channelInfo.photoUrl} alt="Channel Avatar" className="w-8 h-8 rounded-full object-cover" />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">
                                                                {telegramPreview.channelInfo?.title ? telegramPreview.channelInfo.title.substring(0, 2).toUpperCase() : 'CH'}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="text-white text-xs font-semibold">
                                                                {telegramPreview.channelInfo?.title || 'Your Channel'}
                                                            </p>
                                                            <p className="text-gray-500 text-[10px]">Just now</p>
                                                        </div>
                                                    </div>
                                                    <div
                                                        className="text-gray-200 text-[13px] leading-relaxed wrap-break-word whitespace-pre-wrap
                                                               [&>a]:text-[#53a6e4] [&>a]:hover:underline
                                                               [&>b]:font-bold [&>i]:italic [&>code]:font-mono [&>code]:bg-black/30 [&>code]:px-1 [&>code]:rounded"
                                                        dangerouslySetInnerHTML={{ __html: telegramPreview.caption }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-3 pt-2">
                                            <button
                                                onClick={closeTelegramModal}
                                                className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 font-semibold text-sm hover:bg-gray-800 hover:text-white transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleTelegramPost}
                                                disabled={telegramPosting}
                                                className="flex-1 py-3 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {telegramPosting ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        Sending...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.45.9-4.08 2.68-.39.26-.74.39-1.05.38-.34-.01-.98-.19-1.46-.35-.59-.19-1.05-.29-1.01-.61.02-.17.29-.35.81-.54 3.19-1.39 5.32-2.32 6.38-2.76 3.03-1.26 3.66-1.48 4.07-1.48.09 0 .28.02.4.1.1.07.13.18.14.28.01.07.01.18 0 .2z" />
                                                        </svg>
                                                        Send to Channel
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
