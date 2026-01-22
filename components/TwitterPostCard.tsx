"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TwitterPost } from "@/types";
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  DollarSign,
  BarChart3,
  MessageCircle,
  Repeat2,
  Heart,
  ExternalLink,
  Image as ImageIcon,
  ArrowUpRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface TwitterPostCardProps {
  post: TwitterPost;
}

export const TwitterPostCard: React.FC<TwitterPostCardProps> = ({ post }) => {
  const {
    author,
    content,
    publishedAt,
    tradeData,
    media,
    engagement,
    relatedMarket,
  } = post;
  const isAnalysis = tradeData?.action === "ANALYSIS";
  const marketTitle = relatedMarket?.title ?? tradeData?.market ?? "Market";
  const showTradeCard = Boolean(tradeData || relatedMarket);
  const [isExpanded, setIsExpanded] = useState(false);
  const analysisMaxChars = 280;
  const analysisMaxLines = 4;
  const contentLines = content.split("\n");
  const isLongAnalysis =
    isAnalysis &&
    (content.length > analysisMaxChars || contentLines.length > analysisMaxLines);

  let displayedContent = content;
  if (isLongAnalysis && !isExpanded) {
    const truncatedLines =
      contentLines.length > analysisMaxLines
        ? contentLines.slice(0, analysisMaxLines).join("\n")
        : content;
    const truncatedChars =
      truncatedLines.length > analysisMaxChars
        ? truncatedLines.slice(0, analysisMaxChars)
        : truncatedLines;
    displayedContent = truncatedChars.replace(/\s+$/, "");
    if (displayedContent.length < content.length) {
      displayedContent = `${displayedContent}...`;
    }
  }

  // Format time ago
  const timeAgo = formatDistanceToNow(new Date(publishedAt), {
    addSuffix: true,
  });

  // Get action icon and color
  const getActionDisplay = () => {
    if (!tradeData) return null;

    const actionConfig = {
      BUY: {
        icon: <TrendingUp className="w-4 h-4" />,
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        label: "BUY",
      },
      SELL: {
        icon: <TrendingDown className="w-4 h-4" />,
        color: "text-red-400",
        bg: "bg-red-500/10",
        label: "SELL",
      },
      REVENUE: {
        icon: <BarChart3 className="w-4 h-4" />,
        color: "text-amber-400",
        bg: "bg-amber-500/10",
        label: "REVENUE",
      },
      ANALYSIS: {
        icon: <BarChart3 className="w-4 h-4" />,
        color: "text-purple-400",
        bg: "bg-purple-500/10",
        label: "ANALYSIS",
      },
    };

    return actionConfig[tradeData.action];
  };

  const actionDisplay = getActionDisplay();

  // Format revenue rate
  const formatRevenue = (rate: number | undefined) => {
    if (rate === undefined || rate === 0) return null;
    const sign = rate > 0 ? "+" : "";
    const color = rate > 0 ? "text-emerald-400" : "text-red-400";
    return (
      <span className={`font-bold ${color}`}>
        {sign}
        {rate.toFixed(2)}%
      </span>
    );
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition-all duration-200 cursor-pointer">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <img
            src={author.avatar}
            alt={author.name}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">{author.name}</span>
              {actionDisplay && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold ${actionDisplay.bg} ${actionDisplay.color}`}
                >
                  {actionDisplay.icon}
                  {actionDisplay.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>{author.handle}</span>
              <span>·</span>
              <span>{timeAgo}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <p
        className={`text-slate-200 text-[15px] leading-relaxed ${isLongAnalysis ? "mb-2" : "mb-4"} whitespace-pre-wrap`}
      >
        {displayedContent}
      </p>
      {isLongAnalysis && (
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="mb-4 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60 rounded-md"
          aria-expanded={isExpanded}
        >
          {isExpanded ? "Show less" : "Show full"}
        </button>
      )}

      {/* Trade Data Card */}
      {showTradeCard && (
        <div className="bg-black/30 border border-white/5 rounded-xl p-4 mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <ShoppingCart className="w-4 h-4" />
              <span className="text-sm font-medium">Market</span>
            </div>
            {relatedMarket ? (
              <Link
                href={`/market/${relatedMarket.id}`}
                className="flex items-center gap-2 text-white font-semibold text-sm hover:text-purple-300 transition-colors"
              >
                <span className="truncate max-w-[420px]">{marketTitle}</span>
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            ) : (
              <span className="text-white font-semibold text-sm">
                {marketTitle}
              </span>
            )}
          </div>

          {/* 
          {tradeData?.amount !== undefined && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-300">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm font-medium">Amount</span>
              </div>
              <span className="text-white font-semibold text-sm">
                ${tradeData.amount.toLocaleString()}
              </span>
            </div>
          )}
           */}

          {tradeData?.price !== undefined && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-300">
                <BarChart3 className="w-4 h-4" />
                <span className="text-sm font-medium">Price</span>
              </div>
              <span className="text-white font-semibold text-sm">
                {tradeData.price.toFixed(2)}
              </span>
            </div>
          )}

          {tradeData?.revenueRate !== undefined &&
            tradeData.revenueRate !== 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="flex items-center gap-2 text-slate-300">
                  {tradeData.revenueRate > 0 ? (
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-sm font-medium">Revenue</span>
                </div>
                <div className="flex items-center gap-2">
                  {formatRevenue(tradeData.revenueRate)}
                  {tradeData.profitLoss !== undefined && (
                    <span
                      className={`text-sm ${tradeData.profitLoss > 0 ? "text-emerald-400" : "text-red-400"}`}
                    >
                      (${Math.abs(tradeData.profitLoss).toFixed(2)})
                    </span>
                  )}
                </div>
              </div>
            )}
        </div>
      )}

      {/* Media Links */}
      {media.links && media.links.length > 0 && (
        <div className="mb-4 space-y-2">
          {media.links.map((link, index) => (
            <a
              key={index}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="truncate">{link}</span>
            </a>
          ))}
        </div>
      )}

      {/* Media Images */}
      {media.images && media.images.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-2">
          {media.images.map((image, index) => (
            <div
              key={index}
              className="relative aspect-video bg-white/5 rounded-lg overflow-hidden"
            >
              <img
                src={image}
                alt={`Media ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

            {/* Engagement Stats */}
      <div className="flex items-center gap-6 pt-4 border-t border-white/5">
        <div className="flex items-center gap-2 text-slate-400 hover:text-purple-400 transition-colors cursor-pointer">
          <MessageCircle className="w-4 h-4" />
          <span className="text-sm font-medium">
            {engagement.replies.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer">
          <Repeat2 className="w-4 h-4" />
          <span className="text-sm font-medium">
            {engagement.retweets.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors cursor-pointer">
          <Heart className="w-4 h-4" />
          <span className="text-sm font-medium">
            {engagement.likes.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};
