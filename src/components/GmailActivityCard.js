'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { ExternalLink, Mail } from 'lucide-react';
import Link from 'next/link';

// Formatter for large numbers (K, M, B)
const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1
    }).format(num);
};

export default function GmailActivityCard({ data = [] }) {
    return (
        <div className="relative overflow-hidden rounded-2xl bg-[#0d121f]/50 backdrop-blur-xl border border-white/8 p-6 flex flex-col h-full group">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        <Mail className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white tracking-tight">Gmail Activity</h3>
                        <p className="text-xs text-gray-500">Messages vs Threads</p>
                    </div>
                </div>
                <Link href="/gmail-center" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-emerald-400 text-xs font-bold uppercase tracking-wider transition-colors">
                    View Details
                    <ExternalLink className="w-3.5 h-3.5" />
                </Link>
            </div>

            {/* Chart Area */}
            <div className="flex-1 min-h-[220px]">
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 600, dy: 10 }}
                            />
                            <YAxis
                                hide
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
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
                            <Bar
                                dataKey="value"
                                radius={[6, 6, 0, 0]}
                                barSize={48}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                                ))}
                                <LabelList
                                    dataKey="value"
                                    position="top"
                                    formatter={formatNumber}
                                    style={{ fill: '#fff', fontSize: '13px', fontWeight: 'bold' }}
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <Mail className="w-10 h-10 mb-3 opacity-20" />
                        <p className="text-sm">No Gmail activity available</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-gray-600">
                <span>Account Stats</span>
                <span className="text-emerald-500">Real-time</span>
            </div>
        </div>
    );
}
