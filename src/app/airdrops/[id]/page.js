'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

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
 const [newSteps, setNewSteps] = useState([{ text: '', link: '', image: '' }]);
 const [isEditingTask, setIsEditingTask] = useState(false);
 const [fullscreenImage, setFullscreenImage] = useState(null);

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

 if (loading) {
 return (
 <div className="flex items-center justify-center min-h-[400px]">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
 </div>
 );
 }


 if (!airdrop) {
 return (
 <div className="p-8 text-center">
 <h2 className="text-2xl font-bold text-white">Project not found</h2>
 <button
 onClick={() => router.back()}
 className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
 >
 Back to List
 </button>
 </div>
 );
 }

 return (
 <div className="space-y-6">
 {/* ===== HERO CARD ===== */}
 <div className="relative overflow-hidden rounded-3xl">
 {/* Background */}
 <div className="absolute inset-0 bg-gradient-to-br from-[#070d1f] via-[#0d1b3e] to-[#0a0f1e]" />
 <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-blue-600/8 blur-3xl pointer-events-none" />
 <div className="absolute -bottom-20 -left-10 w-64 h-64 rounded-full bg-indigo-600/8 blur-3xl pointer-events-none" />
 <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

 {/* Breadcrumb */}
 <nav className="relative z-10 flex text-xs text-blue-300/50 px-8 pt-6 gap-2 items-center">
 <a href="/" className="hover:text-blue-300 transition-colors flex items-center gap-1">
 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
 Dashboard
 </a>
 <svg className="w-3 h-3 text-blue-400/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
 <a href="/airdrops" className="hover:text-blue-300 transition-colors">Airdrops</a>
 <svg className="w-3 h-3 text-blue-400/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
 <span className="text-blue-200 font-semibold">{airdrop.name}</span>
 </nav>

 {/* Identity */}
 <div className="relative z-10 px-8 py-8 flex flex-col sm:flex-row items-center sm:items-start gap-8">
 {/* Avatar */}
 <div className="relative shrink-0">
 <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/30 to-indigo-600/30 blur-md" />
 <div className="relative w-24 h-24 rounded-2xl bg-[#0f172a]/10 border border-white/20 flex items-center justify-center overflow-hidden backdrop-blur-sm">
 {airdrop.icon
 ? <img src={airdrop.icon} alt={airdrop.name} className="w-16 h-16 object-contain" />
 : <span className="text-3xl font-black text-white">{airdrop.name[0]}</span>
 }
 </div>
 </div>

 {/* Info */}
 <div className="flex-1 text-center sm:text-left">
 <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-1">
 <h1 className="text-3xl font-black text-white tracking-tight">{airdrop.name}</h1>
 {airdrop.symbol && <span className="text-blue-400/60 font-semibold text-sm">{airdrop.symbol}</span>}
 </div>
 <div className="text-blue-400 text-sm font-medium mb-5">{airdrop.projectType || 'Project'}</div>

 {/* Links */}
 <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
 {airdrop.links ? (() => {
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
 className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0f172a]/5 hover:bg-[#0f172a]/10 text-sm font-medium transition-all border border-white/10 hover:border-blue-500/40 text-gray-300 hover:text-white">
 {iconMap[link.name.toLowerCase()]}
 {nameMap[link.name.toLowerCase()] || link.name}
 <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
 </a>
 ));
 } catch (e) { return null; }
 })() : null}
 </div>

 {/* Raised */}
 {airdrop.raise && (
 <div className="mt-5 flex items-center gap-2">
 <span className="text-gray-500 text-sm">Raised:</span>
 <span className="text-xl font-black text-white">{airdrop.raise}</span>
 </div>
 )}
 </div>
 </div>

 {/* Status Chips */}
 <div className="relative z-10 px-8 pb-6 flex flex-wrap items-center gap-3">
 {[
 { label: 'Reward Type', value: airdrop.rewardType || 'Airdrop', color: 'blue' },
 { label: 'Status', value: airdrop.status || 'Verification Check', color: airdrop.status === 'New' ? 'indigo' : airdrop.status === 'Confirmed' ? 'emerald' : 'blue' },
 { label: 'Reward Date', value: airdrop.rewardDate || 'TBA', color: 'slate' },
 ].map((chip, i) => (
 <div key={i} className="flex items-center gap-2 bg-[#0f172a]/5 border border-white/10 backdrop-blur-sm px-4 py-2 rounded-xl text-sm">
 <span className="text-gray-500 font-medium">{chip.label}:</span>
 <span className="text-white font-semibold">{chip.value}</span>
 </div>
 ))}
 </div>

 {/* Description */}
 {airdrop.description && (
 <div className="relative z-10 px-8 pb-8 border-t border-white/5 pt-6">
 <h3 className="text-base font-bold text-white mb-2">Instructions for {airdrop.name}</h3>
 <p className="text-gray-400 text-sm leading-relaxed max-w-5xl">{airdrop.description}</p>
 </div>
 )}
 </div>

 {/* Login / Upgrade Banners */}
 {!user && (
 <div className="relative overflow-hidden rounded-2xl">
 <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-[#0c1628]" />
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
 <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-[#1a1040]" />
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
 className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer transition-colors ${!activeCategory ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
 >
 All
 </span>
 {Array.from(new Set(tasks.map(t => t.category))).map(cat => (
 <span
 key={cat}
 onClick={() => setActiveCategory(cat)}
 className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer transition-colors ${activeCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
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
 ? 'bg-gray-800/80 border-blue-500 shadow-md shadow-blue-500/10 text-white'
 : 'bg-gray-900 border-gray-800 hover:border-gray-700 text-gray-300'
 }`}
 >
 <div className="flex items-start justify-between mb-3">
 <h4 className={`font-bold text-lg leading-tight ${isActive ? 'text-white' : 'text-gray-200'} max-w-[80%]`}>{task.title}</h4>
 {user && (user.role === 'PRO' || user.role === 'ULTRA') && isCompleted && (
 <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-800 text-gray-300 border border-gray-700 shrink-0">Completed</span>
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
 <div className="mt-4">
 <span className="px-3 py-1 rounded-md bg-gray-800 text-xs font-medium text-gray-300 border border-gray-700/50">{task.category}</span>
 </div>
 </div>
 );
 })}
 {tasks.length === 0 && (
 <div className="text-center py-8 text-gray-500">No tasks available for this project.</div>
 )}
 </div>
 {user && user.role === 'ULTRA' && (
 <button
 onClick={() => setShowAddTask(true)}
 className="mt-4 w-full py-3 rounded-xl border-2 border-dashed border-gray-700 text-gray-400 font-medium hover:border-gray-500 hover:text-gray-300 transition-colors flex items-center justify-center gap-2"
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
 <div className={`w-3 h-3 rounded-full ${isDone ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'bg-gray-700'}`}></div>
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
 <button className="px-4 py-1.5 bg-gray-800 text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors">New</button>
 <button className="px-4 py-1.5 bg-gray-800 text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors">To Do</button>
 <button className="px-4 py-1.5 bg-gray-800/50 text-gray-400 text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors">Completed</button>
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
 <div className="bg-gray-900 rounded-3xl border border-gray-800 p-8 min-h-[500px]">
 {showAddTask && user && user.role === 'ULTRA' ? (
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
 <input required name="title" type="text" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="e.g. Connect your social accounts" />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-400 mb-2">Category / Tab</label>
 <input required name="category" type="text" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="e.g. Social, DePIN, Mint NFT" />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
 <textarea required name="description" rows={4} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="Provide instructions for the task..." />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-400 mb-2">Deadline (Optional)</label>
 <input name="deadline" type="date" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-300 focus:outline-none focus:border-blue-500 scheme-dark" />
 </div>

 <div className="pt-4 border-t border-gray-800">
 <div className="flex justify-between items-center mb-4">
 <label className="block text-sm font-medium text-gray-400">Task Steps</label>
 <button
 type="button"
 onClick={() => setNewSteps([...newSteps, { text: '', link: '', image: '' }])}
 className="text-xs bg-gray-800 hover:bg-gray-700 text-blue-400 px-3 py-1.5 rounded-lg transition-colors border border-gray-700"
 >
 + Add Step
 </button>
 </div>
 <div className="space-y-6">
 {newSteps.map((step, index) => (
 <div key={index} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 relative group">
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
 </div>
 <input
 type="text"
 value={step.text}
 onChange={(e) => {
 const updated = [...newSteps];
 updated[index].text = e.target.value;
 setNewSteps(updated);
 }}
 className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 mb-3"
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
 className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
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
 className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
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
 <input required name="title" type="text" defaultValue={activeTask.title} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="e.g. Connect your social accounts" />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-400 mb-2">Category / Tab</label>
 <input required name="category" type="text" defaultValue={activeTask.category} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="e.g. Social, DePIN, Mint NFT" />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
 <select name="status" defaultValue={activeTask.status} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 appearance-none">
 <option value="Open">Open</option>
 <option value="Closed">Closed</option>
 </select>
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
 <textarea required name="description" rows={4} defaultValue={activeTask.description} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="Provide instructions for the task..." />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-400 mb-2">Deadline (Optional)</label>
 <input name="deadline" type="date" defaultValue={activeTask.deadline ? activeTask.deadline.split('T')[0] : ''} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-300 focus:outline-none focus:border-blue-500 scheme-dark" />
 </div>

 <div className="pt-4 border-t border-gray-800">
 <div className="flex justify-between items-center mb-4">
 <label className="block text-sm font-medium text-gray-400">Task Steps</label>
 <button
 type="button"
 onClick={() => setNewSteps([...newSteps, { text: '', link: '', image: '' }])}
 className="text-xs bg-gray-800 hover:bg-gray-700 text-blue-400 px-3 py-1.5 rounded-lg transition-colors border border-gray-700"
 >
 + Add Step
 </button>
 </div>
 <div className="space-y-6">
 {newSteps.map((step, index) => (
 <div key={index} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 relative group">
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
 </div>
 <input
 type="text"
 value={step.text}
 onChange={(e) => {
 const updated = [...newSteps];
 updated[index].text = e.target.value;
 setNewSteps(updated);
 }}
 className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 mb-3"
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
 className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
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
 className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
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
 <div className={`w-10 h-6 rounded-full p-1 transition-colors ${progress.find(p => p.taskId === activeTask.id)?.completed ? 'bg-blue-600' : 'bg-gray-700'}`}>
 <div className={`w-4 h-4 bg-[#0f172a] rounded-full transition-transform ${progress.find(p => p.taskId === activeTask.id)?.completed ? 'translate-x-4' : 'translate-x-0'}`}></div>
 </div>
 </button>
 )}
 </div>
 {user?.role === 'ULTRA' && (
 <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
 <button
 onClick={() => {
 setNewSteps(activeTask.steps && activeTask.steps.length > 0 ? activeTask.steps : [{ text: '', link: '', image: '' }]);
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
 <div className="w-8 h-8 rounded-full bg-blue-900/30 text-blue-400 flex items-center justify-center text-sm font-bold border border-blue-500/30 z-10 shrink-0">
 {index + 1}
 </div>
 {index < activeTask.steps.length - 1 && (
 <div className="w-px h-full bg-gray-800 mt-2"></div>
 )}
 </div>
 <div className="flex-1 pb-2">
 <p className="text-gray-300 mb-4">{step.text}</p>
 {step.image && (
 <div
 className="rounded-xl overflow-hidden border border-gray-800 bg-gray-900 w-full max-w-4xl mt-4 mb-4 cursor-pointer hover:border-blue-500/50 transition-colors group relative"
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
 </div>
 </div>
 );
}
