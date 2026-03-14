'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function AirdropActivity({ data = [], total = 0 }) {
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
                    <div className="w-1.5 h-6 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    <div>
                        <h3 className="text-sm font-black text-white tracking-widest uppercase">Top Airdrop Projects</h3>
                        <p className="text-[10px] font-bold text-blue-400/60 uppercase tracking-widest mt-0.5">Participation by task volume</p>
                    </div>
                </div>
                <Link href="/airdrops" className="p-1.5 rounded-md border border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-all shadow-[0_0_10px_rgba(59,130,246,0.1)]" title="View Details">
                    <ExternalLink className="w-4 h-4" />
                </Link>
            </div>

            {/* Chart Area */}
            <div className="flex-1 min-h-[240px]">
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} layout="vertical" margin={{ left: -20, right: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 500 }}
                                width={100}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                contentStyle={{
                                    backgroundColor: '#0d121f',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                                    fontSize: '12px',
                                    color: '#fff'
                                }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Bar dataKey="tasks" radius={[0, 4, 4, 0]} barSize={24}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <svg className="w-10 h-10 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        <p className="text-sm">No airdrop data available</p>
                    </div>
                )}
            </div>

            {/* Footer accent */}
            <div className="relative z-10 mt-4 pt-4 border-t border-blue-500/10 flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-blue-400/60 opacity-80">
                <span>Active Projects: <span className="text-blue-400">{total}</span></span>
                <span className="text-blue-500">Updated Live</span>
            </div>
        </div>
    );
}
