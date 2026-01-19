"use client";

import React, { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { TwitterPost, TradeAction } from "@/types";
import { TwitterPostCard } from "@/components/TwitterPostCard";
// OPTIMIZATION: Direct imports instead of barrel file
import Filter from "lucide-react/dist/esm/icons/filter";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import DollarSign from "lucide-react/dist/esm/icons/dollar-sign";
import BarChart3 from "lucide-react/dist/esm/icons/bar-chart-3";
import Calendar from "lucide-react/dist/esm/icons/calendar";

// OPTIMIZATION: Dynamic import for heavy ECharts component
const RevenueChart = dynamic(
  () => import("@/components/RevenueChart").then((mod) => mod.RevenueChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-[350px] flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading chart...</div>
      </div>
    ),
  }
);

interface HistoryClientProps {
  posts: TwitterPost[];
  revenueData: Array<{ date: string; revenue: number; trades: number }>;
}

export default function HistoryClient({
  posts,
  revenueData,
}: HistoryClientProps) {
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

  // Calculate statistics
  useEffect(() => {
    const trades = posts.filter(
      (p) => p.tradeData?.action === "BUY" || p.tradeData?.action === "SELL"
    );
    const tradesWithRevenue = posts.filter(
      (p) =>
        p.tradeData?.revenueRate !== undefined && p.tradeData.revenueRate !== 0
    );
    const winningTrades = tradesWithRevenue.filter(
      (p) => (p.tradeData?.revenueRate || 0) > 0
    );

    // Calculate total revenue from latest portfolio update
    const latestPortfolioUpdate = posts.find(
      (p) =>
        p.tradeData?.action === "UPDATE" && p.tradeData?.market === "Portfolio"
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

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Trading History
          </h1>
          <p className="text-slate-400">
            Track all trading activities from our Twitter account
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
                onClick={() => setFilterAction("UPDATE")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterAction === "UPDATE"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
                }`}
              >
                Update
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

              <RevenueChart revenueData={revenueData} />

              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-slate-400 mb-1">Best Day</div>
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
                  <span className="text-sm text-slate-400">Current Value</span>
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
