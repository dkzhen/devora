'use client';

export default function StatCard({ title, value, icon, color, flat = false }) {
    const colors = {
        blue: { glow: 'bg-blue-600/10', border: 'border-blue-500/20', text: 'text-blue-400', orb: 'bg-blue-600/15', solid: 'border-blue-400' },
        purple: { glow: 'bg-purple-600/10', border: 'border-purple-500/20', text: 'text-purple-400', orb: 'bg-purple-600/15', solid: 'border-purple-400' },
        orange: { glow: 'bg-orange-600/10', border: 'border-orange-500/20', text: 'text-orange-400', orb: 'bg-orange-600/15', solid: 'border-orange-400' },
        green: { glow: 'bg-emerald-600/10', border: 'border-emerald-500/20', text: 'text-emerald-400', orb: 'bg-emerald-600/15', solid: 'border-emerald-400' },
        indigo: { glow: 'bg-indigo-600/10', border: 'border-indigo-500/20', text: 'text-indigo-400', orb: 'bg-indigo-600/15', solid: 'border-indigo-400' },
        unicorn_yellow: { glow: 'bg-[#f7f0ac]/10', border: 'border-[#f7f0ac]/30', text: 'text-[#f7f0ac]', orb: 'bg-[#f7f0ac]/15', solid: 'border-[#f7f0ac]' },
        unicorn_cyan: { glow: 'bg-[#acf7f0]/10', border: 'border-[#acf7f0]/30', text: 'text-[#acf7f0]', orb: 'bg-[#acf7f0]/15', solid: 'border-[#acf7f0]' },
        unicorn_pink: { glow: 'bg-[#f0acf7]/10', border: 'border-[#f0acf7]/30', text: 'text-[#f0acf7]', orb: 'bg-[#f0acf7]/15', solid: 'border-[#f0acf7]' },
    };

    const c = colors[color] || colors.blue;
    const roundedClass = flat ? `rounded-none border-t-2 ${c.solid}` : 'rounded-2xl border';
    const bgClass = flat ? 'bg-[#0f172a]/60 backdrop-blur-md hover:bg-[#0f172a]/80 border-white/5 border-l border-r border-b' : 'bg-linear-to-br from-[#0f172a] to-[#1e293b] border-white/8 hover:border-white/15';

    return (
        <div className={`relative overflow-hidden ${roundedClass} ${bgClass} p-4 md:p-6 transition-all duration-300 group`}>
            {/* Glow orb */}
            <div className={`absolute -top-6 -right-6 w-20 h-20 md:w-28 md:h-28 rounded-full ${c.orb} blur-2xl pointer-events-none transition-all group-hover:scale-125`} />
            <div className="relative z-10 flex items-start justify-between">
                <div>
                    <p className={`text-[9px] md:text-xs font-bold uppercase tracking-widest mb-1 md:mb-2 ${flat ? c.text : 'text-gray-500'} pr-2`}>{title}</p>
                    <h3 className="text-xl md:text-3xl font-black text-white tracking-tight">{value}</h3>
                </div>
                <div className={`w-8 h-8 md:w-11 md:h-11 ${flat ? 'rounded-none border-2' : 'rounded-xl border'} ${c.glow} ${c.border} flex items-center justify-center shrink-0 ${c.text}`}>
                    <div className="scale-75 md:scale-100 flex items-center justify-center">
                        {icon}
                    </div>
                </div>
            </div>
        </div>
    );
}
