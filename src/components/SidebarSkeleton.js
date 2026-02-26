export default function SidebarSkeleton() {
 return (
 <aside className="fixed left-0 top-0 h-full w-64 bg-[#0f172a] border-r border-white/8 flex flex-col z-50 hidden md:flex animate-pulse">
 <div className="p-6 flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-gray-700" />
 <div className="h-6 w-24 bg-gray-700 rounded" />
 </div>

 <nav className="flex-1 px-4 py-4 space-y-4">
 <div className="h-3 w-16 bg-gray-700 rounded px-2" />

 {[1, 2, 3].map((i) => (
 <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
 <div className="w-5 h-5 rounded bg-gray-700" />
 <div className="h-4 w-24 bg-gray-700 rounded" />
 </div>
 ))}
 </nav>

 <div className="p-4 border-t border-white/8">
 <div className="w-full flex items-center gap-3 px-3 py-2.5 mb-4 rounded-lg">
 <div className="w-5 h-5 rounded bg-gray-700" />
 <div className="h-4 w-20 bg-gray-700 rounded" />
 </div>

 <div className="flex items-center gap-3 p-2 rounded-xl border border-white/8">
 <div className="w-8 h-8 rounded-full bg-gray-700" />
 <div className="flex-1 space-y-2">
 <div className="h-3 w-20 bg-gray-700 rounded" />
 <div className="h-2 w-12 bg-gray-700 rounded" />
 </div>
 </div>
 </div>
 </aside>
 );
}
