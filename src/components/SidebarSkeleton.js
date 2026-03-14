export default function SidebarSkeleton() {
 return (
 <aside className="fixed left-0 top-0 h-full w-64 bg-[#040811] border-r border-blue-500/20 flex flex-col z-50 hidden md:flex animate-pulse shadow-[0_0_30px_rgba(59,130,246,0.08)]">
 <div className="p-6 flex items-center gap-3 border-b border-blue-500/10">
 <div className="w-8 h-8 rounded-lg bg-blue-900/40 border border-blue-500/20" />
 <div className="h-6 w-24 bg-blue-900/40 rounded" />
 </div>

 <nav className="flex-1 px-4 py-4 space-y-4">
 <div className="h-3 w-16 bg-blue-900/40 rounded px-2" />

 {[1, 2, 3].map((i) => (
 <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded">
 <div className="w-5 h-5 rounded bg-blue-900/40" />
 <div className="h-4 w-24 bg-blue-900/40 rounded" />
 </div>
 ))}
 </nav>

 <div className="p-4 border-t border-blue-500/10">
 <div className="w-full flex items-center gap-3 px-3 py-2.5 mb-4 rounded">
 <div className="w-5 h-5 rounded bg-blue-900/40" />
 <div className="h-4 w-20 bg-blue-900/40 rounded" />
 </div>

 <div className="flex items-center gap-3 p-2 rounded border border-blue-500/15">
 <div className="w-8 h-8 rounded bg-blue-900/40" />
 <div className="flex-1 space-y-2">
 <div className="h-3 w-20 bg-blue-900/40 rounded" />
 <div className="h-2 w-12 bg-blue-900/40 rounded" />
 </div>
 </div>
 </div>
 </aside>
 );
}
