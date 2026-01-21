"use client";

import React, { useEffect, useState } from "react";
import { PredictionMarket } from "@/types";

type AdminTweet = {
  id: string;
  tweetId: string;
  text: string;
  type: "BUY" | "SELL" | null;
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
              type: tweet.type === "BUY" || tweet.type === "SELL" ? tweet.type : null,
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
                type: data.type === "BUY" || data.type === "SELL" ? data.type : null,
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
          className="bg-primary hover:bg-primary/90 text-black font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-primary/20 transition-all disabled:opacity-60"
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
                    <div className="text-xs text-red-400">
                      {rowErrors[tweet.id]}
                    </div>
                  )}
                  <button
                    onClick={() => handleSave(tweet)}
                    disabled={savingId === tweet.id}
                    className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-60"
                  >
                    {savingId === tweet.id ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[220px_1fr_360px] gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] uppercase tracking-widest text-white/50">
                      Type
                    </label>
                    <select
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
                                    event.target.value === "SELL"
                                      ? (event.target.value as "BUY" | "SELL")
                                      : null,
                                }
                              : item
                          )
                        );
                      }}
                      className="mt-2 w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/70"
                    >
                      <option value="">Unclassified</option>
                      <option value="BUY">BUY</option>
                      <option value="SELL">SELL</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-widest text-white/50">
                      Visibility
                    </label>
                    <label className="mt-2 flex items-center gap-2 text-xs text-white/70">
                      <input
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
                        className="h-4 w-4 rounded border-white/20 bg-black/40"
                      />
                      Show on history
                    </label>
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-widest text-white/50">
                      Market
                    </label>
                    <select
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
                      className="mt-2 w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/70"
                    >
                      <option value="">No market</option>
                      {markets.map((market) => (
                        <option key={market.id} value={market.id}>
                          {market.title}
                        </option>
                      ))}
                    </select>
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
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/70"
                  />
                  <input
                    value={tweet.rawJson.market}
                    onChange={(event) =>
                      handleFieldChange(tweet.id, "market", event.target.value)
                    }
                    placeholder="Market"
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/70"
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
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/70"
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
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/70"
                    />
                  </div>
                </div>
              </div>
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
