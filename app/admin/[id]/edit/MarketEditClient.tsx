'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PredictionMarket } from '@/types';

interface MarketEditClientProps {
  market: PredictionMarket;
}

export function MarketEditClient({ market }: MarketEditClientProps) {
  const router = useRouter();

  const [atypicaPickId, setAtypicaPickId] = useState<string | undefined>(
    market.atypicaPickId
  );
  const [description, setDescription] = useState<string>(
    market.description || ''
  );
  const [analysis, setAnalysis] = useState<string>(
    market.atypicaAnalysis || ''
  );
  const [summary, setSummary] = useState<string>(
    market.atypicaSummary || ''
  );
  const [analysisUrl, setAnalysisUrl] = useState<string>(
    market.atypicaAnalysisUrl || ''
  );
  const [accuracyPercent, setAccuracyPercent] = useState<string>(
    market.accuracyScore != null
      ? String(Math.round(market.accuracyScore * 100))
      : ''
  );
  const [optionProbs, setOptionProbs] = useState<
    { id: string; label: string; value: string }[]
  >(
    market.options.map((o) => ({
      id: o.id,
      label: o.text,
      value:
        o.atypicaProb != null ? String(Math.round(o.atypicaProb * 100)) : '',
    }))
  );
  const [saving, setSaving] = useState(false);

  const handleChangeOptionProb = (id: string, value: string) => {
    setOptionProbs((prev) =>
      prev.map((p) => (p.id === id ? { ...p, value } : p))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const accuracyScore =
        accuracyPercent.trim() === ''
          ? undefined
          : Math.max(
              0,
              Math.min(1, parseFloat(accuracyPercent) / 100 || 0)
            );

      const optionsPayload = optionProbs
        .map((p) => ({
          id: p.id,
          atypicaProb:
            p.value.trim() === ''
              ? undefined
              : Math.max(
                  0,
                  Math.min(1, parseFloat(p.value) / 100 || 0)
                ),
        }))
        // 只发送有值的，避免不必要的更新
        .filter((o) => o.atypicaProb !== undefined);

      const res = await fetch(`/api/markets/${market.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description || undefined,
          atypicaPickId: atypicaPickId || undefined,
          atypicaAnalysis: analysis || undefined,
          atypicaAnalysisUrl: analysisUrl || undefined,
          atypicaSummary: summary || undefined,
          accuracyScore,
          options: optionsPayload,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '保存失败');
      }

      alert('Atypica 信息已保存');
      router.push('/admin');
    } catch (error) {
      console.error('保存失败:', error);
      alert(error instanceof Error ? error.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <button
        type="button"
        onClick={() => router.push('/admin')}
        className="text-xs font-bold tracking-widest uppercase text-white/50 hover:text-white mb-6 flex items-center gap-1"
      >
        <span className="text-lg leading-none">←</span>
        返回列表
      </button>

      <div className="mb-8 space-y-2">
        <h1 className="text-2xl md:text-3xl font-black text-white">
          编辑 Atypica 信息
        </h1>
        <p className="text-xs md:text-sm text-white/60 max-w-2xl">
          仅修改 Atypica 相关字段，基础市场数据来自 Polymarket 或创建时的配置。
        </p>
      </div>

      <div className="glass-panel rounded-2xl p-6 md:p-8 space-y-8 border border-white/10">
        {/* 市场基础信息 */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-start">
          <div className="md:col-span-2 space-y-3">
            <h2 className="text-xs font-black text-white/60 tracking-[0.2em] uppercase">
              市场基础信息
            </h2>
            <div className="space-y-3 text-sm text-white/80">
              <div>
                <div className="text-[11px] text-white/50 mb-1">标题</div>
                <div className="font-semibold leading-snug">
                  {market.title}
                </div>
              </div>
              <div>
                <label className="text-[11px] text-white/50 mb-1 block">
                  描述
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full h-[300px] px-4 py-3 rounded-xl border border-white/20 bg-black/40 backdrop-blur-sm text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all resize-none leading-relaxed"
                  placeholder="输入市场描述..."
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-[11px] font-black text-white/60 tracking-[0.2em] uppercase">
              概览
            </h3>
            <div className="space-y-2 text-xs text-white/70">
                <div className="flex items-center justify-between bg-black/40 rounded-lg px-3 py-2 border border-white/20">
                <span className="text-white/60">状态</span>
                <span className="font-semibold text-white">{market.status}</span>
              </div>
              <div className="flex items-center justify-between bg-black/40 rounded-lg px-3 py-2 border border-white/20">
                <span className="text-white/60">截止日期</span>
                <span className="font-semibold text-white">
                  {new Date(market.closeDate).toLocaleDateString('zh-CN')}
                </span>
              </div>
              {market.externalSource && (
                <div className="flex items-center justify-between bg-black/40 rounded-lg px-3 py-2 border border-white/20">
                  <span className="text-white/60">来源</span>
                  <span className="font-semibold text-white truncate max-w-[8rem] text-right">
                    {market.externalSource}
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Atypica 选择与分析 */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-xs font-black text-white/60 tracking-[0.2em] uppercase">
              Atypica 预测设置
            </h2>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-white/70">
                Atypica 选择的结果（Pick）
              </label>
              <select
                value={atypicaPickId || ''}
                onChange={(e) =>
                  setAtypicaPickId(e.target.value || undefined)
                }
                className="w-full px-4 py-3 rounded-xl border border-white/20 bg-black/60 text-sm text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"
              >
                <option value="" className="bg-gray-900">（未选择）</option>
                {market.options.map((o) => (
                  <option key={o.id} value={o.id} className="bg-gray-900">
                    {o.text}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-white/70">
                Atypica Analysis
              </label>
              <textarea
                rows={5}
                value={analysis}
                onChange={(e) => setAnalysis(e.target.value)}
                placeholder="输入或粘贴 Atypica 的推理说明..."
                className="w-full px-4 py-3 rounded-xl border border-white/20 bg-black/60 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-white/70">
                Atypica Summary
              </label>
              <textarea
                rows={5}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="输入或粘贴 Atypica 的summary"
                className="w-full px-4 py-3 rounded-xl border border-white/20 bg-black/60 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-white/70">
                Atypica 分析报告链接（Analysis Report URL）
              </label>
              <input
                type="url"
                value={analysisUrl}
                onChange={(e) => setAnalysisUrl(e.target.value)}
                placeholder="https://example.com/analysis-report"
                className="w-full px-4 py-3 rounded-xl border border-white/20 bg-black/60 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"
              />
              <p className="text-[10px] text-white/40">
                输入 Atypica 分析报告的完整 URL 链接
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-white/70">
                准确度评分（0–100）
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={accuracyPercent}
                onChange={(e) => setAccuracyPercent(e.target.value)}
                placeholder="例如 82（内部将按 0–1 存储）"
                className="w-32 md:w-40 px-4 py-3 rounded-xl border border-white/20 bg-black/60 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>
          </section>

          {/* 选项级别概率 */}
          <section className="space-y-3">
            <h2 className="text-xs font-black text-white/60 tracking-[0.2em] uppercase">
              选项级 Atypica 概率（0–100%）
            </h2>
            <div className="space-y-1 text-[11px] text-white/50">
              <p>
                可为每个选项设置 Atypica 预测概率（百分比）。留空表示不设置 / 使用默认值。
              </p>
            </div>
            <div className="space-y-2">
              {optionProbs.map((opt) => (
                <div
                  key={opt.id}
                  className="flex items-center gap-3 bg-black/40 border border-white/20 rounded-xl px-3 py-2"
                >
                  <div className="flex-1 text-xs md:text-sm text-white/90">
                    {opt.label}
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={opt.value}
                      onChange={(e) =>
                        handleChangeOptionProb(opt.id, e.target.value)
                      }
                      className="w-20 px-3 py-2 rounded-xl border border-white/20 bg-black/60 text-xs text-white placeholder:text-white/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"
                    />
                    <span className="text-xs text-white/50">%</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push('/admin')}
              className="px-4 py-2 rounded-lg border border-white/15 text-xs md:text-sm text-white/70 hover:bg-white/5"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-primary text-black text-xs md:text-sm font-bold tracking-wide hover:bg-primary/90 disabled:opacity-60"
            >
              {saving ? '保存中...' : '保存 Atypica 信息'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


