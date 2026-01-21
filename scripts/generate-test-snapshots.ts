/**
 * 生成测试快照数据（模拟 Vercel Cron Job 的历史数据）
 * 为现有的市场创建过去几天的每小时快照，用于快速测试 ECharts
 * 
 * 运行: pnpm test:generate-snapshots
 * 或: pnpm tsx scripts/generate-test-snapshots.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['error'],
});

/**
 * 生成测试快照数据
 * 为现有的市场创建过去几天的每小时快照
 */
async function generateTestSnapshots() {
  try {
    // 获取所有市场（最多6个，与 API limit 一致）
    const markets = await prisma.market.findMany({
      take: 6,
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (markets.length === 0) {
      console.log('❌ 没有找到市场，请先在 /admin 创建一些市场');
      console.log('   或者使用 API: POST /api/markets 创建市场');
      return;
    }

    console.log(`📊 找到 ${markets.length} 个市场，开始生成测试数据...\n`);

    // 生成过去7天的每小时数据（7天 × 24小时 = 168个数据点）
    const days = 7;
    const hoursPerDay = 24;
    const now = new Date();
    
    let totalCreated = 0;
    let totalUpdated = 0;

    for (const market of markets) {
      console.log(`📈 处理市场: "${market.title}"`);
      
      for (let day = days - 1; day >= 0; day--) {
        for (let hour = 0; hour < hoursPerDay; hour++) {
          // 计算时间戳（精确到小时）
          const timestamp = new Date(now);
          timestamp.setDate(timestamp.getDate() - day);
          timestamp.setHours(timestamp.getHours() - hour, 0, 0, 0);

          // 生成模拟的收益数据
          // 使用正弦波 + 随机波动来模拟真实的市场波动
          const timeIndex = (day * 24 + hour);
          
          // 为每个市场生成不同的趋势（使用 market.id 的 hash）
          const marketSeed = market.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const basePnl = Math.sin((timeIndex + marketSeed) / 10) * 15; // 基础趋势
          const randomVariation = (Math.random() - 0.5) * 8; // 随机波动
          const percentRealizedPnl = Math.round((basePnl + randomVariation) * 10) / 10;

          const currentValue = 1 + (percentRealizedPnl / 100);
          const winValue = 1;

          // 检查是否已存在相同时间的快照
          const existing = await prisma.positionSnapshot.findFirst({
            where: {
              marketId: market.id,
              timestamp: timestamp,
            },
          });

          if (existing) {
            // 更新现有快照
            await prisma.positionSnapshot.update({
              where: { id: existing.id },
              data: {
                percentRealizedPnl: percentRealizedPnl,
                currentValue: currentValue,
                winValue: winValue,
              },
            });
            totalUpdated++;
          } else {
            // 创建新快照
            await prisma.positionSnapshot.create({
              data: {
                marketId: market.id,
                timestamp: timestamp,
                percentRealizedPnl: percentRealizedPnl,
                currentValue: currentValue,
                winValue: winValue,
              },
            });
            totalCreated++;
          }
        }
      }
      
      console.log(`   ✅ 完成 (${days * hoursPerDay} 个数据点)`);
    }

    console.log(`\n🎉 完成！`);
    console.log(`   新建: ${totalCreated} 个快照`);
    console.log(`   更新: ${totalUpdated} 个快照`);
    console.log(`   总计: ${totalCreated + totalUpdated} 个数据点`);
    console.log(`\n💡 提示: 现在可以访问 http://localhost:3000 查看 ECharts 图表了！`);
  } catch (error) {
    console.error('❌ 生成测试数据失败:', error);
    if (error instanceof Error) {
      console.error('   错误信息:', error.message);
      console.error('   堆栈:', error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行脚本
generateTestSnapshots();
