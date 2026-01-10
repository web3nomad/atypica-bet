import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/positions/history
 * 查询持仓历史快照数据
 *
 * 查询参数：
 * - marketIds: 逗号分隔的市场 ID 列表（可选）
 * - startTime: 开始时间 ISO 8601（可选）
 * - endTime: 结束时间 ISO 8601（可选）
 * - limit: 返回的市场数量（默认6）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const marketIdsParam = searchParams.get('marketIds');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');
    const limit = parseInt(searchParams.get('limit') || '6');

    let marketIds: string[] = [];

    // 如果指定了 marketIds，使用指定的 ID
    if (marketIdsParam) {
      marketIds = marketIdsParam.split(',').map(id => id.trim());
    } else {
      // 否则，查询最近有快照的 N 个市场
      const recentMarkets = await prisma.market.findMany({
        where: {
          snapshots: {
            some: {},
          },
        },
        orderBy: {
          snapshots: {
            _count: 'desc',
          },
        },
        take: limit,
        select: {
          id: true,
        },
      });

      marketIds = recentMarkets.map(m => m.id);
    }

    if (marketIds.length === 0) {
      return NextResponse.json({
        markets: [],
      });
    }

    // 构建查询条件
    const whereClause: any = {
      marketId: {
        in: marketIds,
      },
    };

    if (startTime || endTime) {
      whereClause.timestamp = {};
      if (startTime) {
        whereClause.timestamp.gte = new Date(startTime);
      }
      if (endTime) {
        whereClause.timestamp.lte = new Date(endTime);
      }
    }

    // 查询市场和快照数据
    const markets = await prisma.market.findMany({
      where: {
        id: {
          in: marketIds,
        },
      },
      select: {
        id: true,
        title: true,
        snapshots: {
          where: whereClause.timestamp ? { timestamp: whereClause.timestamp } : {},
          orderBy: {
            timestamp: 'asc',
          },
          select: {
            timestamp: true,
            percentRealizedPnl: true,
            currentValue: true,
            winValue: true,
          },
        },
      },
    });

    // 只返回有快照的市场
    const marketsWithSnapshots = markets.filter(m => m.snapshots.length > 0);

    // 格式化返回数据
    const result = {
      markets: marketsWithSnapshots.map(market => ({
        marketId: market.id,
        title: market.title,
        snapshots: market.snapshots.map(snapshot => ({
          timestamp: snapshot.timestamp.toISOString(),
          percentRealizedPnl: snapshot.percentRealizedPnl,
          currentValue: snapshot.currentValue,
          winValue: snapshot.winValue,
        })),
      })),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('查询历史快照失败:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '查询历史快照失败',
      },
      { status: 500 }
    );
  }
}
