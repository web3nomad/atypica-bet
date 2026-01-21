import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PredictionMarket, PredictionOption, PolymarketEventGroup } from '@/types';
import { convertEventGroupToMarkets } from '@/lib/polymarket';

interface BatchImportBody {
  eventGroup?: PolymarketEventGroup;
  selectedIds?: string[];
  markets?: PredictionMarket[];
  sourceUrl?: string;
}

const OPEN_ENDED_DATE = new Date('2099-12-31T23:59:59.000Z');

const parseDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
};

// POST /api/markets/batch - 批量保存市场
export async function POST(request: NextRequest) {

  try {
    const body = (await request.json()) as BatchImportBody;

    let markets: PredictionMarket[] | undefined = body.markets;
    const sourceUrl =
      typeof body.sourceUrl === 'string' ? body.sourceUrl.trim() : '';

    // 兼容 Admin Polymarket 导入：通过 eventGroup + selectedIds 生成 markets
    if (!markets && body.eventGroup) {
      const selectedSet =
        body.selectedIds && body.selectedIds.length > 0
          ? new Set(body.selectedIds)
          : undefined;
      markets = convertEventGroupToMarkets(body.eventGroup, selectedSet);
    }

    if (!markets || markets.length === 0) {
      return NextResponse.json(
        { error: '缺少要保存的市场数据' },
        { status: 400 }
      );
    }

    const results: PredictionMarket[] = [];

    // 顺序插入，避免一次性打开过多连接导致超时
    for (const market of markets) {
      try {
        // 检查市场是否已存在
        const existingMarket = await prisma.market.findUnique({
          where: { id: market.id },
          include: { options: true },
        });

        let savedMarket;

        if (existingMarket) {
          const parsedCloseDate = parseDate(market.closeDate);
          const closeDate =
            parsedCloseDate ?? existingMarket.closeDate ?? OPEN_ENDED_DATE;
          const isOpenEnded =
            closeDate.getTime() === OPEN_ENDED_DATE.getTime();
          const resolveDate = parseDate(market.resolveDate);
          // 市场已存在，更新市场信息（保留已有的 atypica 相关字段，如果新数据没有提供）
          const polyMarketUrl = sourceUrl || market.polyMarketUrl;
          savedMarket = await prisma.market.update({
            where: { id: market.id },
            data: {
              title: market.title,
              description: market.description,
              category: market.category,
              status: market.status,
              closeDate,
              resolveDate: resolveDate ?? null,
              atypicaPickId: market.atypicaPickId ?? existingMarket.atypicaPickId ?? null,
              atypicaAnalysis: market.atypicaAnalysis ?? existingMarket.atypicaAnalysis ?? null,
              accuracyScore: market.accuracyScore ?? existingMarket.accuracyScore ?? null,
              externalSource: market.externalSource,
              externalData: market.externalSource
                ? {
                    source: market.externalSource,
                    originalId: market.id,
                    openEnded: isOpenEnded,
                    sourceUrl: sourceUrl || undefined,
                  }
                : undefined,
              polyMarketIcon: market.polyMarketIcon,
              polyMarketUrl,
              viewCount: market.probability !== undefined ? Math.round(market.probability * 10000) : 0,
              shareCount: market.shareCount,
              poolAmount: market.poolAmount,
              poolCurrency: market.poolCurrency || 'USD',
              options: {
                deleteMany: {},
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
                orderBy: { timestamp: 'desc' },
                take: 1,
              },
            },
          });
        } else {
          const parsedCloseDate = parseDate(market.closeDate);
          const closeDate = parsedCloseDate ?? OPEN_ENDED_DATE;
          const isOpenEnded =
            closeDate.getTime() === OPEN_ENDED_DATE.getTime();
          const resolveDate = parseDate(market.resolveDate);
          // 市场不存在，创建新市场
          const polyMarketUrl = sourceUrl || market.polyMarketUrl;
          savedMarket = await prisma.market.create({
            data: {
              id: market.id,
              title: market.title,
              description: market.description,
              category: market.category,
              status: market.status,
              closeDate,
              resolveDate: resolveDate ?? null,
              atypicaPickId: market.atypicaPickId,
              atypicaAnalysis: market.atypicaAnalysis,
              accuracyScore: market.accuracyScore,
              externalSource: market.externalSource,
              externalData: market.externalSource
                ? {
                    source: market.externalSource,
                    originalId: market.id,
                    openEnded: isOpenEnded,
                    sourceUrl: sourceUrl || undefined,
                  }
                : undefined,
              polyMarketUrl,
              polyMarketIcon: market.polyMarketIcon,
              viewCount: market.probability !== undefined ? Math.round(market.probability * 10000) : 0,
              shareCount: market.shareCount,
              poolAmount: market.poolAmount,
              poolCurrency: market.poolCurrency || 'USD',
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
                orderBy: { timestamp: 'desc' },
                take: 1,
              },
            },
          });
        }

        if (!savedMarket) {
          console.error(`保存市场失败: ${market.id}`);
          continue;
        }

        results.push({
          id: savedMarket.id,
          title: savedMarket.title,
          description: savedMarket.description,
          category: savedMarket.category as any,
          createdAt: savedMarket.createdAt.toISOString(),
          updatedAt: savedMarket.updatedAt.toISOString(),
          closeDate: savedMarket.closeDate.toISOString(),
          resolveDate: savedMarket.resolveDate?.toISOString(),
          status: savedMarket.status as any,
          options: savedMarket.options.map((option: { id: string; text: string; externalProb: number | null; atypicaProb: number | null; isWinner: boolean }) => ({
            id: option.id,
            text: option.text,
            externalProb: option.externalProb ?? undefined,
            atypicaProb: option.atypicaProb ?? undefined,
            isWinner: option.isWinner,
          })),
          atypicaPickId: savedMarket.atypicaPickId ?? undefined,
          atypicaAnalysis: savedMarket.atypicaAnalysis ?? undefined,
          accuracyScore: savedMarket.accuracyScore ?? undefined,
          externalSource: savedMarket.externalSource ?? undefined,
          shareCount: savedMarket.shareCount,
          viewCount: savedMarket.viewCount,
          poolAmount: savedMarket.poolAmount ?? undefined,
          poolCurrency: savedMarket.poolCurrency ?? undefined,
          nftPercentRealizedPnl: savedMarket.snapshots[0]?.percentRealizedPnl ?? undefined,
          polyMarketIcon: savedMarket.polyMarketIcon ?? undefined,
          polyMarketUrl: savedMarket.polyMarketUrl ?? undefined
        });
      } catch (error) {
        console.error(`保存市场 ${market.id} 失败:`, error);
        // 继续处理下一个市场
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('批量保存市场失败:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : '批量保存市场失败',
        details: process.env.NODE_ENV === 'development' ? {
          message: error instanceof Error ? error.message : '未知错误',
        } : undefined,
      },
      { status: 500 }
    );
  }
}
