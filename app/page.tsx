import { prisma } from '@/lib/prisma';
import { PredictionMarket, PredictionStatus } from '@/types';
import HomeClient from './HomeClient';

async function getMarkets(): Promise<PredictionMarket[]> {
  try {
    const markets = await prisma.market.findMany({
      include: { options: true },
      orderBy: { createdAt: 'desc' },
    });

    return markets.map(market => {
      // 从 externalData 中提取 icon
      let icon: string | undefined = undefined;
      if (market.externalData && typeof market.externalData === 'object') {
        const data = market.externalData as any;
        icon = data.icon || data.subMarket?.icon || data.eventGroup?.icon;
      }

      return {
        id: market.id,
        title: market.title,
        description: market.description || '',
        category: market.category as any,
        createdAt: market.createdAt.toISOString(),
        updatedAt: market.updatedAt.toISOString(),
        closeDate: market.closeDate.toISOString(),
        resolveDate: market.resolveDate?.toISOString(),
        status: market.status as PredictionStatus,
        options: market.options.map(opt => ({
          id: opt.id,
          text: opt.text,
          externalProb: opt.externalProb || undefined,
          atypicaProb: opt.atypicaProb || undefined,
          isWinner: opt.isWinner ?? undefined,
        })),
        atypicaPickId: market.atypicaPickId || undefined,
        atypicaAnalysis: market.atypicaAnalysis || undefined,
        accuracyScore: market.accuracyScore || undefined,
        externalSource: market.externalSource || undefined,
        icon: icon,
        shareCount: market.shareCount || 0,
        viewCount: market.viewCount || 0,
        poolAmount: market.poolAmount || undefined,
        poolCurrency: market.poolCurrency || undefined,
        nftPercentRealizedPnl: market.nftPercentRealizedPnl || undefined
      };
    });
  } catch (error) {
    console.error('Failed to fetch markets:', error);
    return [];
  }
}

export default async function HomePage() {
  const markets = await getMarkets();

  return <HomeClient initialMarkets={markets} />;
}
