import { NextRequest, NextResponse } from 'next/server';
import { fetchWalletPositions } from '@/lib/polymarket';
import { syncPositionsToMarkets } from '@/lib/nftPositions';
import { setProxy } from '@/lib/proxy';

// POST /api/markets/sync-positions - 手动触发同步钱包持仓
export async function POST(request: NextRequest) {
  try {
    // 1. 确保代理设置完成
    await setProxy();
    
    // 2. 获取钱包持仓
    const positions = await fetchWalletPositions();

    if (positions.length === 0) {
      return NextResponse.json({
        message: '钱包中没有持仓',
        synced: 0,
        failed: 0,
      });
    }

    // 2. 同步到数据库
    const { synced, failed } = await syncPositionsToMarkets(positions);

    return NextResponse.json({
      message: `同步完成: 成功 ${synced} 个，失败 ${failed} 个`,
      synced,
      failed,
      total: positions.length,
    });
  } catch (error) {
    console.error('同步持仓失败:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '同步持仓失败',
      },
      { status: 500 }
    );
  }
}

