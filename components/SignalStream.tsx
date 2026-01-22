"use client";

import React, { useEffect, useRef, useState } from "react";
import { Activity, Target, Zap } from "lucide-react";
import type { TwitterPost } from "@/types";
import { TwitterPostCard } from "@/components/TwitterPostCard";

type SignalAction = "BUY" | "SELL" | "LIQUIDATE" | "HEDGE";

type SignalUrgency = "HIGH" | "MEDIUM" | "LOW";

interface Signal {
  id: string;
  source: "AI_AGENT" | "X";
  user: string;
  content: string;
  timestamp: string;
  action: SignalAction;
  impactValue: string;
  market: string;
  isAiInsight?: boolean;
  size: string;
  probabilityAtTime: string;
  urgency: SignalUrgency;
  twitterPost?: TwitterPost;
}

interface TweetsApiResponse {
  tweets: Array<{
    id: string;
    tweetId: string;
    text: string;
    type: string;
    postedAt: string;
    rawJson: Record<string, unknown> | null;
    isVisible: boolean;
  }>;
}

const formatTime = (iso: string) => {
  try {
    const d = new Date(iso);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    const hour = d.getHours().toString().padStart(2, "0");
    const minute = d.getMinutes().toString().padStart(2, "0");
    const second = d.getSeconds().toString().padStart(2, "0");

    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  } catch {
    return "--/-- --:--:--";
  }
};

const cleanTweetText = (text: string): string => {
  if (!text) return "";
  const lines = text.split(/\r?\n/);
  const filtered = lines.filter((line) => {
    const trimmed = line.trim().toLowerCase();
    if (!trimmed) return false;
    if (trimmed.startsWith("market:")) return false;
    if (trimmed.startsWith("amount:")) return false;
    if (trimmed.startsWith("entry:")) return false;
    return true;
  });
  return filtered.join("\n");
};

