import { prisma } from "@/lib/prisma";
import { PredictionMarket, PredictionStatus } from "@/types";
import HomeClient from "./HomeClient";

// Disable caching to always fetch fresh data from database
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

async function getMarkets(): Promise<PredictionMarket[]> {
  try {
    console.log("[getMarkets] 开始查询市场数据...");
    const markets = await prisma.market.findMany({
      where: {
        archived: false,
      },
      include: {
        options: true,
        snapshots: {
          orderBy: { timestamp: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`[getMarkets] 查询到 ${markets.length} 个市场`);
    const result = markets.map((market) => {
      // 优先使用 polyMarketIcon，如果没有则从 externalData 中提取
      let icon: string | undefined = market.polyMarketIcon || undefined;
      if (
        !icon &&
        market.externalData &&
        typeof market.externalData === "object"
      ) {
        const data = market.externalData as any;
        icon = data.icon || data.subMarket?.icon || data.eventGroup?.icon;
      }

      return {
        id: market.id,
        title: market.title,
        description: market.description || "",
        category: market.category as any,
        createdAt: market.createdAt.toISOString(),
        updatedAt: market.updatedAt.toISOString(),
        closeDate: market.closeDate.toISOString(),
        resolveDate: market.resolveDate?.toISOString(),
        status: market.status as PredictionStatus,
        options: market.options.map((opt) => ({
          id: opt.id,
          text: opt.text,
          externalProb: opt.externalProb || undefined,
          atypicaProb: opt.atypicaProb || undefined,
          isWinner: opt.isWinner ?? undefined,
        })),
        atypicaPickId: market.atypicaPickId || undefined,
        atypicaAnalysis: market.atypicaAnalysis || undefined,
        atypicaAnalysisUrl: market.atypicaAnalysisUrl || undefined,
        atypicaPodcastUrl: market.atypicaPodcastUrl || undefined,
        atypicaSummary: market.atypicaSummary || undefined,
        accuracyScore: market.accuracyScore || undefined,
        externalSource: market.externalSource || undefined,
        polyMarketIcon: market.polyMarketIcon || undefined,
        polyMarketUrl: market.polyMarketUrl || undefined,
        icon: icon,
        shareCount: market.shareCount || 0,
        viewCount: market.viewCount || 0,
        poolAmount: market.poolAmount || undefined,
        poolCurrency: market.poolCurrency || undefined,
        nftPercentRealizedPnl:
          market.snapshots[0]?.percentRealizedPnl || undefined,
      };
    });
    console.log(`[getMarkets] 成功映射 ${result.length} 个市场，准备返回`);
    return result;
  } catch (error) {
    console.error("[getMarkets] 查询市场失败:", error);
    if (error instanceof Error) {
      console.error("[getMarkets] 错误详情:", error.message);
      console.error("[getMarkets] 错误堆栈:", error.stack);
    }
    return [];
  }
}

export default async function HomePage() {
  const markets = await getMarkets();
  console.log("[HomePage] 收到市场数据:", markets.length, "个市场");

  if (markets.length === 0) {
    console.warn("[HomePage] ⚠️ 警告: 没有查询到任何市场数据！");
  }

  return <HomeClient initialMarkets={markets} />;
}
