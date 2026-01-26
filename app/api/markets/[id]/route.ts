import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  AutoAnalysisResult,
  generateAutoAnalysisFromUrl,
} from '@/lib/analysisGenerator';

// PATCH /api/markets/[id] - 更新 Atypica 相关字段
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const body = await request.json();

    const {
      atypicaPickId,
      description,
      atypicaAnalysis,
      atypicaAnalysisUrl,
      atypicaPodcastUrl,
      atypicaSummary,
      accuracyScore,
      archived,
      options,
    }: {
      atypicaPickId?: string;
      description?: string;
      atypicaAnalysis?: string;
      atypicaAnalysisUrl?: string;
      atypicaPodcastUrl?: string;
      atypicaSummary?: string;
      accuracyScore?: number;
      archived?: boolean;
      options?: { id: string; atypicaProb?: number }[];
    } = body;

    const existingMarket = await prisma.market.findUnique({
      where: { id },
      select: { atypicaAnalysisUrl: true },
    });

    if (!existingMarket) {
      return NextResponse.json(
        { error: '未找到对应的市场' },
        { status: 404 },
      );
    }

    const normalizedUrl =
      typeof atypicaAnalysisUrl === 'string' &&
      atypicaAnalysisUrl.trim().length > 0
        ? atypicaAnalysisUrl.trim()
        : undefined;
    const previousUrl =
      existingMarket.atypicaAnalysisUrl?.trim().length > 0
        ? existingMarket.atypicaAnalysisUrl.trim()
        : undefined;

    const shouldAutoGenerate =
      normalizedUrl && normalizedUrl !== previousUrl;

    let autoSummaryResult: AutoAnalysisResult | null = null;

    if (shouldAutoGenerate && normalizedUrl) {
      autoSummaryResult = await generateAutoAnalysisFromUrl(normalizedUrl);
    }

    const updateData: any = {
      atypicaPickId,
      description,
      atypicaAnalysisUrl: normalizedUrl,
      atypicaPodcastUrl,
      accuracyScore,
      archived,
    };

    if (shouldAutoGenerate && autoSummaryResult) {
      updateData.atypicaSummary =
        autoSummaryResult.summary || atypicaSummary || undefined;
      updateData.atypicaAnalysis =
        autoSummaryResult.takeawayText ||
        autoSummaryResult.summary ||
        undefined;
    } else {
      updateData.atypicaAnalysis = atypicaAnalysis;
      updateData.atypicaSummary = atypicaSummary;
    }

    if (options && options.length > 0) {
      updateData.options = {
        updateMany: options.map((opt) => ({
          where: { id: opt.id },
          data: {
            atypicaProb:
              typeof opt.atypicaProb === 'number' ? opt.atypicaProb : null,
          },
        })),
      };
    }

    const updated = await prisma.market.update({
      where: { id },
      data: updateData,
      include: { options: true },
    });

    return NextResponse.json({
      id: updated.id,
      atypicaPickId: updated.atypicaPickId ?? undefined,
      description: updated.description ?? undefined,
      atypicaAnalysis: updated.atypicaAnalysis ?? undefined,
      atypicaAnalysisUrl: updated.atypicaAnalysisUrl ?? undefined,
      atypicaPodcastUrl: updated.atypicaPodcastUrl ?? undefined,
      atypicaSummary: updated.atypicaSummary ?? undefined,
      accuracyScore: updated.accuracyScore ?? undefined,
      archived: updated.archived,
      options: updated.options.map((o) => ({
        id: o.id,
        atypicaProb: o.atypicaProb ?? undefined,
      })),
    });
  } catch (error) {
    console.error('更新市场 Atypica 字段失败:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '更新市场 Atypica 字段失败',
      },
      { status: 500 },
    );
  }
}

// DELETE /api/markets/[id]
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await prisma.market.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除市场失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '删除市场失败' },
      { status: 500 },
    );
  }
}
