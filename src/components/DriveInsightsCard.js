'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ExternalLink, HardDrive } from 'lucide-react';
import Link from 'next/link';

export default function DriveInsightsCard({ data }) {
    const summary = data?.summary || { totalStorage: '0 B', totalFiles: 0, connectedAccounts: 0 };
    const fileTypes = data?.fileTypes || [];
    const filesPerAccount = data?.filesPerAccount || [];

    return (
        <div className="relative overflow-hidden rounded-2xl bg-[#0d121f]/50 backdrop-blur-xl border border-white/8 p-6 flex flex-col h-full group">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                        <HardDrive className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white tracking-tight">Drive Insights</h3>
                        <p className="text-xs text-gray-500">Storage & File Analytics</p>
                    </div>
                </div>
                <Link href="/drive" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-purple-400 text-xs font-bold uppercase tracking-wider transition-colors">
                    View Details
                    <ExternalLink className="w-3.5 h-3.5" />
                </Link>
            </div>

            {/* Top Summary Metrics */}
            <div className="grid grid-cols-3 gap-4 mb-6 relative z-10">
                <div className="bg-black/20 rounded-xl p-3 border border-white/5 text-center">
                    <p className="text-lg font-black text-white">{summary.totalStorage}</p>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Storage</p>
                </div>
                <div className="bg-black/20 rounded-xl p-3 border border-white/5 text-center">
                    <p className="text-lg font-black text-white">{summary.totalFiles.toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Files</p>
                </div>
                <div className="bg-black/20 rounded-xl p-3 border border-white/5 text-center">
                    <p className="text-lg font-black text-white">{summary.connectedAccounts}</p>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Accounts</p>
                </div>
            </div>

            <div className="flex-1 flex flex-col gap-6">
                {/* Donut Chart - File Types */}
                <div className="flex-1 relative min-h-[160px] flex items-center justify-center">
                    {fileTypes.length > 0 ? (
                        <div className="absolute inset-0 w-full h-full flex flex-col items-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={fileTypes}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={70}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {fileTypes.map((entry, index) => (
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
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-gray-500">
                            <p className="text-sm">No files indexed</p>
                        </div>
                    )}
                </div>

                {/* Donut Chart Legend */}
                {fileTypes.length > 0 && (
                    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                        {fileTypes.map((item) => (
                            <div key={item.name} className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-[10px] font-bold text-gray-400 tracking-wider"><span className="text-gray-200">{item.value}</span> {item.name}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Small Bar Chart - Files per Account */}
                {filesPerAccount.length > 0 && (
                    <div className="h-[90px] w-full mt-2 pt-4 border-t border-white/5">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Top Accounts</span>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={filesPerAccount} layout="vertical" margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.02)" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 500 }} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                    itemStyle={{ color: '#fff' }}
                                    contentStyle={{
                                        backgroundColor: '#0d121f',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
                                        fontSize: '11px',
                                        color: '#fff',
                                        padding: '4px 8px'
                                    }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={8}>
                                    {filesPerAccount.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color || '#8B5CF6'} fillOpacity={0.8} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    );
}
