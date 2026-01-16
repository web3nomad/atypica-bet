import { TwitterPost } from '@/types';

/**
 * Mock Twitter trading activity data
 * This will be replaced with real TikHub API data later
 */
export const mockTwitterPosts: TwitterPost[] = [
  {
    id: '1',
    tweetId: '1747234567890123456',
    content: '🟢 Just opened a position on Bitcoin hitting $105K by March. Market sentiment is bullish after recent ETF inflows. Going long with 15% of portfolio.',
    author: {
      handle: '@ioiiobet',
      name: 'ioiio.bet',
      avatar: '/images/logoicon.jpg',
    },
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    tradeData: {
      action: 'BUY',
      market: 'BTC > $105K by March',
      amount: 1250,
      price: 0.67,
      revenueRate: 0, // Just opened
      profitLoss: 0,
    },
    media: {
      images: [],
      videos: [],
      links: ['https://polymarket.com/event/bitcoin-105k-march'],
    },
    engagement: {
      likes: 234,
      retweets: 45,
      replies: 18,
    },
  },
  {
    id: '2',
    tweetId: '1747123456789012345',
    content: '📊 Weekly Update: Portfolio up 22.8% this week! Best performers:\n• Trump 2024 Election: +34.2%\n• ETH > $4K: +18.5%\n• S&P500 ATH: +12.1%\n\nRisk management paying off. Full breakdown 👇',
    author: {
      handle: '@ioiiobet',
      name: 'ioiio.bet',
      avatar: '/images/logoicon.jpg',
    },
    publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    tradeData: {
      action: 'UPDATE',
      market: 'Portfolio',
      revenueRate: 22.8,
      profitLoss: 3845,
    },
    media: {
      images: [],
      videos: [],
      links: [],
    },
    engagement: {
      likes: 567,
      retweets: 123,
      replies: 45,
    },
  },
  {
    id: '3',
    tweetId: '1746987654321098765',
    content: '🔴 SOLD: Ethereum $4K position. Took profits at +18.5% after resistance at $3,950. Will re-enter on pullback to $3,700 support level. Never regret taking gains.',
    author: {
      handle: '@ioiiobet',
      name: 'ioiio.bet',
      avatar: '/images/logoicon.jpg',
    },
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    tradeData: {
      action: 'SELL',
      market: 'ETH > $4K by Feb',
      amount: 890,
      price: 0.78,
      revenueRate: 18.5,
      profitLoss: 164.65,
    },
    media: {
      images: [],
      videos: [],
      links: [],
    },
    engagement: {
      likes: 412,
      retweets: 78,
      replies: 34,
    },
  },
  {
    id: '4',
    tweetId: '1746876543210987654',
    content: '🟢 Accumulating "AI reaches AGI by 2027" position. Current odds at 0.23 seem underpriced given recent breakthroughs. This is a long-term hold.',
    author: {
      handle: '@ioiiobet',
      name: 'ioiio.bet',
      avatar: '/images/logoicon.jpg',
    },
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    tradeData: {
      action: 'BUY',
      market: 'AGI by 2027',
      amount: 2300,
      price: 0.23,
      revenueRate: 0,
      profitLoss: 0,
    },
    media: {
      images: [],
      videos: [],
      links: ['https://polymarket.com/event/agi-2027'],
    },
    engagement: {
      likes: 891,
      retweets: 203,
      replies: 127,
    },
  },
  {
    id: '5',
    tweetId: '1746765432109876543',
    content: '🧠 ANALYSIS: Why I\'m bullish on prediction markets in 2026. Thread 🧵\n\n1/ Polymarket hit $10B in trading volume last year\n2/ Institutional money is entering the space\n3/ Better price discovery than traditional polls\n\nFull report: [link]',
    author: {
      handle: '@ioiiobet',
      name: 'ioiio.bet',
      avatar: '/images/logoicon.jpg',
    },
    publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    tradeData: {
      action: 'ANALYSIS',
      market: 'Prediction Markets',
    },
    media: {
      images: [],
      videos: [],
      links: ['https://ioiio.bet/analysis/prediction-markets-2026'],
    },
    engagement: {
      likes: 1243,
      retweets: 456,
      replies: 89,
    },
  },
  {
    id: '6',
    tweetId: '1746654321098765432',
    content: '🟢 New position: "Bitcoin ETF inflows > $5B in Jan". Current price: 0.58. High conviction play based on institutional demand trends.',
    author: {
      handle: '@ioiiobet',
      name: 'ioiio.bet',
      avatar: '/images/logoicon.jpg',
    },
    publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    tradeData: {
      action: 'BUY',
      market: 'BTC ETF Inflows > $5B',
      amount: 1800,
      price: 0.58,
      revenueRate: 0,
      profitLoss: 0,
    },
    media: {
      images: [],
      videos: [],
      links: [],
    },
    engagement: {
      likes: 345,
      retweets: 67,
      replies: 23,
    },
  },
  {
    id: '7',
    tweetId: '1746543210987654321',
    content: '🔴 Cutting losses on "Fed rate cut in March" position. Down -8.2%. FOMC signals suggest no cut until Q2. Risk management > being right.',
    author: {
      handle: '@ioiiobet',
      name: 'ioiio.bet',
      avatar: '/images/logoicon.jpg',
    },
    publishedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
    tradeData: {
      action: 'SELL',
      market: 'Fed Rate Cut March',
      amount: 450,
      price: 0.34,
      revenueRate: -8.2,
      profitLoss: -36.9,
    },
    media: {
      images: [],
      videos: [],
      links: [],
    },
    engagement: {
      likes: 178,
      retweets: 34,
      replies: 12,
    },
  },
  {
    id: '8',
    tweetId: '1746432109876543210',
    content: '📈 Position update: "S&P 500 new ATH in Jan" now at +12.1% gain. Price moved from 0.45 to 0.89. Holding until resolution or 0.95.',
    author: {
      handle: '@ioiiobet',
      name: 'ioiio.bet',
      avatar: '/images/logoicon.jpg',
    },
    publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    tradeData: {
      action: 'UPDATE',
      market: 'S&P500 ATH Jan',
      amount: 2100,
      price: 0.89,
      revenueRate: 12.1,
      profitLoss: 254.1,
    },
    media: {
      images: [],
      videos: [],
      links: [],
    },
    engagement: {
      likes: 289,
      retweets: 56,
      replies: 19,
    },
  },
  {
    id: '9',
    tweetId: '1746321098765432109',
    content: '🟢 Contrarian play: "Tesla stock below $200 by March". Market overvalued IMO. Small position at 0.18 odds. High risk, high reward.',
    author: {
      handle: '@ioiiobet',
      name: 'ioiio.bet',
      avatar: '/images/logoicon.jpg',
    },
    publishedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
    tradeData: {
      action: 'BUY',
      market: 'TSLA < $200 by March',
      amount: 500,
      price: 0.18,
      revenueRate: 0,
      profitLoss: 0,
    },
    media: {
      images: [],
      videos: [],
      links: [],
    },
    engagement: {
      likes: 456,
      retweets: 89,
      replies: 67,
    },
  },
  {
    id: '10',
    tweetId: '1746210987654321098',
    content: '📊 Monthly P&L Report:\n• Total Return: +34.7%\n• Win Rate: 68%\n• Best Trade: Trump 2024 (+34.2%)\n• Worst Trade: Fed Rate Cut (-8.2%)\n• Current Positions: 12\n\nConsistent execution beats perfect prediction.',
    author: {
      handle: '@ioiiobet',
      name: 'ioiio.bet',
      avatar: '/images/logoicon.jpg',
    },
    publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    tradeData: {
      action: 'UPDATE',
      market: 'Portfolio',
      revenueRate: 34.7,
      profitLoss: 5849.5,
    },
    media: {
      images: [],
      videos: [],
      links: [],
    },
    engagement: {
      likes: 1567,
      retweets: 345,
      replies: 123,
    },
  },
  {
    id: '11',
    tweetId: '1746109876543210987',
    content: '🔴 Profit-taking on "Trump 2024 Election" position. Sold 40% at +34.2%. Letting the rest ride. Never go broke taking profits.',
    author: {
      handle: '@ioiiobet',
      name: 'ioiio.bet',
      avatar: '/images/logoicon.jpg',
    },
    publishedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days ago
    tradeData: {
      action: 'SELL',
      market: 'Trump 2024',
      amount: 1600,
      price: 0.71,
      revenueRate: 34.2,
      profitLoss: 547.2,
    },
    media: {
      images: [],
      videos: [],
      links: [],
    },
    engagement: {
      likes: 892,
      retweets: 234,
      replies: 156,
    },
  },
  {
    id: '12',
    tweetId: '1745998765432109876',
    content: '🟢 Opening leveraged position on "Bitcoin > $110K by April". 3x leverage at 0.34 odds. This is moon or bust territory. Risk: 5% of portfolio.',
    author: {
      handle: '@ioiiobet',
      name: 'ioiio.bet',
      avatar: '/images/logoicon.jpg',
    },
    publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
    tradeData: {
      action: 'BUY',
      market: 'BTC > $110K by April',
      amount: 3400,
      price: 0.34,
      revenueRate: 0,
      profitLoss: 0,
    },
    media: {
      images: [],
      videos: [],
      links: ['https://polymarket.com/event/bitcoin-110k-april'],
    },
    engagement: {
      likes: 678,
      retweets: 145,
      replies: 89,
    },
  },
];

/**
 * Generate mock revenue data for chart visualization
 */
export const generateMockRevenueData = () => {
  const data = [];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  let cumulativeRevenue = 0;

  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    // Simulate revenue fluctuations
    const dailyChange = (Math.random() - 0.3) * 5; // -1.5% to +3.5% daily
    cumulativeRevenue += dailyChange;

    data.push({
      date: date.toISOString().split('T')[0],
      revenue: parseFloat(cumulativeRevenue.toFixed(2)),
      trades: Math.floor(Math.random() * 3) + (i % 7 === 0 ? 1 : 0), // More trades on certain days
    });
  }

  return data;
};
