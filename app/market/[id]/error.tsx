'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="glass-panel rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">出错了</h2>
        <p className="text-white/70 mb-6">{error.message || '加载市场详情时发生错误'}</p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-all"
        >
          重试
        </button>
      </div>
    </div>
  );
}
