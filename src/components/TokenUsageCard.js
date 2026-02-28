'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ExternalLink, Cpu } from 'lucide-react';
import Link from 'next/link';

export default function TokenUsageCard({ data = [] }) {
    const total = data.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <div className="relative overflow-hidden rounded-2xl bg-[#0d121f]/50 backdrop-blur-xl border border-white/8 p-6 flex flex-col h-full group">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                        <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white tracking-tight">Chatbot Token Usage</h3>
                        <p className="text-xs text-gray-500">Resource allocation</p>
                    </div>
                </div>
                <Link href="/chatbot" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-blue-400 transition-colors">
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
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/5">
                {data.map((item) => (
                    <div key={item.name} className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.name}</span>
                        </div>
                        <div className="text-sm font-bold text-gray-200 pl-4">{item.value.toLocaleString()} <span className="text-[10px] text-gray-600 font-medium">tokens</span></div>
                    </div>
                ))}
            </div>
        </div>
    );
}