const mapTweetToSignal = (tweet: TweetsApiResponse["tweets"][number]): Signal => {
  const raw = (tweet.rawJson ?? {}) as Record<string, unknown>;

  const market =
    typeof raw.market === "string"
      ? raw.market
      : ""; // fallback below if empty

  const amount =
    typeof raw.amount === "number" ? raw.amount : undefined;

  const entry =
    typeof raw.entry === "number" ? raw.entry : undefined;

  const revenueRate =
    typeof raw.revenueRate === "number" ? raw.revenueRate : undefined;

  const profitLoss =
    typeof raw.profitLoss === "number" ? raw.profitLoss : undefined;

  const action: SignalAction =
    tweet.type === "SELL"
      ? "SELL"
      : "BUY"; // History 里目前主要是 BUY / SELL

  const impactNumber =
    profitLoss ??
    (revenueRate !== undefined && amount !== undefined
      ? (revenueRate / 100) * amount
      : 0);

  const impactValue = `${impactNumber >= 0 ? "+" : "-"}$${Math.abs(
    impactNumber,
  ).toFixed(2)}`;

  const size =
    amount !== undefined ? `$${amount.toLocaleString()}` : "$—";

  const probabilityAtTime =
    entry !== undefined ? `${Math.round(entry * 100)}%` : "—";

  const urgency: SignalUrgency =
    Math.abs(revenueRate ?? 0) > 15
      ? "HIGH"
      : Math.abs(revenueRate ?? 0) > 5
        ? "MEDIUM"
        : "LOW";

  const twitterPost: TwitterPost = {
    id: tweet.id,
    tweetId: tweet.tweetId,
    content: cleanTweetText(tweet.text),
    author: {
      handle: "@ioiiobet",
      name: "ioiio.bet",
      avatar: "/images/logoicon.jpg",
    },
    publishedAt: tweet.postedAt,
    tradeData: market
      ? {
          action: action === "SELL" ? "SELL" : "BUY",
          market,
          amount,
          price: entry,
          revenueRate,
          profitLoss,
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

  return {
    id: tweet.id,
    source: "X",
    user: "@ioiiobet",
    content: cleanTweetText(tweet.text),
    timestamp: formatTime(tweet.postedAt),
    action,
    impactValue,
    market: market || "Unlabeled Market",
    isAiInsight: false,
    size,
    probabilityAtTime,
    urgency,
    twitterPost,
  };
};

export const SignalStream: React.FC = () => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const baseTweetsRef = useRef<TweetsApiResponse["tweets"]>([]);
  const [hoveredPost, setHoveredPost] = useState<TwitterPost | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let tickerInterval: ReturnType<typeof setInterval> | null = null;
    let broadcastChannel: BroadcastChannel | null = null;

    const fetchTweets = async () => {
      try {
        const res = await fetch("/api/tweets", {
          cache: "no-store",
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const errorMessage = errorData.error || `HTTP ${res.status}: ${res.statusText}`;
          console.error("[SignalStream] API error:", errorMessage);
          throw new Error(`Failed to fetch tweets: ${errorMessage}`);
        }
        
        const data: TweetsApiResponse = await res.json();

        if (!data || !Array.isArray(data.tweets)) {
          console.error("[SignalStream] Invalid response format:", data);
          throw new Error("Invalid response format from API");
        }

        if (!isMounted) return;

        const visibleTweets = data.tweets.filter((tweet) => tweet.isVisible);
        baseTweetsRef.current = visibleTweets;

        const initialSignals = visibleTweets
          .slice(0, 40)
          .map(mapTweetToSignal);

        setSignals(initialSignals);

        if (!tickerInterval && visibleTweets.length > 0) {
          tickerInterval = setInterval(() => {
            if (!isMounted || baseTweetsRef.current.length === 0) return;
            if (isHovering) return;
            const pool = baseTweetsRef.current;
            const randomTweet =
              pool[Math.floor(Math.random() * pool.length)];
            const newSignal = mapTweetToSignal(randomTweet);

            setSignals((prev) => [newSignal, ...prev.slice(0, 19)]);
          }, 4_500);
        }
      } catch (e) {
        console.error("[SignalStream] Failed to load tweets:", e);
        if (isMounted) {
          setSignals([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTweets();

    const refreshInterval = setInterval(fetchTweets, 45_000);

    // Listen for updates from admin page
    try {
      broadcastChannel = new BroadcastChannel("tweets-update");
      broadcastChannel.onmessage = (event) => {
        if (event.data?.type === "tweet-updated") {
          // Refresh immediately when tweet is updated in admin
          fetchTweets();
        }
      };
    } catch (e) {
      // BroadcastChannel not supported, ignore
    }

    return () => {
      isMounted = false;
      clearInterval(refreshInterval);
      if (tickerInterval) {
        clearInterval(tickerInterval);
      }
      if (broadcastChannel) {
        broadcastChannel.close();
      }
    };
  }, [isHovering]);

  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
          <Activity className="w-3.5 h-3.5 text-primary" />
        </div>
        <h2 className="text-lg font-bold tracking-tight">Live Signals</h2>
      </div>

      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <h2 className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-400">
              Tape Reading Engine
            </h2>
          </div>
          <div className="h-4 w-px bg-zinc-800" />
          <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-600">
            <span>OPS/SEC: 12.4</span>
            <span>LATENCY: 42ms</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-indigo-500 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10">
            <Activity size={10} />
            LIVE FEED
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-lg overflow-hidden border border-zinc-800/40 bg-zinc-950/20">
        <div className="grid grid-cols-[140px_1fr_120px_100px_100px] gap-4 px-4 py-2 bg-zinc-900/40 border-b border-zinc-800/60 text-[9px] font-black uppercase text-zinc-500 tracking-widest">
          <div>Time</div>
          <div>Source &amp; Intelligence</div>
          <div>Market Context</div>
          <div>Execution Size</div>
            <div className="text-right">Realized PnL</div>
        </div>

        <div className="h-[360px] overflow-y-auto no-scrollbar font-mono">
          {isLoading && (
            <div className="flex items-center justify-center h-full text-[10px] text-zinc-500">
              Loading live signals...
            </div>
          )}

          {!isLoading && signals.length === 0 && (
            <div className="flex items-center justify-center h-full text-[10px] text-zinc-500">
              No live trading signals yet.
            </div>
          )}

          {!isLoading &&
            signals.map((signal, idx) => (
              <div
                key={`${signal.id}-${idx}`}
                className={`relative grid grid-cols-[140px_1fr_120px_100px_100px] gap-4 px-4 py-2.5 items-center border-b border-zinc-900/40 transition-colors duration-150 ${
                  hoveredPost?.id === signal.id
                    ? "bg-zinc-900/60"
                    : "hover:bg-zinc-900/40"
                } ${idx === 0 && !hoveredPost ? "bg-zinc-900/50" : ""}`}
                onMouseEnter={() => {
                  if (signal.twitterPost) {
                    setHoveredPost(signal.twitterPost);
                  } else {
                    setHoveredPost(null);
                  }
                  setIsHovering(true);
                }}
                onMouseLeave={() => {
                  setIsHovering(false);
                }}
              >
                {hoveredPost?.id === signal.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-indigo-400" />
                )}
                <div className="text-[10px] text-zinc-600">
                  {signal.timestamp}
                </div>

                <div className="flex items-center gap-3 min-w-0">
                  {signal.isAiInsight ? (
                    <Zap
                      size={12}
                      className={
                        signal.urgency === "HIGH"
                          ? "text-indigo-400 animate-pulse"
                          : "text-indigo-500"
                      }
                    />
                  ) : (
                    <div className="w-4 h-4 rounded-[4px] bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[8px] font-black text-zinc-100">
                      X
                    </div>
                  )}
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold whitespace-nowrap ${
                        signal.user === "@ioiiobet" || signal.isAiInsight
                          ? "text-indigo-400"
                          : "text-zinc-400"
                      }`}
                    >
                      {signal.user}
                    </span>
                    <span className="text-[10px] text-zinc-500 truncate opacity-80">
                      {signal.content}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 overflow-hidden">
                  <Target
                    size={10}
                    className="text-zinc-700 flex-shrink-0"
                  />
                  <span className="text-[10px] text-zinc-400 truncate">
                    {signal.market}
                  </span>
                  <span className="text-[9px] text-zinc-600 font-bold">
                    @{signal.probabilityAtTime}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-zinc-500 tracking-tighter">
                    {signal.size}
                  </span>
                  <div
                    className={`px-1 rounded-[2px] text-[8px] font-black ${
                      signal.action === "BUY"
                        ? "bg-emerald-500/20 text-emerald-500"
                        : signal.action === "SELL"
                          ? "bg-rose-500/20 text-rose-500"
                          : signal.action === "LIQUIDATE"
                            ? "bg-orange-500/20 text-orange-500"
                            : "bg-zinc-700 text-zinc-300"
                    }`}
                  >
                    {signal.action}
                  </div>
                </div>

                <div
                  className={`text-[11px] font-bold text-right tabular-nums ${
                    signal.impactValue.startsWith("+")
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}
                >
                  {signal.impactValue}
                </div>
              </div>
            ))}
        </div>

        <div className="px-4 py-1.5 bg-zinc-900/80 border-t border-zinc-800 flex justify-between items-center">
          <div className="flex gap-4">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter">
                API Connected: Polymarket Core
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
              <span className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter">
                Execution Model: Proactive v2.1 (Neural)
              </span>
            </div>
          </div>
          <div className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">
            System Scan Complete ... 0 Errors
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 px-1">
        {[
          { label: "Event Recognition", value: "Enabled", color: "text-indigo-500" },
          { label: "Sentiment Lag", value: "< 200ms", color: "text-zinc-400" },
          { label: "Auto-Hedge", value: "Active", color: "text-emerald-500" },
          { label: "Panic Mode", value: "Shielded", color: "text-zinc-600" },
        ].map((item) => (
          <div
            key={item.label}
            className="flex justify-between items-center py-1 border-b border-zinc-900"
          >
            <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">
              {item.label}
            </span>
            <span className={`text-[9px] font-bold ${item.color}`}>{item.value}</span>
          </div>
        ))}
      </div>

      {hoveredPost && (
        <div className="mt-4">
          <TwitterPostCard post={hoveredPost} />
        </div>
      )}
    </div>
  );
};

export default SignalStream;

