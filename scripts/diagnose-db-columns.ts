/**
 * 诊断脚本：检查数据库中哪些字段存在，哪些不存在
 * 运行: npx tsx scripts/diagnose-db-columns.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function diagnose() {
  console.log('=== 开始诊断数据库字段 ===\n');

  // Schema 中定义的所有 Market 字段
  const marketFields = [
    'id',
    'title',
    'description',
    'category',
    'status',
    'closeDate',
    'resolveDate',
    'createdAt',
    'updatedAt',
    'atypicaPickId',
    'atypicaAnalysis',
    'atypicaAnalysisUrl',
    'accuracyScore',
    'externalSource',
    'externalData',
    'viewCount',
    'shareCount',
    'poolAmount',
    'poolCurrency',
  ];

  console.log('测试 1: 不使用 include 查询所有字段');
  try {
    const result = await prisma.market.findFirst({
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        status: true,
        closeDate: true,
        resolveDate: true,
        createdAt: true,
        updatedAt: true,
        atypicaPickId: true,
        atypicaAnalysis: true,
        atypicaAnalysisUrl: true,
        accuracyScore: true,
        externalSource: true,
        externalData: true,
        viewCount: true,
        shareCount: true,
        poolAmount: true,
        poolCurrency: true,
      },
    });
    console.log('✓ 所有字段查询成功\n');
  } catch (error: any) {
    console.error('✗ 查询失败:', error.message);
    console.error('Error code:', error.code);
    console.error('Error meta:', JSON.stringify(error.meta, null, 2));
    if (error.meta?.column) {
      console.error(`\n❌ 问题字段: ${error.meta.column}`);
    }
  }

  console.log('测试 2: 使用 include 查询关联');
  try {
    const result = await prisma.market.findFirst({
      include: {
        options: true,
      },
    });
    console.log('✓ 关联查询成功\n');
  } catch (error: any) {
    console.error('✗ 关联查询失败:', error.message);
    console.error('Error code:', error.code);
    console.error('Error meta:', JSON.stringify(error.meta, null, 2));
    if (error.meta?.column) {
      console.error(`\n❌ 问题字段: ${error.meta.column}`);
    }
  }

  console.log('测试 3: 逐个字段测试');
  for (const field of marketFields) {
    try {
      await prisma.market.findFirst({
        select: {
          [field]: true,
        } as any,
      });
      console.log(`✓ ${field}`);
    } catch (error: any) {
      console.error(`✗ ${field} - 错误:`, error.message);
      if (error.meta?.column) {
        console.error(`  问题列: ${error.meta.column}`);
      }
    }
  }

  await prisma.$disconnect();
}

diagnose().catch(console.error);

