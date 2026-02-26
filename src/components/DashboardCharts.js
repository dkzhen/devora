'use client';


import {
 LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
 BarChart, Bar, Cell,
 PieChart, Pie, Legend
} from 'recharts';

export default function DashboardCharts({ data }) {
 if (!data) {
 return <div className="animate-pulse h-64 bg-gray-800 rounded-xl mb-6"></div>;
 }

 return (
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
 {/* Messages Over Time Line Chart */}
 <div className="bg-[#0f172a] p-6 rounded-2xl border border-white/8 shadow-sm col-span-1 lg:col-span-2">
 <h3 className="text-lg font-bold text-white mb-4">Messages Received (Last 24h)</h3>
 <div className="h-[300px] w-full">
 <ResponsiveContainer width="100%" height="100%">
 <LineChart data={data.totalRequests}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
 <XAxis
 dataKey="time"
 axisLine={false}
 tickLine={false}
 tick={{ fill: '#9CA3AF', fontSize: 12 }}
 dy={10}
 />
 <YAxis
 axisLine={false}
 tickLine={false}
 tick={{ fill: '#9CA3AF', fontSize: 12 }}
 />
 <Tooltip
 contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
 />
 <Line
 type="monotone"
 dataKey="requests"
 name="Messages"
 stroke="#3B82F6"
 strokeWidth={3}
 dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }}
 activeDot={{ r: 6 }}
 />
 </LineChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* Messages per Account Bar Chart */}
 <div className="bg-[#0f172a] p-6 rounded-2xl border border-white/8 shadow-sm">
 <h3 className="text-lg font-bold text-white mb-4">Messages per Account</h3>
 <div className="h-[300px] w-full">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={data.requestsByApi} layout="vertical">
 <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
 <XAxis type="number" hide />
 <YAxis
 dataKey="name"
 type="category"
 width={100}
 axisLine={false}
 tickLine={false}
 tick={{ fill: '#6B7280', fontSize: 12 }}
 />
 <Tooltip
 cursor={{ fill: 'transparent' }}
 contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
 />
 <Bar dataKey="value" name="Messages" radius={[0, 4, 4, 0]} barSize={20}>
 {data.requestsByApi.map((entry, index) => (
 <Cell key={`cell-${index}`} fill={entry.color || '#3B82F6'} />
 ))}
 </Bar>
 </BarChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* Account Status Pie Chart */}
 <div className="bg-[#0f172a] p-6 rounded-2xl border border-white/8 shadow-sm">
 <h3 className="text-lg font-bold text-white mb-4">Account Status</h3>
 <div className="h-[300px] w-full flex items-center justify-center">
 <ResponsiveContainer width="100%" height="100%">
 <PieChart>
 <Pie
 data={data.requestsByStatus}
 cx="50%"
 cy="50%"
 innerRadius={60}
 outerRadius={80}
 paddingAngle={5}
 dataKey="value"
 >
 {data.requestsByStatus.map((entry, index) => (
 <Cell key={`cell-${index}`} fill={entry.color} />
 ))}
 </Pie>
 <Tooltip
 contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
 />
 <Legend verticalAlign="bottom" height={36} iconType="circle" />
 </PieChart>
 </ResponsiveContainer>
 </div>
 </div>
 </div>
 );
}
