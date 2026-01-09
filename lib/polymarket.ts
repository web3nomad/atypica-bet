import {
  PolymarketEventGroup,
  PolymarketSubMarket,
  PredictionMarket,
  PredictionOption,
  PredictionStatus,
  Category,
  PolymarketPosition,
} from '@/types';
import { setProxy } from './proxy';
import 'dotenv/config';
/**
 * 服务端调用 Polymarket API（直接调用外部 API）
 */
export async function fetchMarketBySlug(slug: string): Promise<PolymarketEventGroup> {

  await setProxy();

  
  const apiUrl = `https://gamma-api.polymarket.com/events/slug/${slug}`;

  try {
    console.log('[Polymarket] 正在请求:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      // Next.js 特定的 fetch 选项
      next: { revalidate: 60 }, // 缓存 60 秒
    });

    console.log('[Polymarket] 响应状态:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Polymarket] 错误响应:', errorText);

      if (response.status === 404) {
        throw new Error('找不到该 Event，请检查 Slug 是否正确');
      }
      throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[Polymarket] 成功获取数据');
    return data;
  } catch (error) {
    console.error('[Polymarket] 详细错误:', error);

    // 提供更详细的错误信息
    if (error instanceof Error) {
      if (error.message.includes('fetch failed')) {
        throw new Error(`网络请求失败，可能是网络连接问题或 Polymarket API 不可达。原始错误: ${error.message}`);
      }
      throw new Error(`获取市场数据失败: ${error.message}`);
    }
    throw new Error('获取市场数据失败: 未知错误');
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
 * 转换单个子市场
 */
export function convertSubMarketToPrediction(
  subMarket: PolymarketSubMarket,
  eventGroup: PolymarketEventGroup
): PredictionMarket {
  const probability = calculateProbability(subMarket);
  const options = createOptionsFromOutcomes(subMarket, probability);

  return {
    id: `poly-${subMarket.id}`,
    title: subMarket.question,
    description: subMarket.description || eventGroup.description,
    category: Category.SPORTS,
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
    probability: probability
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

/**
 * 获取钱包持仓（服务端调用）
 */
export async function fetchWalletPositions(): Promise<PolymarketPosition[]> {
  const walletAddress = process.env.POLYMARKET_WALLET_ADDRESS;
  

  console.log(walletAddress)
  
  if (!walletAddress) {
    throw new Error('钱包地址未配置，请在环境变量中设置 POLYMARKET_WALLET_ADDRESS');
  }
  
  // 确保代理设置完成
  await setProxy();
  
  // 将钱包地址转换为小写（以太坊地址通常需要小写）
  const normalizedAddress = walletAddress.toLowerCase();
  const apiUrl = `https://data-api.polymarket.com/positions?user=${normalizedAddress}`;

  try {
    console.log('[Polymarket] 正在获取钱包持仓:', normalizedAddress);
    console.log('[Polymarket] API URL:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      // 读取错误响应的 body 来获取详细错误信息
      const errorText = await response.text();
      console.error('[Polymarket] API 错误响应:', errorText);
      console.error('[Polymarket] 响应状态:', response.status, response.statusText);
      throw new Error(`获取持仓失败: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const positions: PolymarketPosition[] = await response.json();
    console.log(`[Polymarket] 成功获取 ${positions.length} 个持仓`);
    return positions;
  } catch (error) {
    console.error('[Polymarket] 获取持仓失败:', error);
    throw error;
  }
}
