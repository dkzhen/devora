'use client';

export default function StatCard({ title, value, icon, color }) {
    const colors = {
        blue: { glow: 'bg-blue-600/10', border: 'border-blue-500/20', text: 'text-blue-400', orb: 'bg-blue-600/15' },
        purple: { glow: 'bg-purple-600/10', border: 'border-purple-500/20', text: 'text-purple-400', orb: 'bg-purple-600/15' },
        orange: { glow: 'bg-orange-600/10', border: 'border-orange-500/20', text: 'text-orange-400', orb: 'bg-orange-600/15' },
        green: { glow: 'bg-emerald-600/10', border: 'border-emerald-500/20', text: 'text-emerald-400', orb: 'bg-emerald-600/15' },
        indigo: { glow: 'bg-indigo-600/10', border: 'border-indigo-500/20', text: 'text-indigo-400', orb: 'bg-indigo-600/15' },
    };

    const c = colors[color] || colors.blue;

    return (
        <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-6 hover:border-white/15 transition-all duration-300 group">
            {/* Glow orb */}
            <div className={`absolute -top-6 -right-6 w-28 h-28 rounded-full ${c.orb} blur-2xl pointer-events-none transition-all group-hover:scale-125`} />
            <div className="relative z-10 flex items-start justify-between">
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">{title}</p>
                    <h3 className="text-3xl font-black text-white tracking-tight">{value}</h3>
                </div>
                <div className={`w-11 h-11 rounded-xl ${c.glow} ${c.border} border flex items-center justify-center shrink-0 ${c.text}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}
