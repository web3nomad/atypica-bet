import { NextRequest, NextResponse } from 'next/server';
import { fetchWalletPositions } from '@/lib/polymarket';
import { prisma } from '@/lib/prisma';
import { setProxy } from '@/lib/proxy';

/**
 * POST /api/positions/snapshot
 * 创建持仓快照
 * - 获取钱包持仓数据
 * - 匹配对应的 Market
 * - 创建快照记录（自动去重：同一市场同一小时只保留最新一条）
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 确保代理设置完成
    await setProxy();

    // 2. 获取钱包持仓
    const positions = await fetchWalletPositions();

    if (positions.length === 0) {
      return NextResponse.json({
        success: true,
        message: '钱包中没有持仓',
        timestamp: new Date().toISOString(),
        snapshotCount: 0,
        markets: [],
      });
    }

    // 3. 当前时间（精确到小时）
    const now = new Date();
    const timestamp = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0);

    const createdSnapshots: string[] = [];
    let failedCount = 0;

    // 4. 为每个持仓创建快照
    for (const position of positions) {
      try {
        const currentValue = 1 * (position.percentRealizedPnl / 100);
        const winValue = position.totalBought;

        // 匹配对应的 Market
        const markets = await prisma.market.findMany({
          where: {
            OR: [
              { title: position.title },
              { title: { contains: position.title.split('?')[0].trim() } },
              { externalSource: { contains: position.eventSlug } },
            ],
          },
        });

        if (markets.length === 0) {
          console.warn(`未找到匹配的 Market: ${position.title} (eventSlug: ${position.eventSlug})`);
          failedCount++;
          continue;
        }

        const market = markets[0];

        // 检查是否已存在相同时间的快照
        const existingSnapshot = await prisma.positionSnapshot.findFirst({
          where: {
            marketId: market.id,
            timestamp: timestamp,
          },
        });

        if (existingSnapshot) {
          // 更新现有快照
          await prisma.positionSnapshot.update({
            where: { id: existingSnapshot.id },
            data: {
              percentRealizedPnl: position.percentRealizedPnl,
              currentValue: currentValue,
              winValue: winValue,
            },
          });
        } else {
          // 创建新快照
          await prisma.positionSnapshot.create({
            data: {
              marketId: market.id,
              timestamp: timestamp,
              percentRealizedPnl: position.percentRealizedPnl,
              currentValue: currentValue,
              winValue: winValue,
            },
          });
        }

        createdSnapshots.push(market.id);
        console.log(`已创建快照: Market ${market.id} (${market.title})`);
      } catch (error) {
        console.error(`创建快照失败 (${position.title}):`, error);
        failedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `快照创建完成: 成功 ${createdSnapshots.length} 个，失败 ${failedCount} 个`,
      timestamp: timestamp.toISOString(),
      snapshotCount: createdSnapshots.length,
      markets: createdSnapshots,
    });
  } catch (error) {
    console.error('创建快照失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '创建快照失败',
      },
      { status: 500 }
    );
  }
}
