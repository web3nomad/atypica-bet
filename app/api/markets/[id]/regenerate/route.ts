import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateAutoAnalysisFromUrl } from '@/lib/analysisGenerator';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const market = await prisma.market.findUnique({
      where: { id },
      select: { atypicaAnalysisUrl: true },
    });

    if (!market) {
      return NextResponse.json(
        { error: '未找到对应的市场' },
        { status: 404 },
      );
    }

    const normalizedUrl =
      market.atypicaAnalysisUrl?.trim().length > 0
        ? market.atypicaAnalysisUrl.trim()
        : undefined;

    if (!normalizedUrl) {
      return NextResponse.json(
        { error: '请先设置分析报告链接再重新生成' },
        { status: 400 },
      );
    }

    const autoResult = await generateAutoAnalysisFromUrl(normalizedUrl);

    const updated = await prisma.market.update({
      where: { id },
      data: {
        atypicaSummary: autoResult.summary || undefined,
        atypicaAnalysis:
          autoResult.takeawayText || autoResult.summary || undefined,
      },
      select: {
        atypicaSummary: true,
        atypicaAnalysis: true,
      },
    });

    return NextResponse.json({
      atypicaSummary: updated.atypicaSummary ?? null,
      atypicaAnalysis: updated.atypicaAnalysis ?? null,
    });
  } catch (error) {
    console.error('重新生成分析失败:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '重新生成分析失败',
      },
      { status: 500 },
    );
  }
}
