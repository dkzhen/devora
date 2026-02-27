'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfileCard({ user, initials, roleBadge, roleGradient, memberSince }) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: user.name || '',
        email: user.email || '',
    });
    const [errors, setErrors] = useState({});
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Full Name is required';
        if (!formData.email.trim()) newErrors.email = 'Email Address is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);

        try {
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to update profile');

            showToast('Profile updated successfully!');
            setIsEditing(false);
            router.refresh();
        } catch (error) {
            console.error(error);
            showToast(error.message || 'Failed to update. Please try again.', 'error');
            if (error.message.includes('Email already exists')) {
                setErrors({ email: 'Email is already in use' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const updateFormData = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    };

    return (
        <section className="relative overflow-hidden rounded-2xl bg-[#0f172a] border border-white/8 p-6">
            {toast && (
                <div className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium animate-fade-in-up ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {toast.message}
                </div>
            )}

            <div className="flex justify-between items-start mb-6">
                <div className="flex items-start gap-5">
                    {/* Avatar */}
                    <div className={`w-14 h-14 rounded-2xl bg-linear-to-br ${roleGradient} flex items-center justify-center text-white font-black text-lg shadow-lg shrink-0`}>
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h2 className="text-xl font-black text-white">{user.name}</h2>
                            <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-lg border ${roleBadge}`}>
                                {user.role}
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm mt-0.5">{user.email}</p>
                        <p className="text-gray-700 text-xs mt-1">Member since {memberSince}</p>
                    </div>
                </div>
                {!isEditing && (
                    <button onClick={() => setIsEditing(true)} className="text-sm font-medium text-blue-500 hover:text-blue-400">
                        Edit Profile
                    </button>
                )}
            </div>

            {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-white/10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                                Full Name
                            </label>
                            <input
                                type="text"
                                required
                                className={`w-full px-4 py-2.5 rounded-xl bg-white/5 border outline-none transition-all ${errors.name
                                    ? 'border-red-500 focus:ring-red-500 text-red-100'
                                    : 'border-white/10 focus:ring-2 focus:ring-blue-500 text-white'
                                    }`}
                                placeholder="Enter Full Name"
                                value={formData.name}
                                onChange={(e) => updateFormData('name', e.target.value)}
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-500 font-medium">{errors.name}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                required
                                className={`w-full px-4 py-2.5 rounded-xl bg-white/5 border outline-none transition-all ${errors.email
                                    ? 'border-red-500 focus:ring-red-500 text-red-100'
                                    : 'border-white/10 focus:ring-2 focus:ring-blue-500 text-white'
                                    }`}
                                placeholder="Enter Email Address"
                                value={formData.email}
                                onChange={(e) => updateFormData('email', e.target.value)}
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-500 font-medium">{errors.email}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end pt-2 gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                setIsEditing(false);
                                setFormData({ name: user.name || '', email: user.email || '' });
                                setErrors({});
                            }}
                            className="px-6 py-2.5 font-bold rounded-xl shadow-lg transform transition-all active:scale-95 disabled:opacity-50 text-gray-300 hover:bg-white/5"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transform transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                        { label: 'Full Name', value: user.name, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
                        { label: 'Email Address', value: user.email, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
                        { label: 'Member Since', value: memberSince, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
                    ].map((item) => (
                        <div key={item.label} className="p-4 rounded-xl bg-white/3 border border-white/5">
                            <div className="flex items-center gap-2 text-gray-600 mb-2">
                                {item.icon}
                                <span className="text-[10px] uppercase tracking-widest font-bold">{item.label}</span>
                            </div>
                            <div className="text-sm font-semibold text-white truncate">{item.value}</div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}

