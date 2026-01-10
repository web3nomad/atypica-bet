export default function NotFound() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="glass-panel rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">404 - 市场未找到</h2>
        <p className="text-white/70 mb-6">抱歉，您查找的预测市场不存在或已被删除。</p>
        <a
          href="/"
          className="inline-block px-6 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-all"
        >
          返回首页
        </a>
      </div>
    </div>
  );
}
