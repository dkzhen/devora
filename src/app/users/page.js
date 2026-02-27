'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function UsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // Check auth
                const storedUser = localStorage.getItem('user_info');
                if (storedUser) {
                    const parsed = JSON.parse(storedUser);
                    setCurrentUser(parsed);
                    if (parsed.role !== 'ULTRA') {
                        router.push('/');
                        return;
                    }
                } else {
                    const res = await fetch('/api/auth/me');
                    if (res.ok) {
                        const data = await res.json();
                        setCurrentUser(data.user);
                        if (data.user.role !== 'ULTRA') {
                            router.push('/');
                            return;
                        }
                    } else {
                        router.push('/login');
                        return;
                    }
                }

                // Fetch all users
                const usersRes = await fetch('/api/users');
                if (usersRes.ok) {
                    const data = await usersRes.json();
                    setUsers(data);
                } else {
                    showToast('Failed to load users', 'error');
                }
            } catch (err) {
                console.error(err);
                showToast('An error occurred', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [router]);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.target);

        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.get('email'),
                    password: formData.get('password'),
                    name: formData.get('name'),
                    role: formData.get('role'),
                }),
            });

            if (res.ok) {
                const newUser = await res.json();
                setUsers([newUser, ...users]);
                showToast('User created successfully');
                setShowUserModal(false);
            } else {
                const data = await res.json();
                showToast(data.error || 'Failed to create user', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Error creating user', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditRole = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.target);

        try {
            const res = await fetch(`/api/users/${selectedUser.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    role: formData.get('role'),
                }),
            });

            if (res.ok) {
                const updatedUser = await res.json();
                setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
                showToast('User role updated');
                setShowEditModal(false);
                setSelectedUser(null);
            } else {
                const data = await res.json();
                showToast(data.error || 'Failed to update user', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Error updating user', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setUsers(users.filter(u => u.id !== id));
                showToast('User deleted successfully');
            } else {
                const data = await res.json();
                showToast(data.error || 'Failed to delete user', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Error deleting user', 'error');
        }
    };

    const ROLE_COLORS = {
        ULTRA: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        PRO: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        MEMBER: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-xs text-gray-500 animate-pulse">Loading system users…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 relative">
            {toast && (
                <div className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium animate-fade-in-up ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl">
                <div className="absolute inset-0 bg-linear-to-br from-gray-900 via-[#0d1b3e] to-gray-900" />
                <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-16 -left-8 w-56 h-56 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.2) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

                <div className="relative z-10 p-5 md:p-8 flex flex-row items-start justify-between gap-3">
                    <div>
                        <nav className="flex text-xs text-blue-300/60 mb-3 items-center gap-2">
                            <a href="/" className="flex items-center gap-1 hover:text-blue-300 transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                Dashboard
                            </a>
                            <svg className="w-3 h-3 text-blue-400/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            <span className="text-blue-200 font-semibold">Users</span>
                        </nav>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                            <span className="text-white">System </span>
                            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 via-indigo-400 to-purple-400">Users</span>
                        </h1>
                        <p className="text-gray-400 mt-2 text-sm">Manage system access and roles</p>
                    </div>
                    <button
                        onClick={() => setShowUserModal(true)}
                        className="shrink-0 flex items-center gap-2 px-3 py-2 md:px-5 md:py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold shadow-xl shadow-blue-700/30 transition-all active:scale-95 border border-white/10"
                    >
                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                        <span className="md:hidden">Add</span>
                        <span className="hidden md:inline">Create User</span>
                    </button>
                </div>
            </div>

            {/* Users List */}
            <div className="bg-gray-900/50 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-gray-800/80 border-b border-white/10">
                                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</th>
                                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Joined</th>
                                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-linear-to-br from-gray-700 to-gray-800 flex items-center justify-center text-sm font-bold text-white shadow-sm shrink-0 border border-white/10">
                                                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                            </div>
                                            <div className="font-medium text-white text-sm">{user.name || 'Unknown User'}</div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-300">{user.email}</td>
                                    <td className="py-3 px-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border max-w-fit ${ROLE_COLORS[user.role] || ROLE_COLORS.MEMBER}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-400">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => { setSelectedUser(user); setShowEditModal(true); }}
                                                className="p-1.5 text-gray-400 hover:text-blue-400 bg-gray-800 hover:bg-blue-500/10 rounded-lg transition-colors border border-transparent hover:border-blue-500/20"
                                                title="Edit Role"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                            </button>
                                            {currentUser?.id !== user.id && (
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-400 bg-gray-800 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                                                    title="Delete User"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="py-8 text-center text-gray-500 text-sm">
                                        No users found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create User Modal */}
            {showUserModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowUserModal(false)} />
                    <div className="relative w-full max-w-md bg-linear-to-br from-gray-900 to-[#0c1628] rounded-2xl border border-white/10 shadow-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Create New User</h2>
                            <button onClick={() => setShowUserModal(false)} className="text-gray-400 hover:text-white transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Email</label>
                                <input type="email" name="email" required className="w-full bg-[#0f172a]/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="user@example.com" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Name</label>
                                <input type="text" name="name" className="w-full bg-[#0f172a]/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Display Name" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Password</label>
                                <input type="password" name="password" required className="w-full bg-[#0f172a]/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="••••••••" minLength="6" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Role</label>
                                <select name="role" required className="w-full bg-[#0f172a]/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none">
                                    <option value="MEMBER">MEMBER</option>
                                    <option value="PRO">PRO</option>
                                    <option value="ULTRA">ULTRA</option>
                                </select>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setShowUserModal(false)} className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-semibold transition-colors border border-white/10">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                    {isSubmitting ? 'Creating...' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Role Modal */}
            {showEditModal && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
                    <div className="relative w-full max-w-sm bg-linear-to-br from-gray-900 to-[#0c1628] rounded-2xl border border-white/10 shadow-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Edit Role</h2>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-white transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="mb-4 text-sm text-gray-300">
                            Updating role for <span className="font-bold text-white">{selectedUser.email}</span>
                        </div>

                        <form onSubmit={handleEditRole} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Role</label>
                                <select name="role" defaultValue={selectedUser.role} required className="w-full bg-[#0f172a]/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none">
                                    <option value="MEMBER">MEMBER</option>
                                    <option value="PRO">PRO</option>
                                    <option value="ULTRA">ULTRA</option>
                                </select>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-semibold transition-colors border border-white/10">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
