'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Category, PredictionOption, PredictionMarket, PredictionStatus } from '@/types';
import { ChevronLeft, Plus, X, Sparkles, Loader2, Save, Download, Search } from 'lucide-react';
import type { PolymarketEventGroup } from '@/types';
import { extractSlugFromUrl } from '@/lib/utils';

type CreateMode = 'manual' | 'import';

export default function AdminCreatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: Category.TECH,
    closeDate: '',
    options: [{ text: '', externalProb: 0.5 }, { text: '', externalProb: 0.5 }]
  });

  const [mode, setMode] = useState<CreateMode>('manual');
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [slugInput, setSlugInput] = useState('');
  const [eventGroup, setEventGroup] = useState<PolymarketEventGroup | null>(null);
  const [selectedMarkets, setSelectedMarkets] = useState<Set<string>>(new Set());

  const handleAddOption = () => {
    setFormData({ ...formData, options: [...formData.options, { text: '', externalProb: 0 }] });
  };

  const handleRemoveOption = (index: number) => {
    const newOpts = [...formData.options];
    newOpts.splice(index, 1);
    setFormData({ ...formData, options: newOpts });
  };

  const handleOptionChange = (index: number, field: string, value: any) => {
    const newOpts = [...formData.options];
    (newOpts[index] as any)[field] = value;
    setFormData({ ...formData, options: newOpts });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Call Gemini API via Next.js API Route
      const optionTexts = formData.options.map(o => o.text);
      const analysisResponse = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          options: optionTexts,
        }),
      });

      if (!analysisResponse.ok) {
        throw new Error('AI 分析生成失败');
      }

      const { analysis } = await analysisResponse.json();

      // Find the index of the picked option
      const pickedIdx = optionTexts.findIndex(t =>
        analysis.pick.toLowerCase().includes(t.toLowerCase())
      );

      // Update options with AI probability
      const optionsWithAI: PredictionOption[] = formData.options.map((o, idx) => ({
        id: `opt-${Math.random().toString(36).substr(2, 9)}`,
        text: o.text,
        externalProb: o.externalProb,
        atypicaProb: idx === pickedIdx ? 0.7 : 0.3 / (formData.options.length - 1)
      }));

      const atypicaPickId = optionsWithAI[pickedIdx === -1 ? 0 : pickedIdx].id;

      const newMarket: PredictionMarket = {
        id: Math.random().toString(36).substr(2, 9),
        title: formData.title,
        description: formData.description,
        category: formData.category,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        closeDate: new Date(formData.closeDate).toISOString(),
        status: PredictionStatus.ACTIVE,
        options: optionsWithAI,
        atypicaPickId,
        atypicaAnalysis: analysis.reasoning,
        accuracyScore: analysis.score / 100,
        shareCount: 0,
        viewCount: 0
      };

      // Save market via API
      const saveResponse = await fetch('/api/markets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMarket),
      });

      if (!saveResponse.ok) {
        throw new Error('保存市场失败');
      }

      alert('市场创建成功！');
      router.push('/admin');
    } catch (error) {
      console.error('Error creating market:', error);
      alert(error instanceof Error ? error.message : '创建失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchPolymarket = async () => {
    if (!slugInput.trim()) {
      setImportError('请输入 Polymarket Event URL 或 Slug');
      return;
    }

    setImportLoading(true);
    setImportError(null);
    setEventGroup(null);

    try {
      const slug = extractSlugFromUrl(slugInput);
      const response = await fetch(`/api/polymarket/events/slug/${slug}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '获取失败');
      }

      const data: PolymarketEventGroup = await response.json();

      if (!data.markets || data.markets.length === 0) {
        throw new Error('该事件没有可用的子市场');
      }

      setEventGroup(data);

      const activeIds = data.markets.filter(m => m.active).map(m => m.id);
      setSelectedMarkets(new Set(activeIds));

    } catch (error) {
      setImportError(error instanceof Error ? error.message : '获取失败');
    } finally {
      setImportLoading(false);
    }
  };

  const handleToggleMarket = (marketId: string) => {
    setSelectedMarkets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(marketId)) {
        newSet.delete(marketId);
      } else {
        newSet.add(marketId);
      }
      return newSet;
    });
  };

  const handleToggleAll = () => {
    if (selectedMarkets.size === eventGroup?.markets.length) {
      setSelectedMarkets(new Set());
    } else {
      setSelectedMarkets(new Set(eventGroup?.markets.map(m => m.id)));
    }
  };

  const handleBatchImport = async () => {
    if (!eventGroup || selectedMarkets.size === 0) {
      setImportError('请至少选择一个市场');
      return;
    }

    setLoading(true);

    try {
      // Convert and save markets via batch API
      const response = await fetch('/api/markets/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventGroup,
          selectedIds: Array.from(selectedMarkets),
        }),
      });

      if (!response.ok) {
        throw new Error('批量导入失败');
      }

      alert(`成功导入 ${selectedMarkets.size} 个市场！`);
      router.push('/admin');
    } catch (error) {
      console.error('Error importing markets:', error);
      alert(error instanceof Error ? error.message : '导入失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <button
        onClick={() => router.push('/admin')}
        className="flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors font-medium"
      >
        <ChevronLeft className="w-4 h-4" />
        返回列表
      </button>

      <div className="glass-panel rounded-2xl p-8">
        <h1 className="text-2xl font-black text-white mb-8">创建新预测市场</h1>

        {/* Tab 切换 */}
        <div className="flex gap-2 mb-8 border-b border-white/10">
          <button
            onClick={() => setMode('manual')}
            className={`px-6 py-3 font-bold transition-all ${
              mode === 'manual'
                ? 'text-primary border-b-2 border-primary'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            手动创建
          </button>
          <button
            onClick={() => setMode('import')}
            className={`px-6 py-3 font-bold transition-all flex items-center gap-2 ${
              mode === 'import'
                ? 'text-primary border-b-2 border-primary'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            <Download className="w-4 h-4" />
            从 Polymarket 导入
          </button>
        </div>

        {/* 手动创建模式 */}
        {mode === 'manual' && (
          <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-white/80">预测标题</label>
            <input
              required
              placeholder="例如: 2026年最佳AI模型公司是？"
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-white/80">详细描述</label>
            <textarea
              required
              rows={4}
              placeholder="提供关于该预测话题的背景信息..."
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/80">分类</label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value as Category })}
              >
                {Object.entries(Category).map(([key, val]) => <option key={val} value={val} className="bg-slate-900">{val}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/80">截止日期</label>
              <input
                required
                type="date"
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={formData.closeDate}
                onChange={e => setFormData({ ...formData, closeDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-white/80">预测选项与外部概率</label>
              <button
                type="button"
                onClick={handleAddOption}
                className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> 添加选项
              </button>
            </div>

            <div className="space-y-3">
              {formData.options.map((opt, idx) => (
                <div key={idx} className="flex gap-3 items-center">
                  <input
                    required
                    placeholder={`选项 ${idx + 1}`}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={opt.text}
                    onChange={e => handleOptionChange(idx, 'text', e.target.value)}
                  />
                  <div className="w-24 relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      placeholder="概率"
                      className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/20 pr-8"
                      value={opt.externalProb}
                      onChange={e => handleOptionChange(idx, 'externalProb', parseFloat(e.target.value))}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/40 font-bold">%</span>
                  </div>
                  {formData.options.length > 2 && (
                    <button type="button" onClick={() => handleRemoveOption(idx)} className="p-2 text-white/30 hover:text-red-400">
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                正在调用 AI 生成深度分析报告...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-primary" />
                生成预测并保存
              </>
            )}
          </button>
        </form>
        )}

        {/* Polymarket 导入模式 */}
        {mode === 'import' && (
          <div className="space-y-6">
            {/* URL 输入 */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/80">
                Polymarket Event URL
              </label>
              <p className="text-xs text-white/50">
                支持完整 URL 或 Event Slug，系统会自动提取
              </p>
              <div className="flex gap-3">
                <input
                  placeholder="例如: https://polymarket.com/event/super-bowl-champion-2026 或 super-bowl-champion-2026"
                  className="flex-1 px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={slugInput}
                  onChange={e => setSlugInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleFetchPolymarket()}
                />
                <button
                  type="button"
                  onClick={handleFetchPolymarket}
                  disabled={importLoading}
                  className="px-6 py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-xl flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {importLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                  获取
                </button>
              </div>
            </div>

            {/* 错误提示 */}
            {importError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-700 font-medium">{importError}</p>
              </div>
            )}

            {/* Event Group 信息和市场选择 */}
            {eventGroup && (
              <div className="space-y-6">
                {/* Event 信息卡片 */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-3">
                  <div className="flex items-start gap-4">
                    {eventGroup.image && (
                      <img
                        src={eventGroup.image}
                        alt={eventGroup.title}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h2 className="text-lg font-black text-white">
                        {eventGroup.title}
                      </h2>
                      <p className="text-sm text-white/70 mt-1">
                        {eventGroup.description}
                      </p>
                      <div className="flex gap-4 mt-3 text-xs text-white/50">
                        <span>总市场数: {eventGroup.markets.length}</span>
                        <span>活跃: {eventGroup.markets.filter(m => m.active).length}</span>
                        <span>总交易量: ${eventGroup.volume.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 市场选择列表 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-white/80">
                      选择要导入的市场 ({selectedMarkets.size} / {eventGroup.markets.length})
                    </label>
                    <button
                      type="button"
                      onClick={handleToggleAll}
                      className="text-xs font-bold text-primary hover:text-primary/80"
                    >
                      {selectedMarkets.size === eventGroup.markets.length ? '全不选' : '全选'}
                    </button>
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-2 border border-white/10 rounded-xl p-3 bg-black/20">
                    {eventGroup.markets.map(market => {
                      const isSelected = selectedMarkets.has(market.id);
                      const probability = market.bestBid && market.bestAsk
                        ? ((market.bestBid + market.bestAsk) / 2 * 100).toFixed(1)
                        : 'N/A';

                      return (
                        <label
                          key={market.id}
                          className={`flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-primary/10 border-2 border-primary'
                              : 'bg-white/5 border border-white/10 hover:border-white/20'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleMarket(market.id)}
                            className="mt-1 w-4 h-4 text-primary rounded focus:ring-primary"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">
                                {market.question}
                              </span>
                              {!market.active && (
                                <span className="px-2 py-0.5 bg-white/10 text-white/60 text-xs font-bold rounded">
                                  已关闭
                                </span>
                              )}
                            </div>
                            <div className="flex gap-4 mt-2 text-xs text-white/50">
                              <span>概率: {probability}%</span>
                              <span>交易量: ${parseFloat(market.volume).toLocaleString()}</span>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* 导入按钮 */}
                <button
                  type="button"
                  onClick={handleBatchImport}
                  disabled={selectedMarkets.size === 0 || loading}
                  className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      正在导入...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      导入选中的 {selectedMarkets.size} 个市场
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
