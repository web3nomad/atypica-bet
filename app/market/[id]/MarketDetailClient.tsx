"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PredictionMarket, PredictionStatus } from "@/types";
import { CATEGORY_LABELS, STATUS_LABELS } from "@/constants";
import { AccuracyMeter } from "@/components/AccuracyMeter";
import {
  ChevronLeft,
  Share2,
  ShieldCheck,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  RefreshCw,
  MessageSquare,
  Heart,
  ArrowRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface MarketDetailClientProps {
  market: PredictionMarket;
}

const getYouTubeEmbedUrl = (url?: string) => {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  try {
    if (trimmed.includes("youtube.com/embed/")) {
      return trimmed;
    }

    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^www\./, "");
    let videoId = "";

    if (host === "youtu.be") {
      videoId = parsed.pathname.slice(1);
    } else if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname === "/watch") {
        videoId = parsed.searchParams.get("v") || "";
      } else if (parsed.pathname.startsWith("/embed/")) {
        return url;
      } else if (parsed.pathname.startsWith("/shorts/")) {
        videoId = parsed.pathname.replace("/shorts/", "");
      }
    }

    if (!videoId) {
      const match = trimmed.match(/[?&]v=([^&]+)/);
      videoId = match ? match[1] : "";
    }

    if (!videoId) return "";

    const listId = parsed.searchParams.get("list");
    const listParam = listId ? `?list=${listId}` : "";
    return `https://www.youtube.com/embed/${videoId}${listParam}`;
  } catch {
    const fallbackVideoMatch = trimmed.match(
      /(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/shorts\/)([^?&/]+)/,
    );
    const videoId = fallbackVideoMatch ? fallbackVideoMatch[1] : "";
    if (!videoId) return "";
    const listMatch = trimmed.match(/[?&]list=([^&]+)/);
    const listParam = listMatch ? `?list=${listMatch[1]}` : "";
    return `https://www.youtube.com/embed/${videoId}${listParam}`;
  }
};

