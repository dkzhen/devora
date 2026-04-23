'use client';

import { useState, useEffect } from 'react';

export function ModelTable() {
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchModels() {
            try {
                const res = await fetch('/api/v1/ai/models');
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }
                const json = await res.json();
                // OpenAI-compatible format: { object: "list", data: [...] }
                const list = json.data || [];
                setModels(list);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchModels();
    }, []);

    if (loading) {
        return (
            <div className="my-4 rounded-xl border border-white/10 p-6 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin text-[#FEBD8B]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Loading available models…
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="my-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
                Failed to load model list: <code className="font-mono">{error}</code>
            </div>
        );
    }

    if (models.length === 0) {
        return (
            <div className="my-4 rounded-xl border border-white/10 p-4 text-sm text-slate-400">
                No public models are currently available.
            </div>
        );
    }

    return (
        <div className="my-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="border-b border-white/10">
                        <th className="px-4 py-3 font-semibold text-[#FEBD8B]">Model ID</th>
                        <th className="px-4 py-3 font-semibold text-[#FEBD8B]">Name</th>
                        <th className="px-4 py-3 font-semibold text-[#FEBD8B]">Provider</th>
                        <th className="px-4 py-3 font-semibold text-[#FEBD8B]">Context</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {models.map((m) => (
                        <tr key={m.id} className="transition-colors hover:bg-white/[0.02]">
                            <td className="px-4 py-3 font-mono text-xs text-slate-300">
                                <code>{m.id}</code>
                            </td>
                            <td className="px-4 py-3 text-slate-200">{m.name}</td>
                            <td className="px-4 py-3 text-slate-400">{m.owned_by || '—'}</td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-500">
                                {m.context_length?.toLocaleString() || '—'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
