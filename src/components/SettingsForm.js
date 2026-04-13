'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsForm({ initialData, callbackUrlDev, callbackUrlProd }) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [isValidated, setIsValidated] = useState(false);
    const [toast, setToast] = useState(null);
    const [formData, setFormData] = useState({
        clientId: initialData?.googleClientId || '',
        clientSecret: initialData?.googleClientSecret || ''
    });
    const [errors, setErrors] = useState({});

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        showToast('Copied to clipboard!');
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.clientId.trim()) {
            newErrors.clientId = 'Client ID is required';
        } else if (!formData.clientId.endsWith('.apps.googleusercontent.com')) {
            newErrors.clientId = 'Invalid Client ID format used for Google Cloud Console. Should end with .apps.googleusercontent.com';
        }

        if (!formData.clientSecret.trim()) {
            newErrors.clientSecret = 'Client Secret is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        // Safety check if not validated yet
        if (!isValidated && !confirm("Credentials haven't been verified via API. Save anyway?")) {
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch('/api/user/upgrade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Update failed');

            showToast('Configuration updated successfully!');
            setIsEditing(false);
            router.refresh();
        } catch (error) {
            console.error(error);
            showToast('Failed to update. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = async () => {
        if (!validateForm()) return;
        setVerifying(true);
        setErrors({});

        try {
            const res = await fetch('/api/auth/google/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (data.valid) {
                setIsValidated(true);
                showToast('Credentials validated successfully!');
            } else {
                setIsValidated(false);
                setErrors({ ...errors, form: data.message });
                showToast(data.message, 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Validation failed', 'error');
        } finally {
            setVerifying(false);
        }
    };

    // Update formData helper
    const updateFormData = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setIsValidated(false); // Reset validation on edit
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
        if (errors.form) setErrors(prev => ({ ...prev, form: null }));
    };

    // Mask secret for display
    const maskedSecret = formData.clientSecret
        ? `${formData.clientSecret.substring(0, 5)}...${formData.clientSecret.substring(formData.clientSecret.length - 4)}`
        : '';

    // Determine if we are in "Empty State" (no config)
    const isEmpty = !initialData?.googleClientId;

    if (!isEditing && !isEmpty) {
        return (
            <div className="space-y-6">
                {toast && (
                    <div className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium animate-fade-in-up ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                        {toast.message}
                    </div>
                )}
                <div className="bg-[#0B0F1A] p-4 rounded-none border border-white/20">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                            Google Client ID
                        </label>
                        <button onClick={() => setIsEditing(true)} className="text-xs text-blue-600 font-semibold hover:underline">Edit</button>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                        <code className="block font-mono text-sm text-slate-100 break-all">
                            {formData.clientId}
                        </code>
                        <button
                            onClick={() => handleCopy(formData.clientId)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0"
                            title="Copy Client ID"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        </button>
                    </div>
                </div>

                <div className="bg-[#0B0F1A] p-4 rounded-none border border-white/20">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                        Google Client Secret
                    </label>
                    <div className="flex items-center gap-3">
                        <code className="flex-1 font-mono text-sm text-slate-100">
                            {maskedSecret}
                        </code>
                        <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-slate-400 italic">Hidden</span>
                            <button
                                onClick={() => handleCopy(formData.clientSecret)}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                title="Copy Client Secret"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#0B0F1A] rounded-none p-6 md:p-8 border border-white/20">
            {toast && (
                <div className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium animate-fade-in-up ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {toast.message}
                </div>
            )}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-mono uppercase tracking-widest font-black text-white flex items-center gap-2">
                    <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    API Configuration
                </h2>
                {!isEmpty && (
                    <button onClick={() => setIsEditing(false)} className="text-sm font-medium text-slate-500 hover:text-slate-300">Cancel</button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2">
                        Google Client ID
                    </label>
                    <input
                        type="text"
                        required
                        className={`w-full px-4 py-3 rounded-none bg-[#0B0F1A] border outline-none font-mono text-sm transition-all flex items-center ${errors.clientId
                            ? 'border-red-500 focus:border-red-400 text-red-100'
                            : isValidated
                                ? 'border-emerald-500/50 focus:border-emerald-500 text-emerald-100'
                                : 'border-white/20 focus:border-blue-500 text-white'
                            }`}
                        placeholder="Enter Client ID"
                        value={formData.clientId}
                        onChange={(e) => updateFormData('clientId', e.target.value)}
                    />
                    {errors.clientId && (
                        <p className="mt-1 text-sm text-red-500 font-medium">{errors.clientId}</p>
                    )}
                </div>

                <div>
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2">
                        Google Client Secret
                    </label>
                    <input
                        type="password"
                        required
                        className={`w-full px-4 py-3 rounded-none bg-[#0B0F1A] border outline-none font-mono text-sm transition-all flex items-center ${errors.clientSecret
                            ? 'border-red-500 focus:border-red-400 text-red-100'
                            : isValidated
                                ? 'border-emerald-500/50 focus:border-emerald-500 text-emerald-100'
                                : 'border-white/20 focus:border-blue-500 text-white'
                            }`}
                        placeholder="Enter Client Secret"
                        value={formData.clientSecret}
                        onChange={(e) => updateFormData('clientSecret', e.target.value)}
                    />
                    {errors.clientSecret && (
                        <p className="mt-1 text-sm text-red-500 font-medium">{errors.clientSecret}</p>
                    )}
                </div>

                {errors.form && (
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
                        {errors.form}
                    </div>
                )}

                <div className="pt-2">
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                        Authorized Redirect URI
                    </label>
                    <div className="space-y-3">
                        <div
                            onClick={() => handleCopy(callbackUrlDev)}
                            className="group relative bg-[#0B0F1A] p-3 rounded-none border border-white/10 cursor-pointer hover:border-white/30 transition-colors"
                        >
                            <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">Development (Localhost)</div>
                            <code className="text-sm font-mono text-slate-300 break-all">
                                {callbackUrlDev}
                            </code>
                        </div>

                        <div
                            onClick={() => handleCopy(callbackUrlProd)}
                            className="group relative bg-[#0B0F1A] p-3 rounded-none border border-white/10 cursor-pointer hover:border-white/30 transition-colors"
                        >
                            <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">Production (Live)</div>
                            <code className="text-sm font-mono text-slate-300 break-all">
                                {callbackUrlProd}
                            </code>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4 gap-3">
                    <button
                        type="button"
                        onClick={handleVerify}
                        disabled={isLoading || verifying}
                        className={`px-6 py-2.5 font-bold text-[10px] uppercase tracking-widest rounded-none border transition-all disabled:opacity-50 flex items-center gap-2 ${isValidated
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 cursor-default'
                            : 'bg-[#0B0F1A] border-white/20 text-slate-300 hover:bg-white/5'
                            }`}
                    >
                        {verifying ? (
                            <>
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Verifying...
                            </>
                        ) : isValidated ? (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                Verified
                            </>
                        ) : (
                            'Verify'
                        )}
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading || !isValidated}
                        className="px-6 py-2.5 border-2 border-[#000c40] bg-[#f0f2f0] text-[#000c40] hover:bg-transparent hover:text-[#f0f2f0] hover:border-[#f0f2f0] font-bold text-[10px] uppercase tracking-widest rounded-none transition-all disabled:opacity-50 flex items-center gap-2"
                        title={!isValidated ? 'Please verify credentials first' : ''}
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
                            'Save Configuration'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
