import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PredictionMarket, PredictionOption } from "@/types";

// GET /api/markets - 获取所有市场
export async function GET(request: NextRequest) {
  try {
    // 暂时排除 NFT 字段，避免查询错误
    const markets = await prisma.market.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        status: true,
        archived: true,
        closeDate: true,
        resolveDate: true,
        createdAt: true,
        updatedAt: true,
        atypicaPickId: true,
        atypicaAnalysis: true,
        atypicaAnalysisUrl: true,
        atypicaPodcastUrl: true,
        atypicaSummary: true,
        accuracyScore: true,
        externalSource: true,
        externalData: true,
        polyMarketIcon: true,
        polyMarketUrl: true,
        viewCount: true,
        shareCount: true,
        poolAmount: true,
        poolCurrency: true,
        snapshots: {
          orderBy: { timestamp: "desc" },
          take: 1,
          select: {
            percentRealizedPnl: true,
          },
        },
        options: {
          select: {
            id: true,
            text: true,
            externalProb: true,
            atypicaProb: true,
            isWinner: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const results: PredictionMarket[] = markets.map((market) => {
      // 优先使用 polyMarketIcon，如果没有则从 externalData 中提取
      let icon: string | undefined = market.polyMarketIcon ?? undefined;
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
        description: market.description,
        category: market.category as any,
        createdAt: market.createdAt.toISOString(),
        updatedAt: market.updatedAt.toISOString(),
        closeDate: market.closeDate.toISOString(),
        resolveDate: market.resolveDate?.toISOString(),
        status: market.status as any,
        options: market.options.map(
          (option: {
            id: string;
            text: string;
            externalProb: number | null;
            atypicaProb: number | null;
            isWinner: boolean;
          }) => ({
            id: option.id,
            text: option.text,
            externalProb: option.externalProb ?? undefined,
            atypicaProb: option.atypicaProb ?? undefined,
            isWinner: option.isWinner,
          }),
        ),
        atypicaPickId: market.atypicaPickId ?? undefined,
        atypicaAnalysis: market.atypicaAnalysis ?? undefined,
        atypicaAnalysisUrl: market.atypicaAnalysisUrl ?? undefined,
        atypicaPodcastUrl: market.atypicaPodcastUrl ?? undefined,
        atypicaSummary: market.atypicaSummary ?? undefined,
        accuracyScore: market.accuracyScore ?? undefined,
        archived: market.archived,
        externalSource: market.externalSource ?? undefined,
        polyMarketIcon: market.polyMarketIcon ?? undefined,
        polyMarketUrl: market.polyMarketUrl ?? undefined,
        icon: icon,
        shareCount: market.shareCount,
        viewCount: market.viewCount,
        poolAmount: market.poolAmount ?? undefined,
        poolCurrency: market.poolCurrency ?? undefined,
        nftPercentRealizedPnl:
          market.snapshots[0]?.percentRealizedPnl ?? undefined,
      };
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("获取市场失败:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "获取市场失败",
      },
      { status: 500 },
    );
  }
}

// POST /api/markets - 保存单个市场
export async function POST(request: NextRequest) {
  try {
    const market: PredictionMarket = await request.json();

    const savedMarket = await prisma.market.create({
      data: {
        id: market.id,
        title: market.title,
        description: market.description,
        category: market.category,
        status: market.status,
        archived: market.archived ?? false,
        closeDate: new Date(market.closeDate),
        resolveDate: market.resolveDate ? new Date(market.resolveDate) : null,
        atypicaPickId: market.atypicaPickId,
        atypicaAnalysis: market.atypicaAnalysis,
        atypicaAnalysisUrl: market.atypicaAnalysisUrl,
        atypicaPodcastUrl: market.atypicaPodcastUrl,
        accuracyScore: market.accuracyScore,
        externalSource: market.externalSource,
        externalData: market.externalSource
          ? {
              source: market.externalSource,
              originalId: market.id,
              icon: market.icon,
            }
          : market.icon
            ? {
                icon: market.icon,
              }
            : undefined,
        viewCount: market.viewCount,
        shareCount: market.shareCount,
        poolAmount: market.poolAmount,
        poolCurrency: market.poolCurrency || "USD",
        options: {
          create: market.options.map((option: PredictionOption) => ({
            id: option.id,
            text: option.text,
            externalProb: option.externalProb,
            atypicaProb: option.atypicaProb,
            isWinner: option.isWinner || false,
          })),
        },
      },
      include: {
        options: true,
        snapshots: {
          orderBy: { timestamp: "desc" },
          take: 1,
        },
      },
    });

    // 优先使用 polyMarketIcon，如果没有则从 externalData 中提取
    let icon: string | undefined = savedMarket.polyMarketIcon ?? undefined;
    if (
      !icon &&
      savedMarket.externalData &&
      typeof savedMarket.externalData === "object"
    ) {
      const data = savedMarket.externalData as any;
      icon = data.icon || data.subMarket?.icon || data.eventGroup?.icon;
    }

    const result: PredictionMarket = {
      id: savedMarket.id,
      title: savedMarket.title,
      description: savedMarket.description,
      category: savedMarket.category as any,
      createdAt: savedMarket.createdAt.toISOString(),
      updatedAt: savedMarket.updatedAt.toISOString(),
      closeDate: savedMarket.closeDate.toISOString(),
      resolveDate: savedMarket.resolveDate?.toISOString(),
      status: savedMarket.status as any,
      options: savedMarket.options.map((option) => ({
        id: option.id,
        text: option.text,
        externalProb: option.externalProb ?? undefined,
        atypicaProb: option.atypicaProb ?? undefined,
        isWinner: option.isWinner,
      })),
      atypicaPickId: savedMarket.atypicaPickId ?? undefined,
      atypicaAnalysis: savedMarket.atypicaAnalysis ?? undefined,
      atypicaAnalysisUrl: savedMarket.atypicaAnalysisUrl ?? undefined,
      atypicaPodcastUrl: savedMarket.atypicaPodcastUrl ?? undefined,
      accuracyScore: savedMarket.accuracyScore ?? undefined,
      externalSource: savedMarket.externalSource ?? undefined,
      polyMarketIcon: savedMarket.polyMarketIcon ?? undefined,
      polyMarketUrl: savedMarket.polyMarketUrl ?? undefined,
      icon: icon,
      shareCount: savedMarket.shareCount,
      viewCount: savedMarket.viewCount,
      poolAmount: savedMarket.poolAmount ?? undefined,
      poolCurrency: savedMarket.poolCurrency ?? undefined,
      archived: savedMarket.archived,
      nftPercentRealizedPnl:
        savedMarket.snapshots[0]?.percentRealizedPnl ?? undefined,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("保存市场失败:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "保存市场失败" },
      { status: 500 },
    );
  }
}
