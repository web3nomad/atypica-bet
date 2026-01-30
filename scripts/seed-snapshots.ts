/**
 * 脚本：为现有市场添加测试快照数据
 * 用于测试获利率显示功能
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始添加测试快照数据...\n');

  // 获取所有活跃的市场
  const markets = await prisma.market.findMany({
    where: {
      status: 'ACTIVE',
    },
    take: 10,
    select: {
      id: true,
      title: true,
    },
  });

  if (markets.length === 0) {
    console.log('没有找到活跃的市场，尝试获取所有市场...');
    const allMarkets = await prisma.market.findMany({
      take: 10,
      select: {
        id: true,
        title: true,
      },
    });

    if (allMarkets.length === 0) {
      console.log('❌ 数据库中没有任何市场数据');
      return;
    }

    console.log(`找到 ${allMarkets.length} 个市场\n`);

    for (const market of allMarkets) {
      await addSnapshot(market.id, market.title);
    }
  } else {
    console.log(`找到 ${markets.length} 个活跃市场\n`);

    for (const market of markets) {
      await addSnapshot(market.id, market.title);
    }
  }

  console.log('\n✅ 测试快照数据添加完成！');
}

async function addSnapshot(marketId: string, marketTitle: string) {
  // 生成随机的收益率（-50% 到 +100%）
  const percentRealizedPnl = Math.random() * 150 - 50;

  // 生成随机的当前价值和 win value
  const currentValue = Math.random() * 10000 + 1000;
  const winValue = currentValue + (currentValue * percentRealizedPnl / 100);

  try {
    const snapshot = await prisma.positionSnapshot.create({
      data: {
        marketId: marketId,
        timestamp: new Date(),
        percentRealizedPnl: percentRealizedPnl,
        currentValue: currentValue,
        winValue: winValue,
      },
    });

    console.log(`✓ ${marketTitle.substring(0, 50)}...`);
    console.log(`  收益率: ${percentRealizedPnl >= 0 ? '+' : ''}${percentRealizedPnl.toFixed(2)}%`);
    console.log(`  当前价值: $${currentValue.toFixed(2)}`);
    console.log(`  Win Value: $${winValue.toFixed(2)}\n`);
  } catch (error) {
    console.error(`❌ 为市场 "${marketTitle}" 添加快照失败:`, error);
  }
}

main()
  .catch((e) => {
    console.error('脚本执行失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
