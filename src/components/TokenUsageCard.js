'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ExternalLink, Cpu } from 'lucide-react';
import Link from 'next/link';

export default function TokenUsageCard({ data = [] }) {
    const total = data.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <div className="relative overflow-hidden rounded-lg bg-linear-to-b from-[#0a0e1a] to-[#07090f] border border-blue-500/20 p-6 flex flex-col h-full group shadow-[0_0_15px_rgba(59,130,246,0.05)]">
            {/* Top neon accent */}
            <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-blue-500/50 to-transparent pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity" />
            
            {/* Corner brackets */}
            <span className="absolute top-2 left-2 w-3.5 h-3.5 border-t border-l border-blue-500/40 pointer-events-none" />
            <span className="absolute top-2 right-2 w-3.5 h-3.5 border-t border-r border-blue-500/40 pointer-events-none" />
            <span className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b border-l border-blue-500/15 pointer-events-none" />
            <span className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b border-r border-blue-500/15 pointer-events-none" />

            {/* Gloss effect */}
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between mb-6 border-b border-blue-500/10 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400">
                        <Cpu className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white tracking-widest uppercase">Chatbot Token Usage</h3>
                        <p className="text-[10px] font-bold text-blue-400/60 uppercase tracking-widest mt-0.5">Resource allocation</p>
                    </div>
                </div>
                <Link href="/chatbot" className="p-1.5 rounded-md border border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-all shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                    <ExternalLink className="w-4 h-4" />
                </Link>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center relative min-h-[240px]">
                {total > 0 ? (
                    <>
                        {/* Center text for donut */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                            <span className="text-3xl font-black text-white">{total.toLocaleString()}</span>
                            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Total Tokens</span>
                        </div>

                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    itemStyle={{ color: '#fff' }}
                                    contentStyle={{
                                        backgroundColor: '#0d121f',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                                        fontSize: '12px',
                                        color: '#fff'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 z-10">
                        <Cpu className="w-10 h-10 mb-3 opacity-20" />
                        <span className="text-3xl font-black text-gray-700">0</span>
                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mt-1">Total Tokens</span>
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="relative z-10 grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-blue-500/10">
                {data.map((item) => (
                    <div key={item.name} className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: item.color, color: item.color }} />
                            <span className="text-[9px] font-black text-blue-400/60 uppercase tracking-[0.2em]">{item.name}</span>
                        </div>
                        <div className="text-[13px] font-black text-gray-200 pl-4">{item.value.toLocaleString()} <span className="text-[9px] text-blue-400/40 uppercase tracking-widest ml-1 font-bold">tokens</span></div>
                    </div>
                ))}
            </div>
        </div>
    );
}
