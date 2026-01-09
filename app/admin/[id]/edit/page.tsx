import { prisma } from '@/lib/prisma';
import { MarketEditClient } from './MarketEditClient';
import { PredictionMarket, Category, PredictionStatus } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminMarketEditPage({ params }: PageProps) {
  const { id } = await params;

  const market = await prisma.market.findUnique({
    where: { id },
    include: { options: true },
  });

  if (!market) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <p className="text-white/70">未找到对应的市场（ID: {id}）。</p>
      </div>
    );
  }

  const predictionMarket: PredictionMarket = {
    id: market.id,
    title: market.title,
    description: market.description,
    category: market.category as Category,
    createdAt: market.createdAt.toISOString(),
    updatedAt: market.updatedAt.toISOString(),
    closeDate: market.closeDate.toISOString(),
    resolveDate: market.resolveDate?.toISOString(),
    status: market.status as PredictionStatus,
    options: market.options.map((o) => ({
      id: o.id,
      text: o.text,
      externalProb: o.externalProb ?? undefined,
      atypicaProb: o.atypicaProb ?? undefined,
      isWinner: o.isWinner,
    })),
    atypicaPickId: market.atypicaPickId ?? undefined,
    atypicaAnalysis: market.atypicaAnalysis ?? undefined,
    accuracyScore: market.accuracyScore ?? undefined,
    externalSource: market.externalSource ?? undefined,
    shareCount: market.shareCount,
    viewCount: market.viewCount,
    poolAmount: market.poolAmount ?? undefined,
    poolCurrency: market.poolCurrency ?? undefined,
  };

  return <MarketEditClient market={predictionMarket} />;
}


