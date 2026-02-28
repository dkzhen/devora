'use client';

import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell,
    PieChart, Pie, Legend
} from 'recharts';

export default function DashboardCharts({ data, hideSmallCharts = false }) {
    if (!data) {
        return <div className="animate-pulse h-64 bg-gray-800/20 rounded-2xl mb-6"></div>;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Messages Over Time Line Chart */}
            <div className={`p-6 rounded-2xl transition-all duration-300 ${hideSmallCharts ? 'col-span-1 lg:col-span-2 bg-transparent' : 'bg-[#0f172a] border border-white/8 shadow-sm col-span-1 lg:col-span-2'}`}>
                {!hideSmallCharts && <h3 className="text-lg font-bold text-white mb-6 tracking-tight text-center md:text-left">Messages Received (Last 24h)</h3>}
                <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.totalRequests}>
                            <defs>
                                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#3B82F6" />
                                    <stop offset="100%" stopColor="#22D3EE" />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                                dataKey="time"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                                dy={15}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                                dx={-10}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#0d121f',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                                    fontSize: '12px',
                                    color: '#fff'
                                }}
                                itemStyle={{ color: '#fff' }}
                                cursor={{ stroke: 'rgba(59,130,246,0.2)', strokeWidth: 2 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="requests"
                                name="Messages"
                                stroke="url(#lineGradient)"
                                strokeWidth={4}
                                dot={{ r: 0 }}
                                activeDot={{ r: 6, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }}
                                animationDuration={2000}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {!hideSmallCharts && (
                <>
                    {/* Messages per Account Bar Chart */}
                    <div className="bg-[#0f172a] p-6 rounded-2xl border border-white/8 shadow-sm">
                        <h3 className="text-lg font-bold text-white mb-6 tracking-tight">Messages per Account</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.requestsByApi} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={100}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    />
                                    <Bar dataKey="value" name="Messages" radius={[0, 4, 4, 0]} barSize={20}>
                                        {data.requestsByApi.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color || '#3B82F6'} fillOpacity={0.8} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Account Status Pie Chart */}
                    <div className="bg-[#0f172a] p-6 rounded-2xl border border-white/8 shadow-sm">
                        <h3 className="text-lg font-bold text-white mb-6 tracking-tight">Account Status</h3>
                        <div className="h-[300px] w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.requestsByStatus}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={10}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {data.requestsByStatus.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 600, color: '#94a3b8' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
