
import { Category, PredictionStatus, PredictionMarket } from './types';

export const CATEGORY_LABELS: Record<Category, string> = {
  [Category.TECH]: 'Tech',
  [Category.FINANCE]: 'Finance',
  [Category.SPORTS]: 'Sports',
  [Category.ENTERTAINMENT]: 'Entertainment',
  [Category.CULTURE]: 'Culture',
  [Category.POLITICS]: 'Politics',
  [Category.CRYPTO]: 'Crypto'
};

export const STATUS_LABELS: Record<PredictionStatus, string> = {
  [PredictionStatus.ACTIVE]: 'Active',
  [PredictionStatus.CLOSED]: 'Closed',
  [PredictionStatus.SUCCESSFUL]: 'Resolved',
  [PredictionStatus.FAILED]: 'Failed'
};

export const INITIAL_MARKETS: PredictionMarket[] = [
  {
    id: '1',
    title: 'Which company will have the strongest AI model by end of 2026?',
    description: 'Evaluating multimodal capabilities, reasoning depth, developer ecosystem, and commercial applications.',
    category: Category.TECH,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    closeDate: '2026-12-31',
    status: PredictionStatus.ACTIVE,
    options: [
      { id: 'opt1', text: 'Google', externalProb: 0.3, atypicaProb: 0.15 },
      { id: 'opt2', text: 'OpenAI', externalProb: 0.5, atypicaProb: 0.75 },
      { id: 'opt3', text: 'Anthropic', externalProb: 0.2, atypicaProb: 0.1 }
    ],
    atypicaPickId: 'opt2',
    accuracyScore: 0.75,
    atypicaAnalysis: 'OpenAI with its strong first-mover advantage and rapid iteration capability is most likely to maintain the pinnacle of model capabilities in 2026. The breakthrough application of Q* technology will significantly enhance reasoning capabilities.',
    shareCount: 128,
    viewCount: 2540,
    poolAmount: 1250000,
    poolCurrency: 'USD'
  },
  {
    id: '2',
    title: 'Will Bitcoin break $150,000 in Q4 2025?',
    description: 'Analysis of macroeconomic trends, institutional holdings, and spot ETF cash inflows.',
    category: Category.FINANCE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    closeDate: '2025-12-31',
    status: PredictionStatus.ACTIVE,
    options: [
      { id: 'opt4', text: 'Yes', externalProb: 0.45, atypicaProb: 0.65 },
      { id: 'opt5', text: 'No', externalProb: 0.55, atypicaProb: 0.35 }
    ],
    atypicaPickId: 'opt4',
    accuracyScore: 0.68,
    atypicaAnalysis: 'With the establishment of the Fed rate cut cycle and the delayed halving effect, liquidity overflow will push Bitcoin into a new phase of price discovery.',
    shareCount: 89,
    viewCount: 1820,
    poolAmount: 3500000,
    poolCurrency: 'USD'
  },
  {
    id: '3',
    title: 'Who will win the 2025 Champions League?',
    description: 'Based on player injury predictions, historical performance, home/away advantage, and tactical evolution trends.',
    category: Category.SPORTS,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    closeDate: '2025-05-31',
    status: PredictionStatus.SUCCESSFUL,
    options: [
      { id: 'opt6', text: 'Manchester City', externalProb: 0.35, atypicaProb: 0.45, isWinner: true },
      { id: 'opt7', text: 'Real Madrid', externalProb: 0.4, atypicaProb: 0.3 },
      { id: 'opt8', text: 'Bayern Munich', externalProb: 0.25, atypicaProb: 0.25 }
    ],
    atypicaPickId: 'opt6',
    accuracyScore: 0.88,
    atypicaAnalysis: 'Manchester City\'s bench depth and Guardiola\'s meticulous attention to tactical details gives them a high fault tolerance in Champions League knockout stages.',
    shareCount: 210,
    viewCount: 4500,
    poolAmount: 2800000,
    poolCurrency: 'USD'
  },
  {
    id: '4',
    title: 'Which party will win the 2026 US Presidential Election?',
    description: 'Analysis of electoral trends, economic indicators, and key policy positions.',
    category: Category.ENTERTAINMENT,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    closeDate: '2026-11-03',
    status: PredictionStatus.ACTIVE,
    options: [
      { id: 'opt9', text: 'Democrats', externalProb: 0.48, atypicaProb: 0.55 },
      { id: 'opt10', text: 'Republicans', externalProb: 0.47, atypicaProb: 0.42 },
      { id: 'opt11', text: 'Other', externalProb: 0.05, atypicaProb: 0.03 }
    ],
    atypicaPickId: 'opt9',
    accuracyScore: 0.62,
    atypicaAnalysis: 'Democratic policies on healthcare and economic recovery are likely to resonate with key swing voters in battleground states.',
    shareCount: 315,
    viewCount: 7200,
    poolAmount: 4800000,
    poolCurrency: 'USD'
  }
];
