export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8 animate-pulse">
        <div className="h-12 bg-white/10 rounded w-1/3 mb-4"></div>
        <div className="h-6 bg-white/10 rounded w-1/2"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass-panel rounded-xl p-5 animate-pulse">
            <div className="h-6 bg-white/10 rounded mb-4"></div>
            <div className="h-32 bg-white/10 rounded mb-4"></div>
            <div className="h-4 bg-white/10 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
