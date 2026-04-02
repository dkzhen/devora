'use client';

import { useState, useEffect } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, AreaChart, Area, Legend 
} from 'recharts';
import { Activity, Zap, ShieldAlert, Cpu, BarChart3, PieChart as PieChartIcon } from 'lucide-react';

// Main Container component to fetch data and pass to children
export default function AiUsageMonitoring({ children }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/ai-providers/stats');
                if (res.ok) {
                    const stats = await res.json();
                    setData(stats);
                }
            } catch (err) {
                console.error("AI Stats Fetch Error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
        const interval = setInterval(fetchStats, 60000);
        return () => clearInterval(interval);
    }, []);

    if (loading || !data || !data.usage) {
        return (
            <div className="col-span-full h-32 flex items-center justify-center border border-white/5 bg-[#0B0F1A]/40 rounded-lg animate-pulse font-mono text-[10px] text-gray-500 uppercase tracking-widest">
                Synchronizing AI Cluster Analytics...
            </div>
        );
    }

    // Fix Bug: Access apis correctly (usage.apis)
    const usage = data.usage;
    const apis = usage.apis || {};

    // Model Distribution Data
    const modelUsage = [];
    Object.values(apis).forEach(api => {
        if (api.models) {
            Object.entries(api.models).forEach(([modelId, modelStats]) => {
                modelUsage.push({
                    name: modelId.split('/').pop().slice(0, 15),
                    requests: modelStats.total_requests || 0
                });
            });
        }
    });
    const topModels = modelUsage.sort((a, b) => b.requests - a.requests).slice(0, 6);

    // Health Ratio Data
    const healthData = [
        { name: 'Success', value: usage.success_count || 0, color: '#10b981' },
        { name: 'Failure', value: usage.failure_count || 0, color: '#ef4444' }
    ];

    // Sub-components as properties
    return (
        <>
            <AiTrafficCard data={topModels} />
            <AiHealthCard data={healthData} rate={((usage.success_count / (usage.total_requests || 1)) * 100).toFixed(1)} />
            <AiTokenCard totalTokens={usage.total_tokens} totalRequests={usage.total_requests} />
        </>
    );
}

function CardWrapper({ title, subtitle, icon: Icon, children, colorClass = "blue" }) {
    const accents = {
        blue: "blue-500",
        emerald: "emerald-500",
        purple: "purple-500"
    };
    const accent = accents[colorClass] || accents.blue;

    return (
        <div className={`relative overflow-hidden rounded-lg bg-linear-to-b from-[#0a0e1a] to-[#07090f] border border-${accent}/20 p-6 flex flex-col h-full group shadow-[0_0_15px_rgba(59,130,246,0.05)]`}>
            {/* Top neon accent */}
            <div className={`absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-${accent}/50 to-transparent pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity`} />
            
            {/* Corner brackets */}
            <span className={`absolute top-2 left-2 w-3.5 h-3.5 border-t border-l border-${accent}/40 pointer-events-none`} />
            <span className={`absolute top-2 right-2 w-3.5 h-3.5 border-t border-r border-${accent}/40 pointer-events-none`} />
            <span className={`absolute bottom-2 left-2 w-3.5 h-3.5 border-b border-l border-${accent}/15 pointer-events-none`} />
            <span className={`absolute bottom-2 right-2 w-3.5 h-3.5 border-b border-r border-${accent}/15 pointer-events-none`} />

            {/* Header */}
            <div className={`relative z-10 flex items-center justify-between mb-6 border-b border-${accent}/10 pb-4`}>
                <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-md bg-${accent}/10 border border-${accent}/20 text-${accent}`}>
                        <Icon className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white tracking-widest uppercase">{title}</h3>
                        <p className={`text-[10px] font-bold text-${accent.replace('500', '400')} uppercase tracking-widest mt-0.5`}>{subtitle}</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-[200px]">
                {children}
            </div>
        </div>
    );
}

export function AiTrafficCard({ data }) {
    return (
        <CardWrapper title="Model Traffic" subtitle="Participation by requests" icon={BarChart3} colorClass="blue">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ left: -20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#CBD5E1', fontSize: 10, fontWeight: 500 }} width={80} />
                    <Tooltip 
                        cursor={{ fill: 'rgba(255,255,255,0.02)' }} 
                        contentStyle={{ backgroundColor: '#0d121f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px', color: '#fff' }} 
                        itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="requests" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={18} fillOpacity={0.8} />
                </BarChart>
            </ResponsiveContainer>
        </CardWrapper>
    );
}

export function AiHealthCard({ data, rate }) {
    return (
        <CardWrapper title="Cluster Health" subtitle={`${rate}% success ratio`} icon={Activity} colorClass="emerald">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={data} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value" stroke="none">
                        {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />)}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#0d121f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px', color: '#fff' }} 
                        itemStyle={{ color: '#fff' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                </PieChart>
            </ResponsiveContainer>
        </CardWrapper>
    );
}

export function AiTokenCard({ totalTokens, totalRequests }) {
    return (
        <CardWrapper title="Processing Load" subtitle="Lifetime cluster totals" icon={Cpu} colorClass="purple">
            <div className="flex flex-col justify-center h-full space-y-6">
                <div>
                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest block mb-2">Total Token Volume</span>
                    <div className="text-4xl font-black text-white font-mono leading-none tracking-tight">
                        {(totalTokens / 1000000).toFixed(2)}<span className="text-purple-500/80 text-xl ml-1">M</span>
                    </div>
                </div>
                <div className="pt-6 border-t border-purple-500/10">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Processed Requests</span>
                    <div className="text-2xl font-black text-white font-mono leading-none">
                        {totalRequests?.toLocaleString() || '0'}
                    </div>
                </div>
            </div>
        </CardWrapper>
    );
}
