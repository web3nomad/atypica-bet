"use client";

import React, { useState, useMemo, useEffect } from "react";
import { TwitterPost, TradeAction } from "@/types";
import { TwitterPostCard } from "@/components/TwitterPostCard";
import {
  Filter,
  TrendingUp,
  DollarSign,
  BarChart3,
  Calendar,
} from "lucide-react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";

interface HistoryClientProps {
  posts: TwitterPost[];
  revenueData: Array<{ date: string; revenue: number; trades: number }>;
}

export default function HistoryClient({
  posts: initialPosts,
  revenueData,
}: HistoryClientProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [filterAction, setFilterAction] = useState<TradeAction | "ALL">("ALL");
  const [isMobile, setIsMobile] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalTrades, setTotalTrades] = useState(0);
  const [winRate, setWinRate] = useState(0);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Refresh posts when updated in admin
  useEffect(() => {
    let broadcastChannel: BroadcastChannel | null = null;

    const refreshPosts = async () => {
      try {
        const res = await fetch("/api/tweets");
        if (!res.ok) return;
        const data = await res.json();
        if (!data?.tweets) return;

        const visibleTweets = data.tweets.filter(
          (t: any) => t.isVisible && (t.type === "BUY" || t.type === "SELL")
        );

        const updatedPosts: TwitterPost[] = visibleTweets.map((tweet: any) => {
          const raw = (tweet.rawJson ?? {}) as Record<string, unknown>;
          const buyText = typeof raw.buyText === "string" ? raw.buyText : "";
          const market = typeof raw.market === "string" ? raw.market : "";
          const amount = typeof raw.amount === "number" ? raw.amount : undefined;
          const entry = typeof raw.entry === "number" ? raw.entry : undefined;

          return {
            id: tweet.id,
            tweetId: tweet.tweetId,
            content: buyText || tweet.text,
            author: {
              handle: "@ioiiobet",
              name: "ioiio.bet",
              avatar: "/images/logoicon.jpg",
            },
            publishedAt: tweet.postedAt,
            tradeData: market
              ? {
                  action: tweet.type === "SELL" ? "SELL" : "BUY",
                  market,
                  amount,
                  price: entry,
                }
              : undefined,
            media: {
              images: [],
              videos: [],
              links: [],
            },
            engagement: {
              likes: 0,
              retweets: 0,
              replies: 0,
            },
          };
        });

        setPosts(updatedPosts);
      } catch (e) {
        console.error("[HistoryClient] Failed to refresh posts:", e);
      }
    };

    try {
      broadcastChannel = new BroadcastChannel("tweets-update");
      broadcastChannel.onmessage = (event) => {
        if (event.data?.type === "tweet-updated") {
          refreshPosts();
        }
      };
    } catch (e) {
      // BroadcastChannel not supported, ignore
    }

    return () => {
      if (broadcastChannel) {
        broadcastChannel.close();
      }
    };
  }, []);

  // Calculate statistics
  useEffect(() => {
    const trades = posts.filter((p) => p.tradeData?.action === "BUY" || p.tradeData?.action === "SELL");
    const tradesWithRevenue = posts.filter(
      (p) => p.tradeData?.revenueRate !== undefined && p.tradeData.revenueRate !== 0
    );
    const winningTrades = tradesWithRevenue.filter(
      (p) => (p.tradeData?.revenueRate || 0) > 0
    );

    // Calculate total revenue from latest portfolio update
    const latestPortfolioUpdate = posts.find(
      (p) =>
        p.tradeData?.action === "REVENUE" &&
        p.tradeData?.market === "Portfolio"
    );
    const revenue = latestPortfolioUpdate?.tradeData?.revenueRate || 0;

    setTotalRevenue(revenue);
    setTotalTrades(trades.length);
    setWinRate(
      tradesWithRevenue.length > 0
        ? (winningTrades.length / tradesWithRevenue.length) * 100
        : 0
    );
  }, [posts]);

  // Filter posts
  const filteredPosts = useMemo(() => {
    if (filterAction === "ALL") return posts;
    return posts.filter((p) => p.tradeData?.action === filterAction);
  }, [posts, filterAction]);

  // ECharts configuration for revenue timeline
  const chartOption = useMemo(() => {
    return {
      backgroundColor: "transparent",
      grid: {
        left: "3%",
        right: "4%",
        bottom: "10%",
        top: "15%",
        containLabel: true,
      },
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        borderColor: "rgba(255, 255, 255, 0.1)",
        textStyle: {
          color: "#fff",
          fontSize: 13,
        },
        formatter: (params: any) => {
          const param = params[0];
          const date = param.axisValue;
          const revenue = param.value;
          const trades = revenueData.find((d) => d.date === date)?.trades || 0;

          return `
            <div style="padding: 4px;">
              <div style="color: #94a3b8; font-size: 12px; margin-bottom: 4px;">${date}</div>
              <div style="color: ${revenue >= 0 ? "#34d399" : "#f87171"}; font-weight: 600; font-size: 14px;">
                ${revenue >= 0 ? "+" : ""}${revenue.toFixed(2)}%
              </div>
              <div style="color: #94a3b8; font-size: 12px; margin-top: 4px;">
                ${trades} ${trades === 1 ? "trade" : "trades"}
              </div>
            </div>
          `;
        },
      },
      xAxis: {
        type: "category",
        data: revenueData.map((d) => d.date),
        axisLine: {
          lineStyle: {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
        axisLabel: {
          color: "#94a3b8",
          fontSize: 11,
          formatter: (value: string) => {
            const date = new Date(value);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          },
        },
        splitLine: {
          show: false,
        },
      },
      yAxis: {
        type: "value",
        axisLine: {
          show: false,
        },
        axisLabel: {
          color: "#94a3b8",
          fontSize: 11,
          formatter: (value: number) => `${value >= 0 ? "+" : ""}${value}%`,
        },
        splitLine: {
          lineStyle: {
            color: "rgba(255, 255, 255, 0.05)",
            type: "dashed",
          },
        },
      },
      series: [
        {
          name: "Revenue",
          type: "line",
          data: revenueData.map((d) => d.revenue),
          smooth: true,
          lineStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "#8b5cf6" },
              { offset: 1, color: "#a78bfa" },
            ]),
            width: 3,
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(139, 92, 246, 0.3)" },
              { offset: 1, color: "rgba(139, 92, 246, 0.05)" },
            ]),
          },
          symbol: "circle",
          symbolSize: 6,
          itemStyle: {
            color: "#8b5cf6",
            borderColor: "#fff",
            borderWidth: 2,
          },
        },
      ],
    };
  }, [revenueData]);

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Signal Tape
          </h1>
          <p className="text-slate-400">
            Live and historical trading signals from our Twitter account
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm font-medium">
                Total Return
              </span>
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-white">
              {totalRevenue >= 0 ? "+" : ""}
              {totalRevenue.toFixed(2)}%
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm font-medium">
                Total Trades
              </span>
              <BarChart3 className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-3xl font-bold text-white">{totalTrades}</div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm font-medium">
                Win Rate
              </span>
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold text-white">
              {winRate.toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Main Layout: Posts + Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_500px] gap-8">
          {/* Left: Posts Feed */}
          <div>
            {/* Filters */}
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                <Filter className="w-4 h-4" />
                <span>Filter:</span>
              </div>
              <button
                onClick={() => setFilterAction("ALL")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterAction === "ALL"
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                    : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
                }`}
              >
                All Posts
              </button>
              <button
                onClick={() => setFilterAction("BUY")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterAction === "BUY"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
                }`}
              >
                Buy
              </button>
              <button
                onClick={() => setFilterAction("SELL")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterAction === "SELL"
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
                }`}
              >
                Sell
              </button>
              <button
                onClick={() => setFilterAction("REVENUE")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterAction === "REVENUE"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
                }`}
              >
                Revenue
              </button>
              <button
                onClick={() => setFilterAction("ANALYSIS")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterAction === "ANALYSIS"
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                    : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
                }`}
              >
                Analysis
              </button>
            </div>

            {/* Posts List */}
            <div className="space-y-4">
              {filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <TwitterPostCard key={post.id} post={post} />
                ))
              ) : (
                <div className="text-center py-12 text-slate-400">
                  No posts found with this filter.
                </div>
              )}
            </div>
          </div>

          {/* Right: Revenue Chart (Sticky on Desktop) */}
          <div className={`${isMobile ? "" : "lg:sticky lg:top-24 lg:h-fit"}`}>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">
                  Revenue Timeline
                </h2>
                <Calendar className="w-5 h-5 text-slate-400" />
              </div>

              <div className="mb-6">
                <div className="text-3xl font-bold text-white mb-1">
                  {revenueData.length > 0
                    ? `${revenueData[revenueData.length - 1].revenue >= 0 ? "+" : ""}${revenueData[revenueData.length - 1].revenue.toFixed(2)}%`
                    : "0%"}
                </div>
                <div className="text-sm text-slate-400">
                  Last 30 days performance
                </div>
              </div>

              <ReactECharts
                option={chartOption}
                style={{ height: "350px" }}
                opts={{ renderer: "canvas" }}
              />

              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-slate-400 mb-1">
                      Best Day
                    </div>
                    <div className="text-lg font-bold text-emerald-400">
                      +
                      {Math.max(...revenueData.map((d) => d.revenue)).toFixed(
                        2
                      )}
                      %
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400 mb-1">
                      Worst Day
                    </div>
                    <div className="text-lg font-bold text-red-400">
                      {Math.min(...revenueData.map((d) => d.revenue)).toFixed(
                        2
                      )}
                      %
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">
                Quick Stats
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">
                    Active Positions
                  </span>
                  <span className="text-sm font-bold text-white">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">
                    Total Invested
                  </span>
                  <span className="text-sm font-bold text-white">$15,420</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">
                    Current Value
                  </span>
                  <span className="text-sm font-bold text-emerald-400">
                    $20,769
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <span className="text-sm text-slate-400">Total P&L</span>
                  <span className="text-sm font-bold text-emerald-400">
                    +$5,349
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
