"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PredictionMarket, PredictionStatus } from "@/types";
import { CATEGORY_LABELS, STATUS_LABELS } from "@/constants";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Archive,
  History,
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const [markets, setMarkets] = useState<PredictionMarket[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<PredictionMarket | null>(null);
  const [archiveSaving, setArchiveSaving] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);

  useEffect(() => {
    loadMarkets();
  }, []);

  const loadMarkets = async () => {
    try {
      const response = await fetch("/api/markets");
      if (!response.ok) throw new Error("Failed to fetch markets");
      const data = await response.json();
      setMarkets(data);
    } catch (error) {
      console.error("Error loading markets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个预测市场吗？")) return;

    try {
      const response = await fetch(`/api/markets/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete market");

      setMarkets(markets.filter((m) => m.id !== id));
    } catch (error) {
      console.error("Error deleting market:", error);
      alert("删除失败");
    }
  };

  const handleArchive = (market: PredictionMarket) => {
    setArchiveTarget(market);
    setArchiveError(null);
    setArchiveOpen(true);
  };

  const handleArchiveConfirm = async () => {
    if (!archiveTarget) return;
    const nextArchived = !archiveTarget.archived;
    setArchiveSaving(true);
    setArchiveError(null);

    try {
      const response = await fetch(`/api/markets/${archiveTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: nextArchived }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "\u8bbe\u7f6e\u9690\u85cf\u72b6\u6001\u5931\u8d25");
      }

      setMarkets((prev) =>
        prev.map((m) =>
          m.id === archiveTarget.id ? { ...m, archived: nextArchived } : m,
        ),
      );
      setArchiveOpen(false);
      setArchiveTarget(null);
    } catch (error) {
      console.error("Error archiving market:", error);
      setArchiveError(
        error instanceof Error
          ? error.message
          : "\u8bbe\u7f6e\u9690\u85cf\u72b6\u6001\u5931\u8d25",
      );
    } finally {
      setArchiveSaving(false);
    }
  };

  const handleArchiveOpenChange = (open: boolean) => {
    setArchiveOpen(open);
    if (!open) {
      setArchiveError(null);
      setArchiveTarget(null);
    }
  };

  const handleResolve = async (marketId: string, winnerId: string) => {
    try {
      const response = await fetch(`/api/markets/${marketId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerOptionId: winnerId }),
      });

      if (!response.ok) throw new Error("Failed to resolve market");

      await loadMarkets();
    } catch (error) {
      console.error("Error resolving market:", error);
      alert("结算失败");
    }
  };

  const getStatusColor = (status: PredictionStatus) => {
    switch (status) {
      case PredictionStatus.ACTIVE:
        return "text-blue-400 bg-blue-500/10";
      case PredictionStatus.CLOSED:
        return "text-amber-400 bg-amber-500/10";
      case PredictionStatus.SUCCESSFUL:
        return "text-emerald-400 bg-emerald-500/10";
      case PredictionStatus.FAILED:
        return "text-rose-400 bg-rose-500/10";
      default:
        return "text-white/50 bg-white/5";
    }
  };

  const archiveTitle = archiveTarget?.archived
    ? "\u53d6\u6d88\u9690\u85cf\u8be5\u5e02\u573a\uff1f"
    : "\u9690\u85cf\u8be5\u5e02\u573a\uff1f";
  const archiveActionLabel = archiveTarget?.archived
    ? "\u53d6\u6d88\u9690\u85cf"
    : "\u9690\u85cf";


  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center text-white/60">加载中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">预测管理后台</h1>
          <p className="text-white/60 mt-1">管理、分析并结算预测市场</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin/history")}
            className="bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <History className="w-4 h-4" />
            Tweet Admin
          </button>
          <button
            onClick={() => router.push("/admin/create")}
            className="bg-primary hover:bg-primary/90 text-black font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            创建预测
          </button>
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="px-6 py-4 text-xs font-black text-white/60 uppercase tracking-widest">
                标题与分类
              </th>
              <th className="px-6 py-4 text-xs font-black text-white/60 uppercase tracking-widest">
                状态
              </th>
              <th className="px-6 py-4 text-xs font-black text-white/60 uppercase tracking-widest">
                截止日期
              </th>
              <th className="px-6 py-4 text-xs font-black text-white/60 uppercase tracking-widest text-right">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {markets.map((m) => (
              <React.Fragment key={m.id}>
                <tr
                  className={`border-b border-white/10 hover:bg-white/5 transition-colors ${expandedId === m.id ? "bg-white/5" : ""}`}
                >
                  <td className="px-6 py-4">
                    <div className="font-bold text-white mb-1">{m.title}</div>
                    <span className="text-[10px] font-black text-white/50 uppercase px-1.5 py-0.5 rounded border border-white/20">
                      {CATEGORY_LABELS[m.category]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold ${
                        m.archived
                          ? "text-white/70 bg-white/10"
                          : getStatusColor(m.status)
                      }`}
                    >
                      {m.archived ? "ARCHIVED" : STATUS_LABELS[m.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-white/60 font-medium">
                    {(() => {
                      const date = new Date(m.closeDate);
                      const month = date.getMonth() + 1;
                      const day = date.getDate();
                      const year = date.getFullYear();
                      return `${month}/${day}/${year}`;
                    })()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() =>
                          setExpandedId(expandedId === m.id ? null : m.id)
                        }
                        className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                      >
                        {expandedId === m.id ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => router.push(`/admin/${m.id}/edit`)}
                        className="p-2 text-white/40 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleArchive(m)}
                        className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <Archive className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedId === m.id && (
                  <tr>
                    <td colSpan={4} className="px-6 py-6 bg-black/20">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <h4 className="text-xs font-black text-white/60 uppercase mb-4 tracking-widest">
                            选项结算 (仅针对已结束预测)
                          </h4>
                          <div className="space-y-2">
                            {m.options.map((opt) => (
                              <div
                                key={opt.id}
                                className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10"
                              >
                                <span className="text-sm font-bold text-white flex items-center gap-2">
                                  {opt.text}
                                  {m.atypicaPickId === opt.id && (
                                    <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                                      AI 推荐
                                    </span>
                                  )}
                                  {opt.isWinner && (
                                    <CheckCircle2 className="w-4 h-4 text-primary" />
                                  )}
                                </span>
                                <button
                                  disabled={
                                    m.status === PredictionStatus.SUCCESSFUL ||
                                    m.status === PredictionStatus.FAILED
                                  }
                                  onClick={() => handleResolve(m.id, opt.id)}
                                  className="text-xs font-bold text-primary hover:underline disabled:opacity-30 disabled:no-underline"
                                >
                                  标记为获胜者
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                          <h4 className="text-xs font-black text-white/60 uppercase mb-4 tracking-widest">
                            Atypica 分析统计
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-2xl font-black text-white">
                                {m.viewCount}
                              </div>
                              <div className="text-[10px] text-white/50 font-bold uppercase">
                                浏览量
                              </div>
                            </div>
                            <div>
                              <div className="text-2xl font-black text-white">
                                {m.shareCount}
                              </div>
                              <div className="text-[10px] text-white/50 font-bold uppercase">
                                分享数
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <AlertDialog open={archiveOpen} onOpenChange={handleArchiveOpenChange}>
        <AlertDialogContent className="glass-panel">
          <AlertDialogHeader>
            <AlertDialogTitle>{archiveTitle}</AlertDialogTitle>
            {archiveTarget?.title && (
              <AlertDialogDescription>
                {archiveTarget.title}
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          {archiveError && (
            <div className="text-xs text-rose-400">{archiveError}</div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archiveSaving}>
              {"\u53d6\u6d88"}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={!archiveTarget || archiveSaving}
              onClick={(event) => {
                event.preventDefault();
                void handleArchiveConfirm();
              }}
            >
              {archiveSaving ? "\u5904\u7406\u4e2d..." : archiveActionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
