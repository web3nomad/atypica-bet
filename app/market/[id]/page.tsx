import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { PredictionMarket, PredictionStatus, Category } from '@/types';
import MarketDetailClient from './MarketDetailClient';
import { unstable_cache } from 'next/cache';

const getMarket = unstable_cache(
  async (id: string): Promise<PredictionMarket | null> => {
    try {
      const market = await prisma.market.findUnique({
        where: { id },
        include: {
          options: true,
          snapshots: {
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
        },
      });

      if (!market) return null;

      let icon: string | undefined = undefined;
      if (market.externalData && typeof market.externalData === 'object') {
        const data = market.externalData as any;
        icon = data.icon || data.subMarket?.icon || data.eventGroup?.icon;
      }

      return {
        id: market.id,
        title: market.title,
        description: market.description || '',
        category: market.category as Category,
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
        nftPercentRealizedPnl: market.snapshots[0]?.percentRealizedPnl || undefined,
      };
    } catch (error) {
      console.error('Failed to fetch market:', error);
      return null;
    }
  },
  ['market-detail'],
  {
    revalidate: 60,
    tags: ['market'],
  }
);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const market = await getMarket(id);

  if (!market) {
    return {
      title: 'Market Not Found',
    };
  }

  return {
    title: market.title,
    description: market.description,
    openGraph: {
      title: market.title,
      description: market.description,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: market.title,
      description: market.description,
    },
  };
}

export default async function MarketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const market = await getMarket(id);

  if (!market) {
    notFound();
  }

  return <MarketDetailClient market={market} />;
}
