/**
 * 逐个字段测试脚本：找出哪个字段与数据库不匹配
 * 运行: npx tsx scripts/test-market-fields.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['error'],
});

async function testFields() {
  console.log('=== 开始逐个字段测试 ===\n');

  // 基础字段（肯定存在的）
  const baseFields = {
    id: true,
  };

  // 所有可能的字段列表
  const allFields = [
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

  let workingFields: string[] = [];
  let failedFields: string[] = [];

  console.log('测试策略：逐步添加字段，找出第一个失败的字段\n');

  // 逐步添加字段测试
  for (let i = 0; i < allFields.length; i++) {
    const currentFields = allFields.slice(0, i + 1);
    const selectObj: any = { id: true };
    
    for (const field of currentFields) {
      selectObj[field] = true;
    }

    try {
      console.log(`测试 ${i + 1}/${allFields.length}: 包含字段 [${currentFields.join(', ')}]`);
      const result = await prisma.market.findFirst({
        select: selectObj,
      });
      console.log(`✓ 成功\n`);
      workingFields.push(currentFields[currentFields.length - 1]);
    } catch (error: any) {
      const failedField = currentFields[currentFields.length - 1];
      console.error(`✗ 失败 - 问题字段: ${failedField}`);
      console.error(`  错误信息: ${error.message}`);
      console.error(`  错误代码: ${error.code}`);
      if (error.meta) {
        console.error(`  错误 meta:`, JSON.stringify(error.meta, null, 2));
        if (error.meta.column) {
          console.error(`  ❌ 数据库缺失的列: ${error.meta.column}`);
        }
      }
      console.error('');
      failedFields.push(failedField);
      break; // 找到第一个失败的字段就停止
    }
  }

  console.log('\n=== 测试结果汇总 ===');
  console.log(`✓ 正常字段 (${workingFields.length}):`, workingFields.join(', '));
  console.log(`✗ 问题字段 (${failedFields.length}):`, failedFields.join(', '));

  if (failedFields.length > 0) {
    console.log(`\n⚠️  第一个问题字段: ${failedFields[0]}`);
    console.log('   建议：检查数据库中是否存在该列，或从 schema 中移除该字段');
  }

  await prisma.$disconnect();
}

testFields().catch((error) => {
  console.error('脚本执行失败:', error);
  process.exit(1);
});

