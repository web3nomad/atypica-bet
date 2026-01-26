'use client'
import React, { useState, useEffect } from 'react';
import { PredictionMarket, Category, PredictionStatus } from '../types';
import { CATEGORY_LABELS, STATUS_LABELS } from '../constants';
import { AccuracyMeter } from './AccuracyMeter';
import { Calendar, ArrowRight, Target, Zap, RefreshCw, MessageSquare, Heart, Share2, Clock, DollarSign, AlertTriangle, Info, Tag } from 'lucide-react';
import { useLightCard } from '../hooks/useLightCard';

interface PredictionCardProps {
  market: PredictionMarket;
  onClick: (id: string) => void;
  featured?: boolean;
  marketLabel?: string; // A, B, C 等标签
}

export const PredictionCard: React.FC<PredictionCardProps> = ({ market, onClick, featured = false, marketLabel }) => {
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [isNearDeadline, setIsNearDeadline] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

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

  const { cardRef: lightCardRef, lightStyle, isHovered } = useLightCard({
    light: {
      color: 'rgba(255, 179, 71, 0.4)',
      width: 100,
      height: 100,
      blur: 60
    }
  });

  // Calculate time remaining until close date
  useEffect(() => {
    if (market.status !== PredictionStatus.ACTIVE) return;

    const updateCountdown = () => {
      const now = new Date();
      const closeDate = new Date(market.closeDate);
      const timeRemaining = closeDate.getTime() - now.getTime();

      // Check if within 48 hours of deadline
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
      } else {
        setCountdown(`${hours}h ${minutes}m`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [market.closeDate, market.status]);

  const getStatusColor = (status: PredictionStatus) => {
    switch (status) {
      case PredictionStatus.ACTIVE: return isNearDeadline ? 'text-amber-400 border-amber-500/30 bg-amber-500/5' : 'text-white border-white/20';
      case PredictionStatus.SUCCESSFUL: return 'text-primary border-primary/30 bg-primary/5';
      default: return 'text-muted border-white/10';
    }
  };

  const getConfidenceLevel = (probability: number) => {
    if (probability >= 0.8) return "High";
    if (probability >= 0.6) return "Medium";
    if (probability >= 0.4) return "Moderate";
    return "Low";
  };

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRefreshing(true);
    // Simulate refresh - in a real implementation, this would fetch updated data
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

  const renderConfidenceIndicator = (probability: number) => {
    // 根据概率值决定哪个 bar 高亮
    // 0-40%: 第一个 bar 高亮 (低置信度)
    // 40-70%: 第二个 bar 高亮 (中置信度)
    // 70-100%: 第三个 bar 高亮 (高置信度)
    const percent = probability * 100;
    let activeBar: 1 | 2 | 3 = 1; // 默认第一个

    if (percent >= 70) {
      activeBar = 3; // 第三个
    } else if (percent >= 40) {
      activeBar = 2; // 第二个
    } else {
      activeBar = 1; // 第一个
    }

    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 mb-0.5">
          <div className="w-1 h-1 rounded-full bg-primary"></div>
          <div className="text-xs font-semibold text-white/70">Prediction confidence</div>
        </div>
        <div className="flex gap-1.5 items-center">
          {/* 第一个 bar */}
          <div
            className={`h-2 w-7 rounded-sm transition-all ${activeBar >= 1
              ? 'bg-primary'
              : 'bg-white'
              }`}
          />
          {/* 第二个 bar */}
          <div
            className={`h-2 w-7 rounded-sm transition-all ${activeBar >= 2
              ? 'bg-primary'
              : 'bg-white'
              }`}
          />
          {/* 第三个 bar */}
          <div
            className={`h-2 w-7 rounded-sm transition-all ${activeBar >= 3
              ? 'bg-primary'
              : 'bg-white'
              }`}
          />
        </div>
      </div>
    );
  };

  const pickedOption = market.options.find(o => o.id === market.atypicaPickId);
  const marketLeader = market.options.reduce((prev, current) =>
    (current.externalProb || 0) > (prev.externalProb || 0) ? current : prev
  );

  // Check if this is a Yes/No prediction (Polymarket style)
  const isYesNoOption = market.options.length === 2 &&
    (market.options[0].text.toLowerCase() === "yes" || market.options[0].text.toLowerCase() === "no") &&
    (market.options[1].text.toLowerCase() === "yes" || market.options[1].text.toLowerCase() === "no");

  // Format pool amount with K/M abbreviations
  const formatAmount = (amount: number): string => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toFixed(0);
  };

  const formattedPoolAmount = market.poolAmount
    ? formatAmount(market.poolAmount)
    : null;

  return (
    <div
      ref={lightCardRef}
      onClick={() => {
        // 详情页未完成，暂时禁用点击
        onClick(market.id)
      }}
      className={`group cursor-pointer glass-panel glass-effect spotlight-card rounded-xl transition-all duration-300 hover:border-white/20 p-5 cursor-follow card-layered relative overflow-hidden ${market.status === PredictionStatus.SUCCESSFUL ? 'success-glow' : ''
        }`}
    >
      {isHovered && <div style={lightStyle} />}
      {/* 防误解锚点 - Header with AI prediction disclaimer */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            {/* Market Label */}
            <div className="relative w-7 h-7 rounded-md border-[0.5px] border-primary flex items-center justify-center bg-transparent">
                <span className="text-[11px] font-bold text-white">{marketLabel}</span>
                <Zap className="absolute -bottom-1 -right-1 w-3 h-3 text-primary" />
              </div>
            <span className="text-[12px] font-bold text-primary">AI Prediction</span>
          </div>
          <div className="flex items-center text-[9px] text-white/50 gap-1">
            <Tag className="w-3 h-3 text-white/40" />
            <span>{CATEGORY_LABELS[market.category]}</span>
          </div>
        </div>
        <p className="text-[10px] text-muted text-left">Based on simulated agent behavior</p>
      </div>

      {/* Prediction Question */}
      <h3 className="text-lg font-semibold text-white leading-snug mb-4 flex items-start gap-3 h-12">
        {market.polyMarketIcon && (
          <img
            src={market.polyMarketIcon}
            alt=""
            className="w-6 h-6 rounded object-cover flex-shrink-0"
            onError={(e) => {
              // 如果图片加载失败，隐藏图片
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
        <div className="line-clamp-2">{market.title}</div>
      </h3>

      {/* Main Prediction Box */}
      {pickedOption && (
        <div className="mb-4 bg-white/[0.03] border border-white/10 rounded-xl p-6 card-layer-2 relative">
          {/* 左侧内容：左对齐 */}
          <div className="flex flex-col items-start">
            <div className="text-[11px] text-white/70 mb-2">AI Prediction</div>
            <div className="text-3xl md:text-4xl font-bold text-white leading-tight break-words mb-4">{pickedOption.text}</div>

            {/* Prediction confidence 和 Odds 同一行 */}
            {pickedOption.atypicaProb !== undefined ? (
              <div className="flex flex-col items-start w-full">
                {/* 第一行：Prediction confidence 和 Odds */}
                <div className="flex flex-row items-start gap-4 w-full mb-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-primary"></div>
                    <div className="text-[10.5px] font-semibold text-white/70">Prediction confidence</div>
                  </div>
                  {/* Market Move / Since Signal 标签，与 Prediction confidence 同一行 */}
                  {/*
                  {market.nftPercentRealizedPnl !== undefined && (
                    <div className="text-[9.5px] font-semibold text-white/70 ml-auto text-right">
                      <div>Market Move</div>
                      <div>Since Signal</div>
                    </div>
                  )}
                   */}
                </div>
                {/* 第二行：三个横线，左对齐 */}
                {(() => {
                  const percent = (market.accuracyScore || 0) * 100;
                  let activeBar: 1 | 2 | 3 = 1;
                  if (percent >= 70) {
                    activeBar = 3;
                  } else if (percent >= 40) {
                    activeBar = 2;
                  } else {
                    activeBar = 1;
                  }
                  return (
                    <div className="flex gap-1.5 items-center">
                      <div className={`h-2 w-7 rounded-sm transition-all ${activeBar >= 1 ? 'bg-primary' : 'bg-white'}`} />
                      <div className={`h-2 w-7 rounded-sm transition-all ${activeBar >= 2 ? 'bg-primary' : 'bg-white'}`} />
                      <div className={`h-2 w-7 rounded-sm transition-all ${activeBar >= 3 ? 'bg-primary' : 'bg-white'}`} />
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="text-white">N/A</div>
            )}
          </div>

          {/* 右侧百分比：绝对定位，中间高度居中 */}
          {market.nftPercentRealizedPnl !== undefined && (
            <div className="absolute top-1/2 right-6 -translate-y-1/2 flex flex-col items-end">
              <div
                className={`text-[22px] md:text-[27.6px] font-bold leading-none ${market.nftPercentRealizedPnl >= 0
                  ? 'text-green-400'
                  : 'text-red-400'
                  }`}
              >
                {market.nftPercentRealizedPnl >= 0 ? '+' : ''}
                {market.nftPercentRealizedPnl.toFixed(2)}%
              </div>
            </div>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="h-px bg-white/10 my-4"></div>

      {/* Market context - 明确是"背景" */}
      <div className="mb-4">
        <div className="text-[13px] font-semibold uppercase tracking-wide text-white/80 mb-2">
          Market context (Polymarket)
        </div>

        <div className="space-y-2 bg-white/[0.01] p-3 rounded-lg border border-white/5 card-layer-1">
          {/* 显示整体概率 */}
          {market.probability !== undefined && (
            <div className="mb-3 pb-3 border-b border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60 font-medium">Market Probability</span>
                <span className="text-sm font-bold text-primary">
                  {Math.round(market.probability * 100)}%
                </span>
              </div>
              <div className="text-[10px] text-white/40 mt-1">
                (bestBid + bestAsk) / 2
              </div>
            </div>
          )}

          {/* 显示各选项概率 */}
          {market.options.map((option) => (
            <div key={option.id} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 mr-2"></div>
                <span className="text-sm text-white">{option.text}</span>
              </div>
              <div className="flex items-center gap-2">
                {option.id === market.atypicaPickId && (
                  <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                    AI Pick
                  </span>
                )}
                <span className="text-sm font-medium text-white">
                  {Math.round((option.externalProb || 0) * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-3 pt-4 mt-2 border-t border-white/10">
        <div className="flex items-center justify-between text-[10px] font-medium">
          <div className="flex items-center gap-3">
            <div className="text-muted flex items-start gap-1 text-[9px] leading-tight">
              <RefreshCw className={`w-2.5 h-2.5 mt-0.5 flex-shrink-0 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="break-words">
                Updated<br />
                {isRefreshing ? "now" : lastUpdated}
              </span>
            </div>
            <div className={`flex items-center ${isNearDeadline ? 'glow-text' : ''}`}>
              <Clock className={`w-3 h-3 mr-1 ${isNearDeadline ? 'text-amber-400 glow-icon' : 'text-amber-400'}`} />
              <span className={isNearDeadline ? 'text-amber-400' : ''}>
                <span className={isNearDeadline ? 'glow-text' : ''}>End:</span>{' '}
                <span className={isNearDeadline ? 'glow-text' : ''}>{(() => {
                  const date = new Date(market.closeDate);
                  const month = date.getMonth() + 1;
                  const day = date.getDate();
                  const year = date.getFullYear();
                  return `${month}/${day}/${year}`;
                })()}</span>
              </span>
            </div>
          </div>

          <a
            href={market.atypicaAnalysisUrl || '/'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation(); // 阻止事件冒泡到卡片
              if (!market.externalSource) {
                e.preventDefault();
              }
            }}
            className="flex items-center text-white/50 group-hover:text-primary transition-all gap-1 font-bold card-layer-1 px-2 py-1 rounded-full hover:bg-white/5"
          >
            View Analysis Report <ArrowRight className="w-3 h-3 translate-x-1 group-hover:translate-x-2 transition-transform" />
          </a>
        </div>

        {formattedPoolAmount && (
          <div className="flex items-center gap-1.5 text-[11px] font-medium">
            <DollarSign className="w-3 h-3 text-primary" />
            <span className="text-white/80">Vol.: <span className="text-white font-semibold">{formattedPoolAmount}</span></span>
          </div>
        )}
      </div>
    </div>
  );
};