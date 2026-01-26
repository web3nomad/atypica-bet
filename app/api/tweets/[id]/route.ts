import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const parseNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const normalized = value.replace(/,/g, '').replace(/[^0-9.+-]/g, '');
  if (!normalized) return null;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const marketId =
      typeof body.marketId === 'string' && body.marketId.length > 0
        ? body.marketId
        : null;
    const type =
      body.type === 'BUY' ||
      body.type === 'SELL' ||
      body.type === 'ANALYSIS' ||
      body.type === 'REVENUE'
        ? body.type
        : null;
    const isTrade = type === 'BUY' || type === 'SELL';
    const isVisible = body.isVisible === true;
    const rawJsonInput =
      body.rawJson && typeof body.rawJson === 'object' ? body.rawJson : null;
    const buyText =
      typeof rawJsonInput?.buyText === 'string'
        ? rawJsonInput.buyText.trim()
        : '';
    const market =
      typeof rawJsonInput?.market === 'string'
        ? rawJsonInput.market.trim()
        : '';
    const amount = parseNumber(rawJsonInput?.amount);
    const entry = parseNumber(rawJsonInput?.entry);
    const hasFields =
      buyText.length > 0 &&
      market.length > 0 &&
      amount !== null &&
      entry !== null;
    const analysisText =
      typeof rawJsonInput?.analysisText === 'string'
        ? rawJsonInput.analysisText.trim()
        : '';
    const analysisTitle =
      typeof rawJsonInput?.analysisTitle === 'string'
        ? rawJsonInput.analysisTitle.trim()
        : '';
    const headerText =
      typeof rawJsonInput?.headerText === 'string'
        ? rawJsonInput.headerText.trim()
        : '';
    const period =
      typeof rawJsonInput?.period === 'string' ? rawJsonInput.period.trim() : '';
    const portfolioLine =
      typeof rawJsonInput?.portfolioLine === 'string'
        ? rawJsonInput.portfolioLine.trim()
        : '';
    const portfolioLabel =
      typeof rawJsonInput?.portfolioLabel === 'string'
        ? rawJsonInput.portfolioLabel.trim()
        : '';
    const revenueRate = parseNumber(rawJsonInput?.revenueRate);
    const profitLoss = parseNumber(rawJsonInput?.profitLoss);

    if (isVisible && (!type || (isTrade && !hasFields))) {
      return NextResponse.json(
        {
          error: 'Visible tweets require type and complete fields.',
        },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if ('marketId' in body) updateData.marketId = marketId;
    if ('type' in body) updateData.type = type;
    if ('isVisible' in body) updateData.isVisible = isVisible;
    if ('rawJson' in body) {
      if (isTrade) {
        updateData.rawJson = {
          parsed: hasFields && Boolean(type),
          template: type ?? undefined,
          buyText,
          market,
          amount,
          entry,
        };
      } else if (type === 'ANALYSIS') {
        updateData.rawJson = {
          parsed: Boolean(analysisText),
          template: type,
          analysisText,
          analysisTitle,
        };
      } else if (type === 'REVENUE') {
        updateData.rawJson = {
          parsed: Boolean(headerText),
          template: type,
          headerText,
          period,
          portfolioLine,
          portfolioLabel,
          revenueRate,
          profitLoss,
        };
      }
    }

    const updated = await prisma.tweet.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        marketId: true,
        type: true,
        isVisible: true,
        rawJson: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update tweet:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to update tweet',
      },
      { status: 500 }
    );
  }
}
