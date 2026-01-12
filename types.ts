
export enum Category {
  TECH = 'TECH',
  FINANCE = 'FINANCE',
  SPORTS = 'SPORTS',
  ENTERTAINMENT = 'ENTERTAINMENT',
  CULTURE = 'CULTURE',
  POLITICS = 'POLITICS',
  CRYPTO = 'CRYPTO'
}

export enum PredictionStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  SUCCESSFUL = 'SUCCESSFUL',
  FAILED = 'FAILED'
}

export interface PredictionOption {
  id: string;
  text: string;
  externalProb?: number; // 0-1
  atypicaProb?: number;  // 0-1
  isWinner?: boolean;
}

export interface PredictionMarket {
  id: string;
  title: string;
  description: string;
  category: Category;
  createdAt: string;
  updatedAt: string;
  closeDate: string;
  resolveDate?: string;
  status: PredictionStatus;
  options: PredictionOption[];
  atypicaPickId?: string;
  atypicaAnalysis?: string;
  atypicaAnalysisUrl?: string; // Atypica 分析报告链接
  atypicaSummary?: string;
  accuracyScore?: number; // 0-1
  externalSource?: string;
  polyMarketUrl?: string;
  polyMarketIcon?: string;
  icon?: string; // Event icon URL
  shareCount: number;
  viewCount: number;
  poolAmount?: number; // 池子总金额
  poolCurrency?: string; // 货币类型，例如 "USD"
  probability?: number;
  // NFT 持仓字段
  nftPercentRealizedPnl?: number; // 收益率/赔率
  nftCurrentValue?: number; // 当前价值
  nftWinValue?: number; // Win value
  nftLastSynced?: string; // 最后同步时间
  
}

// Polymarket API 响应类型
export interface PolymarketTag {
  id: string;
  label: string;
  slug: string;
}

export interface PolymarketSubMarket {
  id: string;
  question: string;
  slug: string;
  startDate: string;
  endDate: string;
  image: string;
  icon: string;
  description: string;
  outcomes: string;  // JSON string: "[\"Yes\", \"No\"]"
  outcomePrices: string;  // JSON string: "[\"0.45\", \"0.55\"]"
  volume: string;
  active: boolean;
  closed: boolean;
  bestBid?: number;
  bestAsk?: number;
  lastTradePrice?: number;
}

export interface PolymarketEventGroup {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  image: string;
  icon: string;
  active: boolean;
  closed: boolean;
  archived: boolean;
  new: boolean;
  featured: boolean;
  restricted: boolean;
  volume: number;
  markets: PolymarketSubMarket[];
  tags: PolymarketTag[];
}

// Polymarket 钱包持仓类型
export interface PolymarketPosition {
  proxyWallet: string;
  asset: string;
  conditionId: string;
  size: number;
  avgPrice: number;
  initialValue: number;
  currentValue: number;
  cashPnl: number;
  percentPnl: number;
  totalBought: number;
  realizedPnl: number;
  percentRealizedPnl: number;
  curPrice: number;
  redeemable: boolean;
  mergeable: boolean;
  title: string;
  slug: string;
  icon: string;
  eventId: string;
  eventSlug: string;
  outcome: string;
  outcomeIndex: number;
  oppositeOutcome: string;
  oppositeAsset: string;
  endDate: string;
  negativeRisk: boolean;
}
