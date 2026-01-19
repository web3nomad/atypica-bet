"use client";

import React, { memo } from "react";
import { TwitterPost } from "@/types";
// OPTIMIZATION: Direct imports instead of barrel file
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import TrendingDown from "lucide-react/dist/esm/icons/trending-down";
import ShoppingCart from "lucide-react/dist/esm/icons/shopping-cart";
import DollarSign from "lucide-react/dist/esm/icons/dollar-sign";
import BarChart3 from "lucide-react/dist/esm/icons/bar-chart-3";
import MessageCircle from "lucide-react/dist/esm/icons/message-circle";
import Repeat2 from "lucide-react/dist/esm/icons/repeat-2";
import Heart from "lucide-react/dist/esm/icons/heart";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
// OPTIMIZATION: Direct import from date-fns
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";

interface TwitterPostCardProps {
  post: TwitterPost;
}

// OPTIMIZATION: Hoist static JSX outside component
const ACTION_CONFIG = {
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
  UPDATE: {
    icon: <BarChart3 className="w-4 h-4" />,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    label: "UPDATE",
  },
  ANALYSIS: {
    icon: <BarChart3 className="w-4 h-4" />,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    label: "ANALYSIS",
  },
} as const;

// OPTIMIZATION: Memoize component to prevent unnecessary re-renders
export const TwitterPostCard = memo<TwitterPostCardProps>(function TwitterPostCard({ post }) {
  const { author, content, publishedAt, tradeData, media, engagement } = post;

  // Format time ago
  const timeAgo = formatDistanceToNow(new Date(publishedAt), {
    addSuffix: true,
  });

  // Get action icon and color
  const actionDisplay = tradeData ? ACTION_CONFIG[tradeData.action] : null;

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
      <p className="text-slate-200 text-[15px] leading-relaxed mb-4 whitespace-pre-wrap">
        {content}
      </p>

      {/* Trade Data Card */}
      {tradeData && (
        <div className="bg-black/30 border border-white/5 rounded-xl p-4 mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <ShoppingCart className="w-4 h-4" />
              <span className="text-sm font-medium">Market</span>
            </div>
            <span className="text-white font-semibold text-sm">
              {tradeData.market}
            </span>
          </div>

          {tradeData.amount !== undefined && (
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

          {tradeData.price !== undefined && (
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

          {tradeData.revenueRate !== undefined &&
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
});
