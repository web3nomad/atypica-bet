import {
  PolymarketEventGroup,
  PolymarketSubMarket,
  PredictionMarket,
  PredictionOption,
  PredictionStatus,
  Category
} from '../types';

/**
 * 通过 slug 获取 Polymarket Event Group
 */
export async function fetchMarketBySlug(slug: string): Promise<PolymarketEventGroup> {
  const apiUrl = `/api/polymarket/events/slug/${slug}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('找不到该 Event，请检查 Slug 是否正确');
      }
      throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Polymarket API Error:', error);
    throw new Error(
      error instanceof Error
        ? `获取市场数据失败: ${error.message}`
        : '获取市场数据失败'
    );
  }
}

/**
 * 计算概率: (bestBid + bestAsk) / 2
 * 如果字段缺失，使用降级策略
 */
function calculateProbability(market: PolymarketSubMarket): number {
  const { bestBid, bestAsk, lastTradePrice } = market;

  if (bestBid !== undefined && bestAsk !== undefined) {
    return (bestBid + bestAsk) / 2;
  }

  if (lastTradePrice !== undefined) {
    return lastTradePrice;
  }

  try {
    const prices = JSON.parse(market.outcomePrices);
    return parseFloat(prices[0]) || 0.5;
  } catch {
    return 0.5;
  }
}

/**
 * 解析 outcomes 并创建选项
 */
function createOptionsFromOutcomes(
  market: PolymarketSubMarket,
  probability: number
): PredictionOption[] {
  try {
    const outcomes: string[] = JSON.parse(market.outcomes);

    return outcomes.map((outcome, index) => ({
      id: `opt-${market.id}-${index}`,
      text: outcome,
      externalProb: index === 0 ? probability : 1 - probability,
      atypicaProb: undefined,
      isWinner: undefined,
    }));
  } catch (error) {
    console.error('Failed to parse outcomes:', error);
    return [
      { id: `opt-${market.id}-0`, text: 'Yes', externalProb: probability },
      { id: `opt-${market.id}-1`, text: 'No', externalProb: 1 - probability },
    ];
  }
}

/**
 * 映射状态
 */
function mapStatus(active: boolean, closed: boolean): PredictionStatus {
  if (active && !closed) return PredictionStatus.ACTIVE;
  if (closed) return PredictionStatus.CLOSED;
  return PredictionStatus.ACTIVE;
}

/**
 * 根据 Polymarket tags 映射到 Category
 */
function mapCategoryFromTags(tags: { label: string; slug: string }[]): Category {
  if (!tags || tags.length === 0) {
    return Category.ENTERTAINMENT; // 默认值
  }

  // 根据 tag label 或 slug 来推断 category
  const tagLabels = tags.map(t => t.label.toLowerCase());
  const tagSlugs = tags.map(t => t.slug.toLowerCase());

  // 检查是否包含相关关键词（CRYPTO 优先检查，因为 crypto 可能同时匹配 TECH 和 FINANCE）
  if (tagLabels.some(l => l.includes('crypto') || l.includes('bitcoin') || l.includes('ethereum') || l.includes('blockchain') || l.includes('cryptocurrency') || l.includes('defi') || l.includes('token') || l.includes('coin') || l.includes('btc') || l.includes('eth')) ||
      tagSlugs.some(s => s.includes('crypto') || s.includes('bitcoin') || s.includes('ethereum') || s.includes('blockchain') || s.includes('defi'))) {
    return Category.CRYPTO;
  }

  // 检查是否包含相关关键词
  if (tagLabels.some(l => l.includes('tech') || l.includes('technology') || l.includes('ai')) ||
      tagSlugs.some(s => s.includes('tech') || s.includes('technology'))) {
    return Category.TECH;
  }

  if (tagLabels.some(l => l.includes('finance') || l.includes('financial') || l.includes('economics')) ||
      tagSlugs.some(s => s.includes('finance') || s.includes('financial'))) {
    return Category.FINANCE;
  }

  if (tagLabels.some(l => l.includes('sport') || l.includes('football') || l.includes('soccer') || l.includes('basketball') || l.includes('baseball')) ||
      tagSlugs.some(s => s.includes('sport'))) {
    return Category.SPORTS;
  }

  if (tagLabels.some(l => l.includes('politics') || l.includes('election') || l.includes('political') || l.includes('government') || l.includes('president')) ||
      tagSlugs.some(s => s.includes('politics') || s.includes('election') || s.includes('political'))) {
    return Category.POLITICS;
  }

  if (tagLabels.some(l => l.includes('culture') || l.includes('cultural') || l.includes('art') || l.includes('music') || l.includes('film') || l.includes('literature')) ||
      tagSlugs.some(s => s.includes('culture') || s.includes('cultural') || s.includes('art'))) {
    return Category.CULTURE;
  }

  if (tagLabels.some(l => l.includes('entertainment')) ||
      tagSlugs.some(s => s.includes('entertainment'))) {
    return Category.ENTERTAINMENT;
  }

  // 默认返回 ENTERTAINMENT
  return Category.ENTERTAINMENT;
}

/**
 * 转换单个子市场
 */
export function convertSubMarketToPrediction(
  subMarket: PolymarketSubMarket,
  eventGroup: PolymarketEventGroup
): PredictionMarket {
  const probability = calculateProbability(subMarket);
  const options = createOptionsFromOutcomes(subMarket, probability);
  // 从 eventGroup 的 tags 中映射 category
  const category = mapCategoryFromTags(eventGroup.tags || []);

  return {
    id: `poly-${subMarket.id}`,
    title: subMarket.question,
    description: subMarket.description || eventGroup.description,
    category: category,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    closeDate: subMarket.endDate,
    resolveDate: undefined,
    status: mapStatus(subMarket.active, subMarket.closed),
    options,
    atypicaPickId: undefined,
    atypicaAnalysis: undefined,
    accuracyScore: undefined,
    externalSource: `Polymarket:${eventGroup.title}`,
    shareCount: 0,
    viewCount: 0,
    poolAmount: parseFloat(subMarket.volume) || undefined,
    poolCurrency: 'USD',
  };
}

/**
 * 批量转换 Event Group
 */
export function convertEventGroupToMarkets(
  eventGroup: PolymarketEventGroup,
  selectedIds?: Set<string>
): PredictionMarket[] {
  let marketsToConvert = eventGroup.markets;

  if (selectedIds && selectedIds.size > 0) {
    marketsToConvert = marketsToConvert.filter(m => selectedIds.has(m.id));
  } else {
    marketsToConvert = marketsToConvert.filter(m => m.active);
  }

  return marketsToConvert.map(subMarket =>
    convertSubMarketToPrediction(subMarket, eventGroup)
  );
}

/**
 * 从 URL 提取 slug
 */
export function extractSlugFromUrl(input: string): string {
  const trimmed = input.trim();

  if (trimmed.startsWith('http')) {
    try {
      const url = new URL(trimmed);
      const segments = url.pathname.split('/').filter(Boolean);
      return segments[segments.length - 1] || '';
    } catch {
      return '';
    }
  }

  return trimmed;
}
