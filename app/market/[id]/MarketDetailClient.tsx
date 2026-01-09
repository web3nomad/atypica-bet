'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PredictionMarket, PredictionStatus } from '@/types';
import { CATEGORY_LABELS, STATUS_LABELS } from '@/constants';
import { AccuracyMeter } from '@/components/AccuracyMeter';
import {
  ChevronLeft, Share2, ShieldCheck, Copy,
  Check, ChevronDown, ChevronUp, Clock,
  RefreshCw, MessageSquare, Heart, ArrowRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface MarketDetailClientProps {
  market: PredictionMarket;
}

export default function MarketDetailClient({ market }: MarketDetailClientProps) {
  const router = useRouter();
  const [expandedSection, setExpandedSection] = useState<string | null>('overview');
  const [copied, setCopied] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<string>("");
  const [isNearDeadline, setIsNearDeadline] = useState<boolean>(false);
  const [priceChange, setPriceChange] = useState<number>(0); // 波动比例（占位数据）

  useEffect(() => {
    if (market.status !== PredictionStatus.ACTIVE) return;

    const updateCountdown = () => {
      const now = new Date();
      const closeDate = new Date(market.closeDate);
      const timeRemaining = closeDate.getTime() - now.getTime();

      const isNear = timeRemaining < 48 * 60 * 60 * 1000;
      setIsNearDeadline(isNear);

      if (timeRemaining <= 0) {
        setCountdown("Ended");
        return;
      }

      const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setCountdown(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m`);
      } else {
        setCountdown(`${minutes}m`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [market.closeDate, market.status]);

  const data = market.options.map(opt => ({
    name: opt.text,
    external: Math.round((opt.externalProb || 0) * 100),
    atypica: Math.round((opt.atypicaProb || 0) * 100),
    id: opt.id,
    isAtypicaPick: opt.id === market.atypicaPickId
  }));

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 格式化更新时间
  useEffect(() => {
    const formatUpdateTime = () => {
      const now = new Date();
      const month = now.getMonth() + 1;
      const day = now.getDate();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const formattedMinutes = minutes.toString().padStart(2, '0');
      return `${month}/${day} ${hours}:${formattedMinutes}`;
    };
    
    setLastUpdated(formatUpdateTime());
  }, [isRefreshing]);

  // 占位数据：波动比例（后续会联动后端）
  useEffect(() => {
    // TODO: 联动后端接入实际数据
    setPriceChange(5.2); // 占位数据：+5.2%
  }, [market.id]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      const now = new Date();
      const month = now.getMonth() + 1;
      const day = now.getDate();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const formattedMinutes = minutes.toString().padStart(2, '0');
      setLastUpdated(`${month}/${day} ${hours}:${formattedMinutes}`);
    }, 800);
  };

  // 计算 Model Confidence 等级（0-3，对应0-3条横线）
  const getConfidenceLevel = (score: number): number => {
    if (score >= 0.85) return 3;
    if (score >= 0.65) return 2;
    if (score >= 0.45) return 1;
    return 0;
  };

  const confidenceLevel = getConfidenceLevel(market.accuracyScore || 0);

  const pickedOption = market.options.find(o => o.id === market.atypicaPickId);

  return (
    <div className="max-w-5xl mx-auto px-6 py-20">
      <button
        onClick={() => router.push('/')}
        className="group flex items-center gap-2 text-muted hover:text-white transition-colors font-bold text-[10px] uppercase tracking-[0.2em] mb-12"
      >
        <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
        Return to Matrix Grid
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-12">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-white/60 text-[10px] font-bold uppercase tracking-[0.2em]">
                  {CATEGORY_LABELS[market.category]}
                </span>
                {market.status === PredictionStatus.ACTIVE && isNearDeadline && (
                  <>
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/5 border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                      Ending Soon
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-amber-400 text-[10px] font-bold">
                      <Clock className="w-3 h-3" />
                      {countdown}
                    </span>
                  </>
                )}
                {market.status !== PredictionStatus.ACTIVE || !isNearDeadline ? (
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-white/60 text-[10px] font-bold uppercase tracking-[0.2em]">
                    {STATUS_LABELS[market.status]}
                  </span>
                ) : null}
              </div>

              <div className="flex items-center bg-white/[0.03] px-3 py-1.5 rounded-full">
                <RefreshCw className={`w-3.5 h-3.5 mr-2 text-muted ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="text-[10px] font-bold text-white/80">
                  Updated {isRefreshing ? "now" : lastUpdated}
                </span>
              </div>
            </div>

            <div className="relative">
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[1.1] text-header">
                {market.title}
              </h1>
              <a
                href={market.externalSource || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-0 right-0 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors group"
              >
                View Research
                <ArrowRight className="w-3 h-3 translate-x-0 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
            <p className="text-muted text-xl font-medium leading-relaxed">
              {market.atypicaAnalysis}
            </p>

            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2 text-[11px] text-muted">
                <MessageSquare className="w-4 h-4" />
                <span>{market.viewCount} Views</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted">
                <Heart className="w-4 h-4" />
                <span>{Math.floor(market.shareCount / 2)} Likes</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted">
                <Share2 className="w-4 h-4" />
                <span>{market.shareCount} Shares</span>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-8 border border-white/5">
            <div className="flex items-center justify-between mb-10">
              <div className="space-y-1">
                <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">Probability Matrix</h2>
                <p className="text-[9px] text-muted font-bold uppercase tracking-widest">Weighted Comparative Analysis</p>
              </div>
              <div className="flex gap-4 text-[9px] font-black uppercase tracking-widest text-muted">
                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-white/10 rounded-full" /> Market Average</div>
                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_10px_rgba(24,255,25,0.3)]" /> Atypica Model</div>
              </div>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ left: 0, right: 30 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 9, fontWeight: 700, fill: '#666' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.01)' }} contentStyle={{ background: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '9px' }} />
                  <Bar dataKey="external" fill="rgba(255,255,255,0.05)" radius={[0, 2, 2, 0]} barSize={8} />
                  <Bar dataKey="atypica" radius={[0, 2, 2, 0]} barSize={8}>
                    {data.map((entry, index) => <Cell key={index} fill={entry.isAtypicaPick ? '#18FF19' : '#ffffff'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel rounded-2xl p-6 border-primary/20">
            <div className="flex flex-col space-y-6">
              {/* Atypical 的选择 */}
              <div className="text-center mb-6">
                <div className="text-[9px] text-muted font-bold uppercase tracking-[0.3em] mb-2">Atypica Choice</div>
                <div className="text-2xl font-black text-primary leading-tight bg-primary/10 px-4 py-3 rounded-lg border border-primary/30">
                  {pickedOption?.text || 'N/A'}
                </div>
              </div>

              {/* Market 比例圆环 */}
              <div className="flex justify-center mb-6">
                <AccuracyMeter
                  value={pickedOption?.externalProb || 0}
                  size="lg"
                  showDualRing={false}
                  showLabel={true}
                  labelPrefix="Market"
                />
              </div>

              {/* 波动比例 */}
              <div className="text-center mb-6">
                <div className="text-[8px] text-muted font-bold uppercase tracking-widest mb-2">Price Change</div>
                <div className={`text-2xl font-black ${priceChange >= 0 ? 'text-primary' : 'text-red-400'} leading-tight`}>
                  {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(1)}%
                </div>
              </div>

              {/* Model Confidence - 三个短横线 */}
              <div className="text-center border-t border-white/10 pt-6">
                <div className="text-[8px] text-muted font-bold uppercase tracking-widest mb-3">Model Confidence</div>
                <div className="flex items-center justify-center gap-2">
                  {[0, 1, 2].map((index) => (
                    <div
                      key={index}
                      className={`h-1 rounded-full transition-all ${
                        index < confidenceLevel
                          ? 'bg-primary w-8'
                          : 'bg-white/20 w-8'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="glass-panel rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedSection(expandedSection === 'overview' ? null : 'overview')}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-white">Contextual Matrix</span>
                {expandedSection === 'overview' ? <ChevronUp className="w-3.5 h-3.5 text-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-muted" />}
              </button>
              {expandedSection === 'overview' && (
                <div className="px-6 pb-5 text-muted text-[12px] leading-relaxed">
                  {market.description}
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex flex-wrap gap-3">
            <button onClick={handleCopyLink} className="flex-1 btn-outline py-2.5 text-[10px] font-bold uppercase tracking-widest">
              {copied ? <Check className="w-3 h-3 mx-auto" /> : 'Copy Report Link'}
            </button>
            <button className="p-2.5 btn-outline text-muted hover:text-white">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
