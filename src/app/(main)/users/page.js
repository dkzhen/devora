'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HeroHeader } from '@/components/HeroHeader';
import StatCard from '@/components/StatCard';
import { Users, Shield } from 'lucide-react';

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
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 20;

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
                setCurrentPage(1);
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
                const updatedUsers = users.filter(u => u.id !== id);
                setUsers(updatedUsers);
                showToast('User deleted successfully');
                // Adjust page if needed
                const newTotalPages = Math.ceil(updatedUsers.length / usersPerPage);
                if (currentPage > newTotalPages && newTotalPages > 0) {
                    setCurrentPage(newTotalPages);
                }
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
        INSIDER: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10',
        MEMBER: 'bg-gray-500/10 text-slate-400 border-gray-500/20',
    };

    // Statistics
    const totalUsers = users.length;
    const totalRoles = new Set(users.map(u => u.role)).size;

    // Pagination
    const totalPages = Math.ceil(users.length / usersPerPage);
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Generate pagination numbers with ellipsis
    const getPaginationNumbers = () => {
        const pages = [];
        const maxVisible = 5; // Maximum visible page numbers
        
        if (totalPages <= maxVisible + 2) {
            // Show all pages if total is small
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);
            
            if (currentPage <= 3) {
                // Near start
                for (let i = 2; i <= Math.min(maxVisible, totalPages - 1); i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                // Near end
                pages.push('...');
                for (let i = totalPages - (maxVisible - 1); i < totalPages; i++) {
                    pages.push(i);
                }
                pages.push(totalPages);
            } else {
                // Middle
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            }
        }
        
        return pages;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-xs text-slate-500 animate-pulse">Loading system users…</p>
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

            <HeroHeader
                breadcrumbs={[
                    {
                        label: "Dashboard",
                        href: "/"
                    },
                    {
                        label: "Users"
                    }
                ]}
                title="System"
                badge="Users"
                description="Manage system access and roles securely from a centralized dashboard."
            />

            {/* Statistics */}
            <div className="grid grid-cols-2 gap-3">
                <StatCard title="Total Users" value={totalUsers} color="blue" icon={<Users className="w-5 h-5" />} />
                <StatCard title="Total Roles" value={totalRoles} color="purple" icon={<Shield className="w-5 h-5" />} />
            </div>

            {/* Users List */}
            <div className="bg-gray-900/50 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h3 className="text-sm font-bold text-white">Users List</h3>
                    <button
                        onClick={() => setShowUserModal(true)}
                        className="shrink-0 flex items-center gap-2 px-3 py-2 md:px-5 md:py-2.5 bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold shadow-xl shadow-purple-700/30 transition-all active:scale-95 border border-white/10"
                    >
                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                        <span className="md:hidden">Add</span>
                        <span className="hidden md:inline">Create User</span>
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-gray-800/80 border-b border-white/10">
                                <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">User</th>
                                <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                                <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                                <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Joined</th>
                                <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {currentUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-linear-to-br from-gray-700 to-gray-800 flex items-center justify-center text-sm font-bold text-white shadow-sm shrink-0 border border-white/10">
                                                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                            </div>
                                            <div className="font-medium text-white text-sm">{user.name || 'Unknown User'}</div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-slate-300">{user.email}</td>
                                    <td className="py-3 px-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border max-w-fit ${ROLE_COLORS[user.role] || ROLE_COLORS.MEMBER}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-slate-400">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => { setSelectedUser(user); setShowEditModal(true); }}
                                                className="p-1.5 text-slate-400 hover:text-blue-400 bg-gray-800 hover:bg-blue-500/10 rounded-lg transition-colors border border-transparent hover:border-blue-500/20"
                                                title="Edit Role"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                            </button>
                                            {currentUser?.id !== user.id && (
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-400 bg-gray-800 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                                                    title="Delete User"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {currentUsers.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="py-8 text-center text-slate-500 text-sm">
                                        No users found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {users.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-white/10">
                        <div className="text-xs text-slate-400 text-center sm:text-left">
                            <span className="hidden sm:inline">Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, users.length)} of {users.length} users</span>
                            <span className="sm:hidden">{indexOfFirstUser + 1}-{Math.min(indexOfLastUser, users.length)} of {users.length}</span>
                        </div>
                        {totalPages > 1 && (
                            <div className="flex items-center gap-1 flex-wrap justify-center">
                                <button
                                    onClick={() => paginate(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 text-xs font-medium text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed border border-white/10"
                                >
                                    Prev
                                </button>
                                {getPaginationNumbers().map((number, index) => (
                                    number === '...' ? (
                                        <span key={`ellipsis-${index}`} className="px-2 py-1.5 text-xs text-slate-400">
                                            ...
                                        </span>
                                    ) : (
                                        <button
                                            key={number}
                                            onClick={() => paginate(number)}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${currentPage === number ? 'bg-purple-600 text-white border-purple-500' : 'text-slate-300 bg-white/5 hover:bg-white/10 border-white/10'}`}
                                        >
                                            {number}
                                        </button>
                                    )
                                ))}
                                <button
                                    onClick={() => paginate(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1.5 text-xs font-medium text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed border border-white/10"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Create User Modal */}
            {showUserModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowUserModal(false)} />
                    <div className="relative w-full max-w-md bg-linear-to-br from-gray-900 to-[#0c1628] rounded-2xl border border-white/10 shadow-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Create New User</h2>
                            <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-white transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Email</label>
                                <input type="email" name="email" required className="w-full bg-[#0c0e1a]/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="user@example.com" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Name</label>
                                <input type="text" name="name" className="w-full bg-[#0c0e1a]/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Display Name" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Password</label>
                                <input type="password" name="password" required className="w-full bg-[#0c0e1a]/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="••••••••" minLength="6" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Role</label>
                                <select name="role" required className="w-full bg-[#0c0e1a]/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none">
                                    <option value="MEMBER">MEMBER</option>
                                    <option value="INSIDER">INSIDER</option>
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
                            <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="mb-4 text-sm text-slate-300">
                            Updating role for <span className="font-bold text-white">{selectedUser.email}</span>
                        </div>

                        <form onSubmit={handleEditRole} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Role</label>
                                <select name="role" defaultValue={selectedUser.role} required className="w-full bg-[#0c0e1a]/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none">
                                    <option value="MEMBER">MEMBER</option>
                                    <option value="INSIDER">INSIDER</option>
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