export default function MarketDetailClient({
  market,
}: MarketDetailClientProps) {
  const router = useRouter();
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "overview",
  );
  const [copied, setCopied] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<string>("");
  const [isNearDeadline, setIsNearDeadline] = useState<boolean>(false);
  const [priceChange, setPriceChange] = useState<number>(0); // 波动比例（占位数据）
  const podcastEmbedUrl = getYouTubeEmbedUrl(market.atypicaPodcastUrl);

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
      const hours = Math.floor(
        (timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor(
        (timeRemaining % (1000 * 60 * 60)) / (1000 * 60),
      );

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

  const data = market.options.map((opt) => ({
    name: opt.text,
    external: Math.round((opt.externalProb || 0) * 100),
    atypica: Math.round((opt.atypicaProb || 0) * 100),
    id: opt.id,
    isAtypicaPick: opt.id === market.atypicaPickId,
  }));

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
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
      const formattedMinutes = minutes.toString().padStart(2, "0");
      return `${month}/${day} ${hours}:${formattedMinutes}`;
    };

    setLastUpdated(formatUpdateTime());
  }, [isRefreshing]);

  // Price Change 从数据库获取（nftPercentRealizedPnl）
  useEffect(() => {
    if (market.nftPercentRealizedPnl !== undefined) {
      setPriceChange(market.nftPercentRealizedPnl);
    }
  }, [market.nftPercentRealizedPnl]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      const now = new Date();
      const month = now.getMonth() + 1;
      const day = now.getDate();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const formattedMinutes = minutes.toString().padStart(2, "0");
      setLastUpdated(`${month}/${day} ${hours}:${formattedMinutes}`);
    }, 800);
  };

  // 计算 Model Confidence 等级（1-3，对应1-3条横线），与 PredictionCard 逻辑一致
  const getConfidenceLevel = (score: number): number => {
    const percent = score * 100;
    if (percent >= 70) return 3;
    if (percent >= 40) return 2;
    return 1;
  };

  const confidenceLevel = getConfidenceLevel(market.accuracyScore || 0);

  const pickedOption = market.options.find(
    (o) => o.id === market.atypicaPickId,
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-20">
      <button
        onClick={() => router.push("/")}
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
                {market.status === PredictionStatus.ACTIVE &&
                  isNearDeadline && (
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
                {market.status !== PredictionStatus.ACTIVE ||
                !isNearDeadline ? (
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-white/60 text-[10px] font-bold uppercase tracking-[0.2em]">
                    {STATUS_LABELS[market.status]}
                  </span>
                ) : null}
              </div>

              <div className="flex items-center bg-white/[0.03] px-3 py-1.5 rounded-full">
                <RefreshCw
                  className={`w-3.5 h-3.5 mr-2 text-muted ${isRefreshing ? "animate-spin" : ""}`}
                />
                <span className="text-[10px] font-bold text-white/80">
                  Updated {isRefreshing ? "now" : lastUpdated}
                </span>
              </div>
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[1.1] text-header">
                {market.title}
              </h1>
              <div className="flex flex-col gap-3">
                <a
                  href={market.atypicaAnalysisUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (!market.atypicaAnalysisUrl) {
                      e.preventDefault();
                      return;
                    }
                  }}
                  className="inline-flex items-center gap-1.5 text-[20px] font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors group"
                >
                  View Research
                  <ArrowRight className="w-3 h-3 translate-x-0 group-hover:translate-x-1 transition-transform" />
                </a>
                <a
                  href={market.polyMarketUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (!market.polyMarketUrl) {
                      e.preventDefault();
                      return;
                    }
                  }}
                  className="inline-flex items-center gap-1.5 text-[20px] font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors group"
                >
                  GO POLYMARKET
                  <ArrowRight className="w-3 h-3 translate-x-0 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
            <iframe
              width="560"
              height="315"
              src={podcastEmbedUrl}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            ></iframe>

            {market.atypicaAnalysis && (
              <p className="text-muted text-lg font-medium leading-relaxed italic">
                {market.atypicaAnalysis}
              </p>
            )}
            {market.atypicaSummary && (
              <p className="text-muted text-lg font-medium leading-relaxed mt-[3px] whitespace-pre-line">
                {market.atypicaSummary}
              </p>
            )}
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-white/5">
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-1">
                <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">
                  Probability Matrix
                </h2>
                <p className="text-[9px] text-muted font-bold uppercase tracking-widest">
                  Weighted Comparative Analysis
                </p>
              </div>
              <div className="flex gap-4 text-[9px] font-black uppercase tracking-widest text-muted">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />{" "}
                  Market Context
                </div>
              </div>
            </div>
            <div className="h-[140px] w-full relative">
              <div className="flex items-center h-full">
                {/* 左侧：百分比、AI Pick 标志和 Yes/No 文字 */}
                <div className="flex-shrink-0 w-[200px] h-full flex flex-col justify-center gap-4">
                  {data.map((entry, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-[60px] flex-shrink-0">
                        {entry.isAtypicaPick && (
                          <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                            AI Pick
                          </span>
                        )}
                      </div>
                      <span className="text-[20px] text-white/60 font-semibold w-[45px] text-left">
                        {entry.external}%
                      </span>
                      <span className="text-[18px] font-bold text-[#666] ml-2">
                        {entry.name}
                      </span>
                    </div>
                  ))}
                </div>
                {/* 中间：进度条（居中） */}
                <div className="flex-1 flex justify-center h-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data}
                      layout="vertical"
                      margin={{ left: 20, right: 20, top: 20, bottom: 20 }}
                    >
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={0}
                        tick={false}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(255,255,255,0.01)" }}
                        contentStyle={{
                          background: "#000",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                          fontSize: "9px",
                        }}
                      />
                      <Bar
                        dataKey="external"
                        fill="rgba(255,255,255,0.3)"
                        radius={[0, 2, 2, 0]}
                        barSize={8}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel rounded-2xl p-6 border-primary/20">
            <div className="flex flex-col space-y-6">
              {/* AI 的选择 */}
              <div className="text-center mb-6">
                <div className="text-[9px] text-muted font-bold uppercase tracking-[0.3em] mb-2">
                  AI Prediction
                </div>
                <div className="flex items-center justify-center text-2xl font-black text-primary leading-tight bg-primary/10 px-4 py-3 rounded-lg border border-primary/30">
                  <span>{pickedOption?.text || "N/A"}</span>
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
              {market.nftPercentRealizedPnl !== undefined && (
                <div className="text-center mb-6">
                  <div className="text-[8px] text-muted font-bold uppercase tracking-widest mb-2">
                    Price Change
                  </div>
                  <div
                    className={`text-2xl font-black ${market.nftPercentRealizedPnl >= 0 ? "text-green-400" : "text-red-400"} leading-tight`}
                  >
                    {market.nftPercentRealizedPnl >= 0 ? "+" : ""}
                    {market.nftPercentRealizedPnl.toFixed(2)}%
                  </div>
                </div>
              )}

              {/* Model Confidence - 三个短横线 */}
              <div className="text-center border-t border-white/10 pt-6">
                <div className="text-[8px] text-muted font-bold uppercase tracking-widest mb-3">
                  Model Confidence
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  {[1, 2, 3].map((index) => (
                    <div
                      key={index}
                      className={`h-2 w-7 rounded-sm transition-all ${
                        index <= confidenceLevel ? "bg-primary" : "bg-white"
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
                onClick={() =>
                  setExpandedSection(
                    expandedSection === "overview" ? null : "overview",
                  )
                }
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-white">
                  Contextual Matrix
                </span>
                {expandedSection === "overview" ? (
                  <ChevronUp className="w-3.5 h-3.5 text-muted" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-muted" />
                )}
              </button>
              {expandedSection === "overview" && (
                <div className="px-6 pb-5 text-muted text-[12px] leading-relaxed">
                  {market.description}
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex flex-wrap gap-3">
            <button
              onClick={handleCopyLink}
              className="flex-1 btn-outline py-2.5 text-[10px] font-bold uppercase tracking-widest"
            >
              {copied ? (
                <Check className="w-3 h-3 mx-auto" />
              ) : (
                "Copy Report Link"
              )}
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
