'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PredictionMarket, Category, PredictionStatus } from '@/types';
import { CATEGORY_LABELS, STATUS_LABELS } from '@/constants';
import { PredictionCard } from '@/components/PredictionCard';
import { StatCard } from '@/components/StatCard';
import { ChevronDown, SlidersHorizontal, CheckCircle2, Zap, ChevronRight, ArrowRight, TrendingUp, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Brush } from 'recharts';
import { useLightCard } from '@/hooks/useLightCard';

interface HomeClientProps {
  initialMarkets: PredictionMarket[];
}

export default function HomeClient({ initialMarkets }: HomeClientProps) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<Category | 'ALL'>('ALL');
  const [activeStatus, setActiveStatus] = useState<PredictionStatus | 'ALL'>('ALL');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'hourly' | 'daily'>('hourly');
  const [brushStartIndex, setBrushStartIndex] = useState<number>(0);
  const [brushEndIndex, setBrushEndIndex] = useState<number>(0);
  const [profitDataFromAPI, setProfitDataFromAPI] = useState<any[]>([]);
  const [isLoadingProfitData, setIsLoadingProfitData] = useState(true);
  const [marketTitles, setMarketTitles] = useState<string[]>([]);
  const [totalReturn, setTotalReturn] = useState<number>(0);
  const mouseFollowRef = useRef<HTMLDivElement>(null);
  const ribbonTriggerRef = useRef<HTMLSpanElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  
  // Verified Logic Results 卡片的橙黄色光效（增强可见度）
  const { cardRef: verifiedCardRef } = useLightCard({
    light: {
      color: 'rgba(255, 179, 71, 0.4)',
      width: 100,
      height: 100,
      blur: 60
    }
  });

  const handleMarketClick = (id: string) => {
    router.push(`/market/${id}`);
  };

  // 检测移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 调试信息
  useEffect(() => {
    console.log('[HomeClient] 接收到市场数据:', initialMarkets.length, '个市场');
    if (initialMarkets.length > 0) {
      console.log('[HomeClient] 第一个市场:', initialMarkets[0]?.title);
    }
  }, [initialMarkets]);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    };

    if (isStatusDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isStatusDropdownOpen]);

  // Confetti effect for Verified Success tag
  const createConfetti = () => {
    if (!ribbonTriggerRef.current) return;
    
    const trigger = ribbonTriggerRef.current;
    const colors = ['#ff6b6b', '#ffd93d', '#6bcf7f', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#fab1a0', '#6b9fff', '#a29bfe', '#74b9ff', '#55efc4', '#00b894', '#81ecec', '#0984e3', '#6c5ce7'];
    
    // Create confetti pieces around the border (16 pieces)
    const positions = [
      // Top edge
      { x: 0, y: 0, angle: -45 },
      { x: 25, y: 0, angle: -30 },
      { x: 50, y: 0, angle: 0 },
      { x: 75, y: 0, angle: 30 },
      { x: 100, y: 0, angle: 45 },
      // Right edge
      { x: 100, y: 25, angle: 60 },
      { x: 100, y: 50, angle: 90 },
      { x: 100, y: 75, angle: 120 },
      { x: 100, y: 100, angle: 135 },
      // Bottom edge
      { x: 75, y: 100, angle: 150 },
      { x: 50, y: 100, angle: 180 },
      { x: 25, y: 100, angle: 210 },
      { x: 0, y: 100, angle: 225 },
      // Left edge
      { x: 0, y: 75, angle: 240 },
      { x: 0, y: 50, angle: 270 },
      { x: 0, y: 25, angle: 300 },
    ];
    
    positions.forEach((pos, index) => {
      const confetti = document.createElement('div');
      confetti.className = 'confetti-piece';
      confetti.style.backgroundColor = colors[index % colors.length];
      confetti.style.left = `${pos.x}%`;
      confetti.style.top = `${pos.y}%`;
      
      // Calculate random direction based on angle
      const angle = (pos.angle + (Math.random() - 0.5) * 30) * (Math.PI / 180);
      const distance = 60 + Math.random() * 40;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      
      confetti.style.setProperty('--confetti-x', `${x}px`);
      confetti.style.setProperty('--confetti-y', `${y}px`);
      confetti.style.animationDelay = `${index * 0.05}s`;
      
      trigger.appendChild(confetti);
      
      setTimeout(() => {
        confetti.classList.add('active');
      }, 10);
      
      setTimeout(() => {
        confetti.remove();
      }, 2100);
    });
  };

  useEffect(() => {
    // 只在桌面端启用confetti效果
    if (isMobile) return;
    
    const container = verifiedCardRef.current;
    if (!container || !ribbonTriggerRef.current) return;
    
    const handleMouseEnter = () => {
      createConfetti();
    };
    
    container.addEventListener('mouseenter', handleMouseEnter);
    
    return () => {
      container.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [verifiedCardRef, isMobile]);

  // 鼠标跟随背景效果（带滞后平滑 Lerp 动画）- 仅在桌面端
  useEffect(() => {
    if (isMobile) return;
    
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (mouseFollowRef.current) {
        mouseFollowRef.current.style.opacity = '1';
      }
    };

    const animate = () => {
      // Lerp 插值，0.15 的系数提供平滑滞后效果
      const lerpFactor = 0.15;
      currentX += (targetX - currentX) * lerpFactor;
      currentY += (targetY - currentY) * lerpFactor;

      if (mouseFollowRef.current) {
        mouseFollowRef.current.style.left = `${currentX}px`;
        mouseFollowRef.current.style.top = `${currentY}px`;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    const handleMouseLeave = () => {
      if (mouseFollowRef.current) {
        mouseFollowRef.current.style.opacity = '0';
      }
    };

    // 初始化位置
    if (mouseFollowRef.current) {
      const rect = mouseFollowRef.current.getBoundingClientRect();
      currentX = window.innerWidth / 2;
      currentY = window.innerHeight / 2;
      targetX = currentX;
      targetY = currentY;
    }

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isMobile]);

  const filteredMarkets = useMemo(() => {
    return initialMarkets.filter(m => {
      const catMatch = activeCategory === 'ALL' || m.category === activeCategory;
      const statusMatch = activeStatus === 'ALL' || m.status === activeStatus;
      return catMatch && statusMatch;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [initialMarkets, activeCategory, activeStatus]);

  const stats = {
    active: initialMarkets.length,
    success: initialMarkets.filter(m => m.status === PredictionStatus.SUCCESSFUL).length,
    precision: Math.round((initialMarkets.filter(m => m.status === PredictionStatus.SUCCESSFUL).length /
               (initialMarkets.filter(m => m.status === PredictionStatus.SUCCESSFUL || m.status === PredictionStatus.FAILED).length || 1)) * 100)
  };

  const successfulMarkets = initialMarkets.filter(m => m.status === PredictionStatus.SUCCESSFUL);

  // 从 API 获取真实的历史收益数据
  useEffect(() => {
    const fetchProfitData = async () => {
      try {
        setIsLoadingProfitData(true);
        const response = await fetch('/api/positions/history?limit=6');
        if (!response.ok) throw new Error('Failed to fetch profit data');

        const data = await response.json();

        // 保存市场标题（智能截断：前2个单词 + ... + 后2个单词）
        const titles = (data.markets || []).map((m: any) => {
          const title = m.title || '';
          const words = title.split(/\s+/);

          if (words.length <= 6) {
            // 单词数不多，直接返回
            return title;
          }

          // 前2个单词 + ... + 后2个单词
          const first = words.slice(0, 2).join(' ');
          const last = words.slice(-2).join(' ');
          return `${first}...${last}`;
        });
        setMarketTitles(titles);

        // 计算总收益率：所有市场最新收益率的平均值
        const markets = data.markets || [];
        if (markets.length > 0) {
          const totalPnl = markets.reduce((sum: number, market: any) => {
            const latestSnapshot = market.snapshots[market.snapshots.length - 1];
            return sum + (latestSnapshot?.percentRealizedPnl || 0);
          }, 0);
          const avgReturn = totalPnl / markets.length;
          setTotalReturn(Math.round(avgReturn * 10) / 10);
        } else {
          setTotalReturn(0);
        }

        // 转换 API 数据为图表格式
        console.log('[fetchProfitData] API 返回的数据:', data);
        console.log('[fetchProfitData] markets 数量:', data.markets?.length || 0);
        const convertedData = convertAPIDataToChartFormat(data);
        console.log('[fetchProfitData] 转换后的图表数据长度:', convertedData.length);
        setProfitDataFromAPI(convertedData);
      } catch (error) {
        console.error('获取收益历史数据失败:', error);
        // 如果获取失败，使用空数据
        setProfitDataFromAPI([]);
        setMarketTitles([]);
      } finally {
        setIsLoadingProfitData(false);
      }
    };

    fetchProfitData();
  }, []);

  // 将 API 返回的数据转换为图表所需格式
  const convertAPIDataToChartFormat = (apiData: any) => {
    const { markets } = apiData;

    console.log('[convertAPIDataToChartFormat] 输入数据:', apiData);
    
    if (!markets || markets.length === 0) {
      console.warn('[convertAPIDataToChartFormat] 没有市场数据');
      return [];
    }

    console.log('[convertAPIDataToChartFormat] 市场数量:', markets.length);

    // 收集所有时间戳
    const allTimestamps = new Set<string>();
    markets.forEach((market: any) => {
      market.snapshots.forEach((snapshot: any) => {
        allTimestamps.add(snapshot.timestamp);
      });
    });

    // 按时间排序
    const sortedTimestamps = Array.from(allTimestamps).sort();

    // 为每个时间点创建数据
    const chartData = sortedTimestamps.map(timestamp => {
      const date = new Date(timestamp);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hour = date.getHours();

      const dataPoint: any = {
          dateTime: `${month}/${day} ${hour.toString().padStart(2, '0')}:00`,
          date: `${month}/${day}`,
          hour: hour,
        dateFull: date,
      };

      // 为每个市场添加对应时间点的数据
      let dailyTotal = 0;
      markets.forEach((market: any, index: number) => {
        const snapshot = market.snapshots.find((s: any) => s.timestamp === timestamp);
        const value = snapshot ? snapshot.percentRealizedPnl : 0;
        dataPoint[`bet${index + 1}`] = Math.round(value * 10) / 10;
        dailyTotal += value;
      });

      dataPoint.dailyTotal = Math.round(dailyTotal * 10) / 10;

      return dataPoint;
    });

    // 计算累计收益
    let cumulative = 0;
    chartData.forEach((point: any) => {
      cumulative += point.dailyTotal;
      point.cumulativeTotal = Math.round(cumulative * 10) / 10;
    });

    return chartData;
  };

  // 直接使用 API 数据，不使用 mock 数据
  const allProfitData = profitDataFromAPI;
  
  // 根据视图模式过滤数据（用于 Brush 显示所有可选数据）
  const allFilteredData = useMemo(() => {
    if (viewMode === 'daily') {
      // 只显示每天最后一个小时的数据点（即每天结束时的值）
      return allProfitData.filter((item, index) => {
        return (index + 1) % 24 === 0 || index === allProfitData.length - 1;
      });
    }
    return allProfitData;
  }, [viewMode, allProfitData]);

  // 初始化 Brush 的结束索引
  useEffect(() => {
    if (allFilteredData.length > 0) {
      const initialEndIndex = viewMode === 'hourly' 
        ? Math.min(47, allFilteredData.length - 1) // 显示前2天的数据
        : Math.min(6, allFilteredData.length - 1); // 显示前7天的数据
      setBrushStartIndex(0);
      setBrushEndIndex(initialEndIndex);
    }
  }, [allFilteredData.length, viewMode]);

  // 根据 Brush 选择过滤显示的数据
  const profitData = useMemo(() => {
    if (brushStartIndex >= 0 && brushEndIndex >= brushStartIndex && brushEndIndex < allFilteredData.length) {
      return allFilteredData.slice(brushStartIndex, brushEndIndex + 1);
    }
    return allFilteredData;
  }, [allFilteredData, brushStartIndex, brushEndIndex]);

  // 移动端专用布局
  if (isMobile) {
    return (
      <div className="w-full px-4 pb-32 relative">
        {/* Hero Section - 移动端优化 */}
        <section className="pt-20 pb-12 text-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-white/60 text-[9px] font-bold uppercase tracking-[0.2em]">
              AI Predictive Infrastructure 
            </div>

            <div>
              <h1 className="text-4xl font-black tracking-tighter leading-[0.95]">
                <span className="text-white">Intelligence</span>
                <br />
                <span className="bg-gradient-to-t from-gray-500 to-white bg-clip-text text-transparent">Beyond Guess.</span>
              </h1>
            </div>

            <p className="font-gothic text-muted text-sm max-w-sm mx-auto font-medium leading-relaxed">
              An experiment in using prediction to understand how intelligence meets uncertainty.
            </p>
          </div>
        </section>

        {/* Stats Section - 移动端垂直堆叠 */}
        <div className="space-y-3 mb-8">
          <StatCard label="Active Nodes" value={stats.active} />
          <StatCard label="Successful" value={stats.success} />
          <StatCard label="Precision" value={stats.precision + '%'} />
        </div>

        {/* Profits Visualization - 移动端简化 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                <TrendingUp className="text-primary w-3 h-3" />
              </div>
              <h2 className="text-base font-bold">Profit Analytics</h2>
            </div>
            {marketTitles.length > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${totalReturn > 0 ? 'bg-primary' : 'bg-red-500'}`}></div>
                <span className="text-[10px] text-white font-medium">
                  {totalReturn > 0 ? '+' : ''}{totalReturn}%
                </span>
              </div>
            )}
          </div>

          <div className="glass-panel p-3 rounded-xl">
            <div className="mb-3">
              <h3 className="text-sm font-bold text-white mb-1">Daily Performance</h3>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => setViewMode('hourly')}
                  className={`flex-1 py-2 rounded text-[9px] font-bold uppercase transition-all ${
                    viewMode === 'hourly'
                      ? 'bg-primary text-black'
                      : 'bg-white/5 text-white/60'
                  }`}
                >
                  Hourly
                </button>
                <button
                  onClick={() => setViewMode('daily')}
                  className={`flex-1 py-2 rounded text-[9px] font-bold uppercase transition-all ${
                    viewMode === 'daily'
                      ? 'bg-primary text-black'
                      : 'bg-white/5 text-white/60'
                  }`}
                >
                  Daily
                </button>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={profitData}
                  margin={{ top: 5, right: 10, left: -20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey={viewMode === 'hourly' ? 'dateTime' : 'date'} 
                    stroke="#666" 
                    tick={{ fontSize: 8, fill: '#666' }}
                    interval={viewMode === 'hourly' ? 23 : 0}
                    angle={viewMode === 'hourly' ? -45 : 0}
                    textAnchor={viewMode === 'hourly' ? 'end' : 'middle'}
                    height={40}
                  />
                  <YAxis stroke="#666" tick={{ fontSize: 9 }} width={40} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.4)',
                      borderRadius: '6px',
                      padding: '6px',
                    }}
                    itemStyle={{ color: '#fff', fontSize: '10px' }}
                    labelStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                  />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
                  {marketTitles.slice(0, 3).map((title, index) => {
                    const colors = ['#FF4444', '#82ca9d', '#ffc658'];
                    const color = colors[index % colors.length];
                    return (
                      <Line 
                        key={`bet${index + 1}`}
                        type="monotone" 
                        dataKey={`bet${index + 1}`}
                        stroke={color}
                        dot={false}
                        strokeWidth={1.5}
                        name={title.length > 15 ? title.substring(0, 15) + '...' : title}
                      />
                    );
                  })}
                  <Line 
                    type="monotone" 
                    dataKey="dailyTotal" 
                    stroke="#4CAF50" 
                    strokeWidth={2}
                    dot={false}
                    name="Daily Total"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Filter Button - 移动端底部固定 */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-t border-white/10 p-4">
          <button
            onClick={() => setIsFilterDrawerOpen(true)}
            className="w-full flex items-center justify-between glass-panel bg-white/5 border border-white/10 px-4 py-3 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-white" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                {activeCategory !== 'ALL' && CATEGORY_LABELS[activeCategory]}
                {activeCategory !== 'ALL' && activeStatus !== 'ALL' && ' • '}
                {activeStatus !== 'ALL' && STATUS_LABELS[activeStatus as PredictionStatus]}
                {(activeCategory === 'ALL' && activeStatus === 'ALL') && 'Filters'}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* Filter Drawer - 移动端全屏抽屉 */}
        {isFilterDrawerOpen && (
          <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h3 className="text-lg font-bold">Filters</h3>
                <button
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="text-white/60 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white/60 mb-3">Category</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setActiveCategory('ALL');
                        setIsFilterDrawerOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        activeCategory === 'ALL'
                          ? 'bg-white text-black'
                          : 'bg-white/5 text-white/80'
                      }`}
                    >
                      All Segments
                    </button>
                    {Array.from(new Set(initialMarkets.map(m => m.category))).map((category) => (
                      <button
                        key={category}
                        onClick={() => {
                          setActiveCategory(category);
                          setIsFilterDrawerOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                          activeCategory === category
                            ? 'bg-white text-black'
                            : 'bg-white/5 text-white/80'
                        }`}
                      >
                        {CATEGORY_LABELS[category]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white/60 mb-3">Status</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setActiveStatus('ALL');
                        setIsFilterDrawerOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        activeStatus === 'ALL'
                          ? 'bg-white text-black'
                          : 'bg-white/5 text-white/80'
                      }`}
                    >
                      All Status
                    </button>
                    <button
                      onClick={() => {
                        setActiveStatus(PredictionStatus.ACTIVE);
                        setIsFilterDrawerOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        activeStatus === PredictionStatus.ACTIVE
                          ? 'bg-white text-black'
                          : 'bg-white/5 text-white/80'
                      }`}
                    >
                      {STATUS_LABELS[PredictionStatus.ACTIVE]}
                    </button>
                    <button
                      onClick={() => {
                        setActiveStatus(PredictionStatus.SUCCESSFUL);
                        setIsFilterDrawerOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        activeStatus === PredictionStatus.SUCCESSFUL
                          ? 'bg-white text-black'
                          : 'bg-white/5 text-white/80'
                      }`}
                    >
                      {STATUS_LABELS[PredictionStatus.SUCCESSFUL]}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-white/10">
                <button
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="w-full bg-white text-black py-3 rounded-lg font-bold uppercase text-sm tracking-wider"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Market Grid - 移动端单列 */}
        <div className="space-y-4 mb-24">
          {filteredMarkets.length > 0 ? (
            filteredMarkets.map((market, index) => {
              const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
              const labelIndex = labels[index % labels.length];
              return (
                <PredictionCard 
                  key={market.id} 
                  market={market} 
                  onClick={handleMarketClick}
                  marketLabel={labelIndex}
                />
              );
            })
          ) : (
            <div className="py-24 text-center">
              <p className="text-muted font-bold tracking-widest uppercase text-xs">Zero results in this query vector.</p>
            </div>
          )}
        </div>

        {/* Featured Analysis - 移动端简化 */}
        <div className="mt-16 mb-24">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
              <CheckCircle2 className="text-primary w-3 h-3" />
            </div>
            <h2 className="text-base font-bold">Featured Analysis</h2>
          </div>

          <div ref={verifiedCardRef} className="glass-panel rounded-xl p-4">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border border-white/20 bg-white/5 text-white">
                Politics
              </span>
              <span ref={ribbonTriggerRef} className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border border-primary/30 bg-primary/5 text-primary">
                Featured
              </span>
            </div>

            <h3 className="text-base font-bold text-white leading-tight mb-2">
              Who will be the next Federal Reserve Chair?
            </h3>

            <p className="text-xs text-white/70 mb-4 line-clamp-3">
              Comprehensive competitive analysis across five dimensions evaluating the nomination probability and market impact of three candidates.
            </p>

            <div className="bg-white/[0.03] rounded-lg p-3 border border-white/10 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-3 h-3 text-primary" />
                <div className="text-xs font-black text-primary">Atypica Pick</div>
              </div>
              <div className="text-lg font-black text-primary mb-2">Kevin Hassett</div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50">Confidence</span>
                <div className="flex gap-1">
                  <div className="w-4 h-0.5 bg-primary rounded-sm"></div>
                  <div className="w-4 h-0.5 bg-primary rounded-sm"></div>
                  <div className="w-4 h-0.5 bg-white rounded-sm"></div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded bg-primary/10 border border-primary/20">
                <span className="text-xs font-black text-primary">Kevin Hassett</span>
                <span className="text-xs font-bold text-white">37%</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-white/5">
                <span className="text-xs text-white">Christopher Waller</span>
                <span className="text-xs font-bold text-white">12%</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-white/5">
                <span className="text-xs text-white">Kevin Warsh</span>
                <span className="text-xs font-bold text-white">42%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 桌面端布局（保持原有设计）
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 pb-40 relative">
      {/* 鼠标跟随背景光晕 */}
      <div
        ref={mouseFollowRef}
        className="mouse-follow-bg"
        style={{ left: '50%', top: '50%' }}
      />
      {/* Hero Section */}
      <section className="pt-32 pb-24 text-center relative z-50 overflow-x-visible">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-white/60 text-[10px] font-bold uppercase tracking-[0.2em]">
             AI Predictive Infrastructure 
          </div>

          <div className="relative z-50 overflow-visible">
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.95] relative z-50 overflow-visible">
              <span className="text-white relative z-50">Intelligence</span>
              <br />
              <span className="bg-gradient-to-t from-gray-500 to-white bg-clip-text text-transparent relative z-50 inline-block pr-2">Beyond Guess.</span>
            </h1>
          </div>

          <p className="font-gothic text-muted text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed mt-12">
            An experiment in using prediction to understand how intelligence meets uncertainty.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24 max-w-5xl mx-auto">
        <StatCard label="Active Matrix Nodes" value={stats.active} />
        <StatCard label="Successful Resolves" value={stats.success} />
        <StatCard label="Model Precision" value={stats.precision + '%'} />
      </div>

      {/* Profits Visualization */}
      <div className="mb-24">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
              <TrendingUp className="text-primary w-3.5 h-3.5" />
            </div>
            <h2 className="text-lg font-bold tracking-tight">Profit Analytics</h2>
          </div>
          <button className="flex items-center gap-1 text-[10px] font-bold text-muted uppercase tracking-widest hover:text-white hidden">
            View All Data <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="glass-panel p-4 rounded-xl card-layer-2">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-white mb-0.5">Daily Bet Performance</h3>
              <p className="text-xs text-white/60 font-gothic">
                Individual bet performance tracked over time with daily and cumulative profit indicators
              </p>
            </div>
            <div className="flex items-center gap-3">
            {marketTitles.length > 0 && (
            <div className="flex items-center gap-1.5 p-2 bg-white/5 rounded-lg">
                <div className={`w-3 h-3 rounded-full ${totalReturn > 0 ? 'bg-primary' : 'bg-red-500'}`}></div>
                <span className="text-xs text-white font-medium">
                  {totalReturn > 0 ? '+' : ''}{totalReturn}% Total Return
                </span>
              </div>
            )}
              <div className="flex items-center gap-1.5 p-1.5 bg-white/5 rounded-lg border border-white/10">
                <button
                  onClick={() => setViewMode('hourly')}
                  className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${
                    viewMode === 'hourly'
                      ? 'bg-primary text-black'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Hourly
                </button>
                <button
                  onClick={() => setViewMode('daily')}
                  className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${
                    viewMode === 'daily'
                      ? 'bg-primary text-black'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Daily
                </button>
              </div>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={profitData}
                margin={{
                  top: 5,
                  right: 20,
                  left: 0,
                  bottom: 100,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey={viewMode === 'hourly' ? 'dateTime' : 'date'} 
                  stroke="#666" 
                  tick={{ fontSize: 9, fill: '#666' }}
                  interval={viewMode === 'hourly' ? 23 : 0} // 按小时模式时每24个显示一个，按天模式时全部显示
                  label={{ value: viewMode === 'hourly' ? 'Date & Time' : 'Date', position: 'insideBottom', offset: -55, fill: '#666', style: { fontSize: '10px' } }}
                  angle={viewMode === 'hourly' ? -45 : 0}
                  textAnchor={viewMode === 'hourly' ? 'end' : 'middle'}
                  height={40}
                />
                <YAxis stroke="#666" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    borderRadius: '6px',
                    padding: '8px',
                  }}
                  itemStyle={{ color: '#fff', fontSize: '11px' }}
                  labelStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}
                  cursor={{ stroke: 'rgba(255,255,255,0.5)', strokeWidth: 2, strokeDasharray: '3 3' }}
                  formatter={(value: any) => value}
                  labelFormatter={(label: string, payload: readonly any[]) => {
                    if (payload && payload[0] && payload[0].payload && payload[0].payload.dateTime) {
                      return `Time: ${payload[0].payload.dateTime}`;
                    }
                    return `Date: ${label}`;
                  }}
                />
                <Legend verticalAlign="top" height={20} wrapperStyle={{ fontSize: '10px', paddingBottom: '5px' }} />
                <defs>
                  <linearGradient id="cumulativeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#9D4EDD" stopOpacity={1} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
                {/* 动态生成市场线条 */}
                {marketTitles.map((title, index) => {
                  const colors = ['#FF4444', '#82ca9d', '#ffc658', '#8884d8', '#ff7c43', '#a28dff'];
                  const color = colors[index % colors.length];
                  return (
                <Line 
                      key={`bet${index + 1}`}
                  type="monotone" 
                      dataKey={`bet${index + 1}`}
                      stroke={color}
                  dot={false}
                      activeDot={{ r: 6, fill: color, stroke: '#fff', strokeWidth: 2 }}
                      name={title}
                  strokeWidth={1.5}
                />
                  );
                })}
                <Line 
                  type="monotone" 
                  dataKey="dailyTotal" 
                  stroke="#4CAF50" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 7, fill: '#4CAF50', stroke: '#fff', strokeWidth: 2 }}
                  name="Daily Total"
                />
                {/* 暂时隐藏累积收益线 */}
                {/* <Line
                  type="monotone" 
                  dataKey="cumulativeTotal" 
                  stroke="url(#cumulativeGradient)" 
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 8, fill: '#7C3AED', stroke: '#fff', strokeWidth: 2 }}
                  name="Cumulative Profit"
                /> */}
                <Brush
                  data={allFilteredData}
                  dataKey={viewMode === 'hourly' ? 'dateTime' : 'date'}
                  height={30}
                  stroke="rgba(255,255,255,0.2)"
                  fill="rgba(255,255,255,0.05)"
                  startIndex={brushStartIndex}
                  endIndex={brushEndIndex}
                  onChange={(newStartIndex: number, newEndIndex: number) => {
                    if (typeof newStartIndex === 'number' && typeof newEndIndex === 'number') {
                      const maxIndex = allFilteredData.length - 1;
                      const validStart = Math.max(0, Math.min(newStartIndex, maxIndex));
                      const validEnd = Math.max(validStart, Math.min(newEndIndex, maxIndex));
                      setBrushStartIndex(validStart);
                      setBrushEndIndex(validEnd);
                    }
                  }}
                  tickFormatter={(value) => {
                    if (viewMode === 'hourly') {
                      if (typeof value === 'string') {
                        const parts = value.split(' ');
                        if (parts.length > 0) {
                          return parts[0];
                        }
                      }
                      return value;
                    }
                    return value;
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-xs text-white/80 font-gothic">
                Each line represents a separate prediction market position. The daily total shows aggregate profit/loss
                per day across all positions. All predictions use the Atypica AI predictive engine with a consistent betting strategy.
                This chart's predictions are based on equal investment amounts across all options.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Market Controls */}
      <div id="market-grid" className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-12 py-3 border-y border-white/5">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveCategory('ALL')}
            className={`px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${activeCategory === 'ALL' ? 'bg-white text-black' : 'text-muted hover:text-white'}`}
          >
            All Segments
          </button>
          {(() => {
            // 从当前 board 中获取所有唯一的 category
            const availableCategories = Array.from(new Set(initialMarkets.map(m => m.category)));
            return availableCategories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeCategory === category ? 'bg-white text-black' : 'text-muted hover:text-white'}`}
              >
                {CATEGORY_LABELS[category]}
              </button>
            ));
          })()}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative" ref={statusDropdownRef}>
            <button
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className="flex items-center gap-2 glass-panel bg-white/5 border border-white/10 px-4 py-2 pr-3 rounded-lg text-[11px] font-bold uppercase tracking-widest text-muted hover:text-white hover:bg-white/10 hover:border-white/15 outline-none cursor-pointer transition-all"
            >
              <span>{activeStatus === 'ALL' ? 'All Status' : STATUS_LABELS[activeStatus as PredictionStatus]}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isStatusDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 min-w-full glass-panel bg-white/5 border border-white/10 rounded-lg overflow-hidden shadow-xl backdrop-blur-md z-50">
                <button
                  onClick={() => {
                    setActiveStatus('ALL');
                    setIsStatusDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-colors ${
                    activeStatus === 'ALL'
                      ? 'bg-white/10 text-white'
                      : 'text-muted hover:bg-white/5 hover:text-white'
                  }`}
                >
                  All Status
                </button>
                <button
                  onClick={() => {
                    setActiveStatus(PredictionStatus.ACTIVE);
                    setIsStatusDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-colors border-t border-white/10 ${
                    activeStatus === PredictionStatus.ACTIVE
                      ? 'bg-white/10 text-white'
                      : 'text-muted hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {STATUS_LABELS[PredictionStatus.ACTIVE]}
                </button>
                <button
                  onClick={() => {
                    setActiveStatus(PredictionStatus.SUCCESSFUL);
                    setIsStatusDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-colors border-t border-white/10 ${
                    activeStatus === PredictionStatus.SUCCESSFUL
                      ? 'bg-white/10 text-white'
                      : 'text-muted hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {STATUS_LABELS[PredictionStatus.SUCCESSFUL]}
                </button>
              </div>
            )}
          </div>
          <div className="w-px h-4 bg-white/10 hidden md:block"></div>
          <button className="text-muted hover:text-white transition-colors">
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Market Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMarkets.length > 0 ? (
          filteredMarkets.map((market, index) => {
            // 生成标签：A, B, C, ..., Z，如果超过26个则循环使用
            const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
            const labelIndex = labels[index % labels.length];
            return (
              <PredictionCard 
                key={market.id} 
                market={market} 
                onClick={handleMarketClick}
                marketLabel={labelIndex}
              />
            );
          })
        ) : (
          <div className="col-span-full py-32 text-center">
            <p className="text-muted font-bold tracking-widest uppercase text-xs">Zero results in this query vector.</p>
          </div>
        )}
      </div>

      {/* Verified Results Section */}
      <div className="mt-32">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
              <CheckCircle2 className="text-primary w-3.5 h-3.5" />
            </div>
            <h2 className="text-lg font-bold tracking-tight">Featured Analysis</h2>
          </div>
          <button className="flex items-center gap-1 text-[10px] font-bold text-muted uppercase tracking-widest hover:text-white hidden">
            Full History <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Mock Verified Logic Results - 详细分析结果 */}
          <div ref={verifiedCardRef} className="group cursor-pointer glass-panel spotlight-card rounded-xl transition-all duration-300 hover:border-white/20 p-6 ribbon-container relative overflow-hidden">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-white/20 bg-white/5 text-white">
                    Politics
                      </span>
                  <span ref={ribbonTriggerRef} className="px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-primary/30 bg-primary/5 text-primary group-hover:text-red-400 group-hover:border-red-400/30 group-hover:bg-red-400/5 transition-colors ribbon-trigger">
                        Featured Case
                      </span>
                    </div>

                <h3 className="text-xl font-bold text-white leading-tight mb-2">
                  Who will be the next Federal Reserve Chair?
                    </h3>

                <p className="text-sm text-white/70 mb-4">
                  Comprehensive competitive analysis across five dimensions—economic philosophy, political alignment, market recognition, central bank operational experience, and policy credibility—evaluating the nomination probability and market impact of three candidates: Kevin Hassett, Kevin Warsh, and Christopher Waller. Analysis conducted January 2026.
                    </p>
                  </div>

                </div>

            {/* 详细分析结果 */}
            <div className="space-y-4 mb-4">
              <div className="bg-white/[0.03] rounded-lg p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-primary" />
                    <div className="text-sm font-black text-primary">Atypica Analysis & Prediction</div>
                  </div>

                  <div className="mb-4">
                  <p className="text-sm text-white/80 italic mb-3">
                    &quot;Through a five-dimensional competitive scoring matrix, integration of market prediction data, and expert simulation interviews, our model indicates Kevin Hassett is most likely to be nominated (70-80% probability). His close relationship with the president and shared focus on economic growth constitute a significant 'political premium,' making him the political first choice. However, this choice carries core risks: Hassett is a staunch dove advocate, has zero monetary policy operational experience, and his independence is questionable. If inflation rekindles, market skepticism about his independence could trigger a 'political-market' negative feedback spiral. In contrast, while Christopher Waller lacks political capital, his data-driven, stable approach has won the highest market recognition, viewed as the 'safe bet' that best provides certainty.&quot;
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-white/50 mb-1">Atypica&apos;s Choice</div>
                    <div className="flex items-end gap-3">
                      <div className="text-2xl font-black text-primary">Kevin Hassett</div>
                      <div className="flex flex-col">
                        <div className="text-xs text-white/70 mb-1">
                          Confidence
                        </div>
                        <div className="flex gap-1.5 items-center">
                          <div className="w-6 h-1 bg-primary rounded-sm"></div>
                          <div className="w-6 h-1 bg-primary rounded-sm"></div>
                          <div className="w-6 h-1 bg-white rounded-sm"></div>
                        </div>
                      </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-white/50 mb-1">Polymarket</div>
                      <div className="text-base font-medium text-white flex items-center gap-2">
                      37%
                    </div>
                  </div>
                </div>
              </div>

              {/* 详细分析部分 */}
              <div className="bg-white/[0.02] rounded-lg p-4 border border-white/5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-white/70 mb-3">Detailed Analysis Breakdown</div>
                
                <div className="space-y-3">
                  <div className="border-l-2 border-primary/30 pl-3">
                    <div className="text-[10px] font-black text-primary mb-1">Competitive Scoring Matrix</div>
                    <ul className="text-xs text-white/70 space-y-1 list-disc list-inside">
                      <li>Kevin Hassett: Political alignment 5/5 (core White House decision-maker), economic philosophy clarity 4/5 (clear dovish stance), but central bank operational experience only 1/5, policy credibility 2/5 (independence questionable)</li>
                      <li>Christopher Waller: Market recognition 5/5 (most trusted &apos;safe bet&apos;), central bank operational experience 5/5 (current board member), policy credibility 5/5 (rule-based transparent approach), but political alignment only 2/5</li>
                      <li>Kevin Warsh: Central bank operational experience 4/5 (board member 2006-2011), but economic philosophy clarity 2/5 (position swing), policy credibility 2/5 (recent shift from hawkish to dovish raises concerns)</li>
                    </ul>
                  </div>

                  <div className="border-l-2 border-primary/30 pl-3">
                    <div className="text-[10px] font-black text-primary mb-1">Scenario Analysis & Risk Pathways</div>
                    <p className="text-xs text-white/70">
                      If Kevin Hassett is nominated: Short-term stock market rises on expected rate cuts, but long-term faces &apos;political-market&apos; negative feedback spiral risk. If inflation rekindles, market skepticism about his independence will trigger dollar and bond sell-offs. If Christopher Waller is nominated: Market views as major positive, expects 6-12 months of policy certainty premium, but must overcome political capital disadvantage. If Kevin Warsh is nominated: Must prioritize resolving credibility issues from policy position swings, otherwise faces policy anchoring failure risk.
                    </p>
                  </div>

                  <div className="border-l-2 border-primary/30 pl-3">
                    <div className="text-[10px] font-black text-primary mb-1">Core Strategic Assessment</div>
                    <p className="text-xs text-white/70">
                      Nomination decision essentially represents a trade-off between &apos;political loyalty&apos; and &apos;policy credibility.&apos; Kevin Hassett maximizes political loyalty but sacrifices policy independence; Christopher Waller maximizes policy credibility but needs to overcome political resistance; Kevin Warsh attempts to balance both but position swings weaken effectiveness. Model shows that in current political environment, Hassett is most likely to be nominated (70-80%) due to political advantages, but Waller, if nominated, would provide the most stable anchor for financial markets. Key insight: Regardless of choice, the real challenge lies in finding a sustainable balance point between political pressure and market expectations.
                    </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white/60">All Prediction Options</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white/60">Result</div>
                </div>

                <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded bg-primary/10 border border-primary/20">
                      <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-primary">
                    Kevin Hassett
                        </span>
                          <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold">
                            Atypica Pick
                          </span>
                      </div>

                      <div className="flex items-center gap-3 text-sm">
                          {/* 隐藏信心指示器（三个短横线） */}
                          {/* <div className="flex items-center gap-1.5">
                            <div className="h-2 w-7 rounded-sm bg-primary" />
                            <div className="h-2 w-7 rounded-sm bg-primary" />
                            <div className="h-2 w-7 rounded-sm bg-white" />
                          </div> */}
                        <div className="flex items-center">
                          <span className="text-[9px] mr-1 text-muted">Market:</span>
                    <span className="text-xs font-bold text-white">37%</span>
                          </div>
                      </div>
                    </div>

              <div className="flex items-center justify-between p-2 rounded bg-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">
                    Christopher Waller
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center">
                    <span className="text-[9px] mr-1 text-muted">Market:</span>
                    <span className="text-xs font-bold text-white">12%</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">
                    Kevin Warsh
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center">
                    <span className="text-[9px] mr-1 text-muted">Market:</span>
                    <span className="text-xs font-bold text-white">42%</span>
                  </div>
                </div>
              </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-white/50">
                      End: Dec 31, 2026
                    </div>
                    <div className="text-xs text-white/50">
                      <span className="font-medium">Vol.:</span>{' '}
                      $155,679,905
                    </div>
                  </div>
                </div>
              </div>

        </div>
      </div>
    </div>
  );
}
