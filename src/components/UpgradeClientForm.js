'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HeroHeader } from './HeroHeader';

export default function UpgradeClientForm({ callbackUrlDev, callbackUrlProd }) {
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [isValidated, setIsValidated] = useState(false);
    const [toast, setToast] = useState(null);
    const [formData, setFormData] = useState({ clientId: '', clientSecret: '' });
    const [errors, setErrors] = useState({});
    const [showSecret, setShowSecret] = useState(false);
    const [copiedKey, setCopiedKey] = useState(null);

    const handleCopy = (text, key) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setToast({ type: 'success', message: 'Copied to clipboard!' });
        setTimeout(() => { setToast(null); setCopiedKey(null); }, 2500);
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.clientId.trim()) {
            newErrors.clientId = 'Client ID is required';
        } else if (!formData.clientId.endsWith('.apps.googleusercontent.com')) {
            newErrors.clientId = 'Should end with .apps.googleusercontent.com';
        }
        if (!formData.clientSecret.trim()) {
            newErrors.clientSecret = 'Client Secret is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
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
                setToast({ type: 'success', message: '✓ Credentials validated — ready to save!' });
                setTimeout(() => setToast(null), 3000);
            } else {
                setIsValidated(false);
                setErrors({ ...errors, form: data.message });
                setToast({ type: 'error', message: data.message });
                setTimeout(() => setToast(null), 3000);
            }
        } catch (error) {
            console.error('Validation failed', error);
            setToast({ type: 'error', message: 'Validation failed. Check network.' });
        } finally {
            setVerifying(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isValidated && !confirm("Credentials haven't been validated via API yet. Save anyway?")) return;
        setLoading(true);
        try {
            const res = await fetch('/api/user/upgrade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                await fetch('/api/auth/me', { cache: 'no-store', headers: { 'Pragma': 'no-cache' } });
                setToast({ type: 'success', message: 'Saved! Redirecting to dashboard...' });
                setTimeout(() => { router.push('/'); router.refresh(); }, 1500);
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to upgrade');
            }
        } catch (error) {
            console.error('Upgrade failed', error);
            alert('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const updateFormData = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setIsValidated(false);
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    };

    const inputBase = 'w-full px-4 py-3 rounded-none bg-[#0B0F1A] border focus:outline-none transition-all text-white text-sm font-mono placeholder-gray-600';

    return (
        <div className="space-y-6">
            {/* Toast */}
            {toast && (
                <div className="fixed top-5 right-5 z-50">
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-semibold backdrop-blur-md ${toast.type === 'success'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-red-500/10 border-red-500/30 text-red-300'
                        }`}>
                        {toast.type === 'success'
                            ? <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                            : <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        }
                        {toast.message}
                    </div>
                </div>
            )}

            {/* Hero Banner */}
            <HeroHeader
                colorTheme="upgrade"
                breadcrumbs={[
                    { label: 'DASHBOARD', href: '/' },
                    { label: 'UPGRADE' }
                ]}
                title="Upgrade to"
                badge="PRO"
                description="Configure your Google OAuth credentials to unlock the full power of Devora."
                actionContent={
                    <span className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-[#e59a54]/10 border border-[#e59a54]/20 text-[#e59a54] text-[10px] font-mono uppercase tracking-widest font-bold">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        PRO
                    </span>
                }
            />

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Left: Form */}
                <div className="lg:col-span-2">
                    <div className="relative overflow-hidden rounded-none border border-white/20 bg-[#0B0F1A]">
                        {/* Card header */}
                        <div className="px-6 py-4 border-b border-white/20 flex items-center gap-3">
                            <span className="w-8 h-8 flex items-center justify-center rounded-none bg-[#e59a54]/10 border border-[#e59a54]/20 text-[#e59a54]">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            </span>
                            <div>
                                <h2 className="text-[10px] font-mono uppercase tracking-widest font-black text-white">Configuration Details</h2>
                                <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500 mt-1">Enter your Google Cloud Project credentials</p>
                            </div>
                            {isValidated && (
                                <span className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-none bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono uppercase tracking-widest font-bold">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    Verified
                                </span>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Client ID */}
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                                    Google Client ID <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.clientId}
                                    onChange={(e) => updateFormData('clientId', e.target.value)}
                                    className={`${inputBase} ${errors.clientId ? 'border-red-500 focus:border-red-400'
                                            : isValidated ? 'border-emerald-500/40 focus:border-emerald-500/80'
                                                : 'border-white/20 focus:border-[#e59a54]'
                                        }`}
                                    placeholder="123456789-abc...apps.googleusercontent.com"
                                />
                                {errors.clientId && (
                                    <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                                        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" /></svg>
                                        {errors.clientId}
                                    </p>
                                )}
                            </div>

                            {/* Client Secret */}
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                                    Google Client Secret <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showSecret ? 'text' : 'password'}
                                        required
                                        value={formData.clientSecret}
                                        onChange={(e) => updateFormData('clientSecret', e.target.value)}
                                        className={`${inputBase} pr-11 ${errors.clientSecret ? 'border-red-500 focus:border-red-400'
                                                : isValidated ? 'border-emerald-500/40 focus:border-emerald-500/80'
                                                    : 'border-white/20 focus:border-[#e59a54]'
                                            }`}
                                        placeholder="GOCSPX-..."
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowSecret(!showSecret)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-300 transition-colors"
                                    >
                                        {showSecret
                                            ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                            : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        }
                                    </button>
                                </div>
                                {errors.clientSecret && (
                                    <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                                        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" /></svg>
                                        {errors.clientSecret}
                                    </p>
                                )}
                            </div>

                            {/* Global error */}
                            {errors.form && (
                                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300">
                                    <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    {errors.form}
                                </div>
                            )}

                            {/* Redirect URIs */}
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                                    Authorized Redirect URIs
                                </label>
                                <div className="space-y-2">
                                    {/* Dev */}
                                    <div
                                        onClick={() => handleCopy(callbackUrlDev, 'dev')}
                                        className="group relative bg-[#0B0F1A] border border-white/20 hover:border-[#e59a54] rounded-none p-3.5 cursor-pointer transition-colors"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-bold text-[#e59a54] uppercase tracking-widest">Development (localhost)</span>
                                            <span className={`text-[10px] font-semibold transition-all ${copiedKey === 'dev' ? 'text-emerald-400' : 'text-gray-600 group-hover:text-[#e59a54]'}`}>
                                                {copiedKey === 'dev' ? '✓ Copied' : 'Click to copy'}
                                            </span>
                                        </div>
                                        <code className="font-mono text-xs text-gray-400 group-hover:text-gray-200 transition-colors break-all">{callbackUrlDev}</code>
                                    </div>
                                    {/* Prod */}
                                    <div
                                        onClick={() => handleCopy(callbackUrlProd, 'prod')}
                                        className="group relative bg-[#0B0F1A] border border-white/20 hover:border-[#e59a54] rounded-none p-3.5 cursor-pointer transition-colors"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-bold text-[#e59a54] uppercase tracking-widest">Production</span>
                                            <span className={`text-[10px] font-semibold transition-all ${copiedKey === 'prod' ? 'text-emerald-400' : 'text-gray-600 group-hover:text-[#e59a54]'}`}>
                                                {copiedKey === 'prod' ? '✓ Copied' : 'Click to copy'}
                                            </span>
                                        </div>
                                        <code className="font-mono text-xs text-gray-400 group-hover:text-gray-200 transition-colors break-all">{callbackUrlProd}</code>
                                    </div>
                                </div>
                                <p className="mt-2.5 text-[11px] text-amber-500/70 flex items-start gap-1.5">
                                    <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    Add these URIs to your Google Cloud Console → Authorized Redirect URIs.
                                </p>
                            </div>

                            {/* Action buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={handleVerify}
                                    disabled={loading || verifying}
                                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-none font-bold text-[10px] font-mono uppercase tracking-widest transition-colors border ${isValidated
                                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 cursor-default'
                                            : 'bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-[#e59a54] disabled:opacity-50'
                                        }`}
                                >
                                    {verifying ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Verifying...
                                        </>
                                    ) : isValidated ? (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                            Verified
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                            Verify Credentials
                                        </>
                                    )}
                                </button>

                                <button
                                    type="submit"
                                    disabled={loading || !isValidated}
                                    title={!isValidated ? 'Verify credentials first' : ''}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-none border-2 border-[#e59a54] bg-[#e59a54]/10 hover:bg-[#e59a54] hover:text-[#0B0F1A] text-[#e59a54] font-bold text-[10px] font-mono uppercase tracking-widest transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                                            Save Configuration
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right: PRO Features Panel */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Features card */}
                    <div className="relative overflow-hidden rounded-none border border-white/20 bg-[#0B0F1A]">
                        <div className="px-5 py-4 border-b border-white/20 flex items-center gap-2">
                            <span className="w-7 h-7 flex items-center justify-center rounded-none bg-[#e59a54]/10 border border-[#e59a54]/20 text-[#e59a54]">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </span>
                            <h3 className="text-[10px] font-mono uppercase tracking-widest font-black text-white">PRO Features</h3>
                        </div>
                        <ul className="p-5 space-y-4">
                            {[
                                {
                                    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
                                    title: 'Unlimited Gmail Accounts',
                                    desc: 'Connect and manage as many accounts as you need.'
                                },
                                {
                                    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
                                    title: 'Read Full Messages',
                                    desc: 'Access email content and threads from the dashboard.'
                                },
                                {
                                    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
                                    title: 'Priority Sync',
                                    desc: 'Faster background refreshing for connected accounts.'
                                },
                            ].map((f, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <span className="shrink-0 mt-0.5 w-7 h-7 rounded-none bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                        {f.icon}
                                    </span>
                                    <div>
                                        <div className="text-[10px] font-mono uppercase tracking-widest font-bold text-white">{f.title}</div>
                                        <div className="text-[10px] font-mono uppercase tracking-widest text-gray-500 mt-1 leading-relaxed">{f.desc}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Info card */}
                    <div className="relative overflow-hidden rounded-none border border-white/20 bg-[#0B0F1A] p-5">
                        <div className="flex items-start gap-3">
                            <span className="shrink-0 w-7 h-7 rounded-none bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mt-0.5">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </span>
                            <div>
                                <div className="text-[10px] font-mono uppercase tracking-widest font-bold text-amber-400 mb-1">Your data stays yours</div>
                                <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500 leading-relaxed mt-2">
                                    By using your own Google credentials, you have full ownership and privacy over your OAuth tokens. Devora never stores your email content.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
