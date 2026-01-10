export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="glass-panel rounded-2xl p-8 animate-pulse">
        <div className="h-8 bg-white/10 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-white/10 rounded w-1/2 mb-8"></div>
        <div className="space-y-4">
          <div className="h-32 bg-white/10 rounded"></div>
          <div className="h-32 bg-white/10 rounded"></div>
        </div>
      </div>
    </div>
  );
}
