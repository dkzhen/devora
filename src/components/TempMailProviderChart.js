'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Server, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const THEME = {
    bg: 'from-[#0a0e1a] to-[#07090f]',
    border: 'border-cyan-500/20',
    glow: 'shadow-[0_0_20px_rgba(6,182,212,0.08)]',
    accentLine: 'via-cyan-500/60',
    bracketStrong: 'border-cyan-500/50',
    bracketWeak: 'border-cyan-500/15',
    headerIcon: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
    headerBorder: 'border-cyan-500/10',
    subtext: 'text-cyan-400/70',
    linkBtn: 'border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.15)]',
};

const COLORS = {
    'Mail.tm': '#06b6d4',
    'MoeMail': '#a855f7',
};

export default function TempMailProviderChart({ allEmails = [] }) {
    const [providerData, setProviderData] = useState([]);
    const [totalEmails, setTotalEmails] = useState(0);

    useEffect(() => {
        if (allEmails.length > 0) {
            // Count by provider
            const mailTmCount = allEmails.filter(email => 
                !email.address.includes('zenra.my.id') && !email.address.includes('moemail')
            ).length;
            
            const moeMailCount = allEmails.filter(email => 
                email.address.includes('zenra.my.id') || email.address.includes('moemail')
            ).length;

            const chartData = [];
            if (mailTmCount > 0) {
                chartData.push({ name: 'Mail.tm', value: mailTmCount, percentage: ((mailTmCount / allEmails.length) * 100).toFixed(1) });
            }
            if (moeMailCount > 0) {
                chartData.push({ name: 'MoeMail', value: moeMailCount, percentage: ((moeMailCount / allEmails.length) * 100).toFixed(1) });
            }

            setProviderData(chartData);
            setTotalEmails(allEmails.length);
        }
    }, [allEmails]);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#0d121f] border border-cyan-500/20 rounded-lg p-3 shadow-xl">
                    <p className="text-white font-bold text-sm mb-1">{payload[0].name}</p>
                    <p className="text-cyan-400 text-xs">
                        {payload[0].value} emails ({payload[0].payload.percentage}%)
                    </p>
                </div>
            );
        }
        return null;
    };

    const CustomLegend = ({ payload }) => {
        return (
            <div className="flex flex-col gap-2 mt-4">
                {payload.map((entry, index) => (
                    <div key={`legend-${index}`} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center gap-2">
                            <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-xs font-bold text-slate-300">{entry.value}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-white">{entry.payload.value}</span>
                            <span className="text-[10px] font-bold text-slate-500">({entry.payload.percentage}%)</span>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className={`relative overflow-hidden rounded-lg bg-linear-to-b ${THEME.bg} border ${THEME.border} p-6 flex flex-col h-full ${THEME.glow}`}>
            {/* Top neon accent */}
            <div className={`absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent ${THEME.accentLine} to-transparent pointer-events-none opacity-60`} />
            
            {/* Corner brackets */}
            <span className={`absolute top-2 left-2 w-3.5 h-3.5 border-t border-l ${THEME.bracketStrong} pointer-events-none`} />
            <span className={`absolute top-2 right-2 w-3.5 h-3.5 border-t border-r ${THEME.bracketStrong} pointer-events-none`} />
            <span className={`absolute bottom-2 left-2 w-3.5 h-3.5 border-b border-l ${THEME.bracketWeak} pointer-events-none`} />
            <span className={`absolute bottom-2 right-2 w-3.5 h-3.5 border-b border-r ${THEME.bracketWeak} pointer-events-none`} />

            {/* Header */}
            <div className={`relative z-10 flex items-center justify-between mb-6 border-b ${THEME.headerBorder} pb-4`}>
                <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-md ${THEME.headerIcon}`}>
                        <Server className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-white tracking-widest uppercase">Provider Distribution</h3>
                        <p className={`text-[10px] font-bold ${THEME.subtext} uppercase tracking-widest mt-0.5`}>Email Service Breakdown</p>
                    </div>
                </div>
                <Link href="/temp-mail" className={`p-1.5 rounded-md border ${THEME.linkBtn}`} title="View Temp Mail">
                    <ExternalLink className="w-4 h-4" />
                </Link>
            </div>

            {/* Chart Area */}
            <div className="flex-1 flex flex-col items-center justify-center min-h-[280px]">
                {providerData.length > 0 ? (
                    <>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={providerData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {providerData.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={COLORS[entry.name]} 
                                            opacity={0.9}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        
                        {/* Center text */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                            <div className="text-3xl font-black text-white">{totalEmails}</div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total</div>
                        </div>

                        {/* Legend */}
                        <div className="w-full">
                            <CustomLegend payload={providerData.map((entry, index) => ({
                                value: entry.name,
                                color: COLORS[entry.name],
                                payload: entry
                            }))} />
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500 py-8">
                        <div className="w-16 h-16 rounded-full bg-cyan-500/5 border border-cyan-500/20 flex items-center justify-center mb-3">
                            <Server className="w-8 h-8 opacity-30" />
                        </div>
                        <p className="text-sm font-medium">No provider data</p>
                        <p className="text-xs text-slate-600 mt-1">Generate emails to see distribution</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className={`relative z-10 mt-4 pt-4 border-t ${THEME.headerBorder} flex items-center justify-between text-[10px] uppercase font-bold tracking-widest ${THEME.subtext} opacity-80`}>
                <span>Active Providers: {providerData.length}</span>
                <span className="text-cyan-500">Real-time</span>
            </div>
        </div>
    );
}
