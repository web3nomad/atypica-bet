"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PredictionMarket } from "@/types";
import { ArrowUpRight, ChevronDown } from "lucide-react";

type AdminTweet = {
  id: string;
  tweetId: string;
  text: string;
  type: "BUY" | "SELL" | "ANALYSIS" | "REVENUE" | null;
  postedAt: string;
  marketId: string | null;
  isVisible: boolean;
  rawJson: {
    buyText: string;
    market: string;
    amount: string;
    entry: string;
  };
};

type SyncResult = {
  addedCount: number;
  ignoredCount: number;
  error?: string;
};

export default function AdminHistoryPage() {
  const [tweets, setTweets] = useState<AdminTweet[]>([]);
  const [markets, setMarkets] = useState<PredictionMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tweetsRes, marketsRes] = await Promise.all([
        fetch("/api/tweets"),
        fetch("/api/markets"),
      ]);

      if (!tweetsRes.ok) throw new Error("Failed to load tweets");
      if (!marketsRes.ok) throw new Error("Failed to load markets");

      const tweetsData = await tweetsRes.json();
      const marketsData = await marketsRes.json();

      const normalizedTweets = Array.isArray(tweetsData.tweets)
        ? tweetsData.tweets.map((tweet: any) => {
            const raw = tweet.rawJson && typeof tweet.rawJson === "object"
              ? tweet.rawJson
              : {};
            return {
              ...tweet,
              type: tweet.type === "BUY" || tweet.type === "SELL" || tweet.type === "ANALYSIS" || tweet.type === "REVENUE" ? tweet.type : null,
              isVisible: Boolean(tweet.isVisible),
              rawJson: {
                buyText: typeof raw.buyText === "string" ? raw.buyText : "",
                market: typeof raw.market === "string" ? raw.market : "",
                amount:
                  raw.amount !== undefined && raw.amount !== null
                    ? String(raw.amount)
                    : "",
                entry:
                  raw.entry !== undefined && raw.entry !== null
                    ? String(raw.entry)
                    : "",
              },
            } as AdminTweet;
          })
        : [];

      setTweets(normalizedTweets);
      setMarkets(Array.isArray(marketsData) ? marketsData : []);
    } catch (error) {
      console.error("Failed to load admin history data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      setSyncResult(null);
      const response = await fetch("/api/tweets/sync", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Sync failed");
      }

      setSyncResult({
        addedCount: data.addedCount ?? 0,
        ignoredCount: data.ignoredCount ?? 0,
      });

      await loadData();
    } catch (error) {
      setSyncResult({
        addedCount: 0,
        ignoredCount: 0,
        error: error instanceof Error ? error.message : "Sync failed",
      });
    } finally {
      setSyncing(false);
    }
  };

  const parseNumber = (value: string) => {
    const normalized = value.replace(/,/g, "").replace(/[^0-9.+-]/g, "");
    if (!normalized) return null;
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const hasCompleteFields = (tweet: AdminTweet) => {
    if (tweet.type === "ANALYSIS" || tweet.type === "REVENUE") return true;
    const amount = parseNumber(tweet.rawJson.amount);
    const entry = parseNumber(tweet.rawJson.entry);
    return (
      tweet.rawJson.buyText.trim().length > 0 &&
      tweet.rawJson.market.trim().length > 0 &&
      amount !== null &&
      entry !== null
    );
  };

  const stats = React.useMemo(() => {
    const total = tweets.length;
    const visible = tweets.filter((tweet) => tweet.isVisible).length;
    const unclassified = tweets.filter((tweet) => !tweet.type).length;
    const incomplete = tweets.filter((tweet) => !hasCompleteFields(tweet)).length;
    return { total, visible, unclassified, incomplete };
  }, [tweets]);

  const marketTitleById = React.useMemo(() => {
    return new Map(markets.map((market) => [market.id, market.title]));
  }, [markets]);

  const selectClasses =
    "w-full appearance-none rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 pr-9 text-xs font-semibold text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-all hover:border-white/25 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/40 cursor-pointer";
  const inputClasses =
    "w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/80 placeholder:text-white/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-white/20";
  const optionClasses = "bg-slate-950 text-white";

  const handleFieldChange = (
    tweetId: string,
    field: keyof AdminTweet["rawJson"],
    value: string
  ) => {
    setTweets((prev) =>
      prev.map((tweet) =>
        tweet.id === tweetId
          ? { ...tweet, rawJson: { ...tweet.rawJson, [field]: value } }
          : tweet
      )
    );
    setRowErrors((prev) => ({ ...prev, [tweetId]: "" }));
  };

  const handleSave = async (tweet: AdminTweet) => {
    const amount = parseNumber(tweet.rawJson.amount);
    const entry = parseNumber(tweet.rawJson.entry);
    const hasFields = hasCompleteFields(tweet);

    if (tweet.isVisible && (!tweet.type || !hasFields)) {
      setRowErrors((prev) => ({
        ...prev,
        [tweet.id]: "Visible tweets require type and complete fields.",
      }));
      return;
    }

    try {
      setSavingId(tweet.id);
      setRowErrors((prev) => ({ ...prev, [tweet.id]: "" }));
      const response = await fetch(`/api/tweets/${tweet.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketId: tweet.marketId,
          type: tweet.type,
          isVisible: tweet.isVisible,
          rawJson: {
            buyText: tweet.rawJson.buyText,
            market: tweet.rawJson.market,
            amount,
            entry,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to update tweet");
      }

      setTweets((prev) =>
        prev.map((item) =>
          item.id === tweet.id
            ? {
                ...item,
                type: data.type === "BUY" || data.type === "SELL" || data.type === "ANALYSIS" || data.type === "REVENUE" ? data.type : null,
                isVisible: Boolean(data.isVisible),
                marketId: data.marketId ?? null,
                rawJson: {
                  buyText:
                    typeof data.rawJson?.buyText === "string"
                      ? data.rawJson.buyText
                      : "",
                  market:
                    typeof data.rawJson?.market === "string"
                      ? data.rawJson.market
                      : "",
                  amount:
                    data.rawJson?.amount !== undefined &&
                    data.rawJson?.amount !== null
                      ? String(data.rawJson.amount)
                      : "",
                  entry:
                    data.rawJson?.entry !== undefined &&
                    data.rawJson?.entry !== null
                      ? String(data.rawJson.entry)
                      : "",
                },
              }
            : item
        )
      );

      // Notify other tabs to refresh tweets data
      try {
        const channel = new BroadcastChannel("tweets-update");
        channel.postMessage({ type: "tweet-updated", tweetId: tweet.id });
        channel.close();
      } catch (e) {
        // BroadcastChannel not supported, ignore
      }
    } catch (error) {
      setRowErrors((prev) => ({
        ...prev,
        [tweet.id]:
          error instanceof Error ? error.message : "Failed to update tweet",
      }));
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center text-white/60">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Tweet History</h1>
          <p className="text-white/60 mt-1">
            Sync, classify, and curate tweets for the history feed.
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="bg-primary hover:bg-primary/90 text-black font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-primary/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-60"
        >
          {syncing ? "Syncing..." : "Sync Tweets"}
        </button>
      </div>

      {syncResult && (
        <div className="glass-panel rounded-2xl p-4 border border-white/10">
          {syncResult.error ? (
            <div className="text-sm text-red-400">{syncResult.error}</div>
          ) : (
            <div className="flex flex-wrap gap-6 text-sm text-white/70">
              <span>
                Added:{" "}
                <span className="text-white font-semibold">
                  {syncResult.addedCount}
                </span>
              </span>
              <span>
                Ignored:{" "}
                <span className="text-white font-semibold">
                  {syncResult.ignoredCount}
                </span>
              </span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-5 border border-white/10">
          <div className="text-xs uppercase tracking-widest text-white/50">
            Total
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {stats.total}
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-5 border border-white/10">
          <div className="text-xs uppercase tracking-widest text-white/50">
            Visible
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {stats.visible}
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-5 border border-white/10">
          <div className="text-xs uppercase tracking-widest text-white/50">
            Unclassified
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {stats.unclassified}
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-5 border border-white/10">
          <div className="text-xs uppercase tracking-widest text-white/50">
            Incomplete
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {stats.incomplete}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {tweets.map((tweet) => {
          const complete = hasCompleteFields(tweet);
          const marketTitle = tweet.marketId
            ? marketTitleById.get(tweet.marketId)
            : undefined;
          return (
            <div
              key={tweet.id}
              className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4"
            >
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
                  <span>{new Date(tweet.postedAt).toLocaleString()}</span>
                  <span className="px-2 py-1 rounded-full bg-white/10 text-white/70 uppercase tracking-wide">
                    {tweet.type ?? "Unclassified"}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs uppercase tracking-wide ${
                      complete
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {complete ? "Complete" : "Needs fields"}
                  </span>
                  {tweet.isVisible && (
                    <span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 uppercase tracking-wide">
                      Visible
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {rowErrors[tweet.id] && (
                    <div className="text-xs text-red-400" aria-live="polite">
                      {rowErrors[tweet.id]}
                    </div>
                  )}
                  <button
                    onClick={() => handleSave(tweet)}
                    disabled={savingId === tweet.id}
                    className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-60"
                  >
                    {savingId === tweet.id ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[220px_1fr_360px] gap-6">
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor={`type-${tweet.id}`}
                      className="text-[11px] uppercase tracking-widest text-white/50"
                    >
                      Type
                    </label>
                    <div className="relative mt-2 group">
                      <select
                        id={`type-${tweet.id}`}
                        name={`type-${tweet.id}`}
                        value={tweet.type ?? ""}
                        onChange={(event) => {
                          setRowErrors((prev) => ({
                            ...prev,
                            [tweet.id]: "",
                          }));
                          setTweets((prev) =>
                            prev.map((item) =>
                              item.id === tweet.id
                                ? {
                                    ...item,
                                    type:
                                      event.target.value === "BUY" ||
                                      event.target.value === "SELL" ||
                                      event.target.value === "ANALYSIS" ||
                                      event.target.value === "REVENUE"
                                        ? (event.target.value as "BUY" | "SELL" | "ANALYSIS" | "REVENUE")
                                        : null,
                                  }
                                : item
                            )
                          );
                        }}
                        className={selectClasses}
                      >
                        <option value="" className={optionClasses}>
                          Unclassified
                        </option>
                        <option value="BUY" className={optionClasses}>
                          BUY
                        </option>
                        <option value="SELL" className={optionClasses}>
                          SELL
                        </option>
                        <option value="ANALYSIS" className={optionClasses}>
                          ANALYSIS
                        </option>
                        <option value="REVENUE" className={optionClasses}>
                          REVENUE
                        </option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-primary/80 group-hover:text-white/70" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-widest text-white/50">
                      Visibility
                    </label>
                    <label
                      htmlFor={`visible-${tweet.id}`}
                      className="mt-2 flex items-center gap-2 text-xs text-white/70 cursor-pointer"
                    >
                      <input
                        id={`visible-${tweet.id}`}
                        type="checkbox"
                        checked={tweet.isVisible}
                        onChange={(event) => {
                          setRowErrors((prev) => ({
                            ...prev,
                            [tweet.id]: "",
                          }));
                          setTweets((prev) =>
                            prev.map((item) =>
                              item.id === tweet.id
                                ? { ...item, isVisible: event.target.checked }
                                : item
                            )
                          );
                      }}
                        className="h-4 w-4 rounded border-white/20 bg-black/40 text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                      />
                      Show on history
                    </label>
                  </div>
                  <div>
                    <label
                      htmlFor={`market-${tweet.id}`}
                      className="text-[11px] uppercase tracking-widest text-white/50"
                    >
                      Market
                    </label>
                    <div className="relative mt-2 group">
                      <select
                        id={`market-${tweet.id}`}
                        name={`market-${tweet.id}`}
                        value={tweet.marketId ?? ""}
                        onChange={(event) =>
                          setTweets((prev) =>
                            prev.map((item) =>
                              item.id === tweet.id
                                ? {
                                    ...item,
                                    marketId: event.target.value || null,
                                  }
                                : item
                            )
                          )
                        }
                        className={selectClasses}
                      >
                        <option value="" className={optionClasses}>
                          No market
                        </option>
                        {markets.map((market) => (
                          <option
                            key={market.id}
                            value={market.id}
                            className={optionClasses}
                          >
                            {market.title}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-primary/80 group-hover:text-white/70" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-[11px] uppercase tracking-widest text-white/50">
                    Original tweet
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-white/70 whitespace-pre-wrap">
                    {tweet.text}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-[11px] uppercase tracking-widest text-white/50">
                    Parsed fields
                  </div>
                  <textarea
                    value={tweet.rawJson.buyText}
                    onChange={(event) =>
                      handleFieldChange(tweet.id, "buyText", event.target.value)
                    }
                    rows={4}
                    placeholder="Text"
                    name={`tweet-${tweet.id}-text`}
                    autoComplete="off"
                    aria-label="Tweet text"
                    className={inputClasses}
                  />
                  <input
                    value={tweet.rawJson.market}
                    onChange={(event) =>
                      handleFieldChange(tweet.id, "market", event.target.value)
                    }
                    placeholder="Market"
                    name={`tweet-${tweet.id}-market`}
                    autoComplete="off"
                    aria-label="Market"
                    className={inputClasses}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={tweet.rawJson.amount}
                      onChange={(event) =>
                        handleFieldChange(
                          tweet.id,
                          "amount",
                          event.target.value
                        )
                      }
                      placeholder="Amount"
                      name={`tweet-${tweet.id}-amount`}
                      autoComplete="off"
                      inputMode="decimal"
                      aria-label="Amount"
                      className={inputClasses}
                    />
                    <input
                      value={tweet.rawJson.entry}
                      onChange={(event) =>
                        handleFieldChange(
                          tweet.id,
                          "entry",
                          event.target.value
                        )
                      }
                      placeholder="Entry"
                      name={`tweet-${tweet.id}-entry`}
                      autoComplete="off"
                      inputMode="decimal"
                      aria-label="Entry"
                      className={inputClasses}
                    />
                  </div>
                </div>
              </div>

              {tweet.marketId && marketTitle && (
                <div className="pt-4 border-t border-white/10 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-[11px] uppercase tracking-widest text-white/50">
                    Linked market
                  </div>
                  <Link
                    href={`/market/${tweet.marketId}`}
                    className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary/80 hover:text-primary transition-colors"
                  >
                    <span className="max-w-[280px] truncate">
                      {marketTitle}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          );
        })}

        {tweets.length === 0 && (
          <div className="glass-panel rounded-2xl p-12 text-center text-white/50">
            No tweets yet.
          </div>
        )}
      </div>
    </div>
  );
}
