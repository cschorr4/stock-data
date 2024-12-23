import React, { useEffect, useMemo, useRef } from 'react';
import { register } from 'swiper/element/bundle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, PieChart, Clock, Activity, DollarSign } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

interface Position {
  ticker: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  currentValue: number;
  dollarChange: number;
  percentChange: number;
  dayChange: number;
  dayChangePercent: number;
  volume?: number;
  dayHigh?: number;
  dayLow?: number;
  peRatio?: number;
  forwardPE?: number;
  industryPE?: number;
  spyReturn: number;
  buyDate: string;
  lastUpdated: string;
}

interface Props {
  metrics: {
    totalValue: number;
    totalCost: number;
    winRate: number;
    avgWinPercent: number;
    avgLossPercent: number;
    bestPerformer: Position | null;
    worstPerformer: Position | null;
    avgHoldingPeriodWinners: number;
  };
  totals: {
    realizedProfits: number;
    unrealizedProfits: number;
    totalInvestment: number;
    currentValue: number;
    totalReturn: number;
  };
  openPositions: Array<Position>;
  closedPositions: Array<{
    ticker: string;
    buyDate: string;
    sellDate: string;
    profit: number;
    percentChange: number;
    holdingPeriod: number;
  }>;
}

const PortfolioSummary = ({
  metrics,
  totals,
  openPositions,
  closedPositions
}: Props) => {
  const swiperRef = useRef(null);
  
  useEffect(() => {
    register();
    const swiperEl = swiperRef.current as HTMLElement & { 
      initialize: () => void;
    } | null;
    
    if (swiperEl) {
      const params = {
        slidesPerView: 2.5,
        spaceBetween: 16,
        loop: true,
        autoplay: {
          delay: 2000,
          disableOnInteraction: false,
        },
        pagination: {
          clickable: true,
        },
        speed: 1000,
        effect: 'slide',
        grabCursor: true,
      };
      Object.assign(swiperEl, params);
      swiperEl.initialize();
    }
  }, []);

  const calculateHoldingPeriod = (position: Position | { buyDate: string }) => {
    const buyDate = new Date(position.buyDate);
    const today = new Date();
    return Math.floor((today.getTime() - buyDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  const { diversification, avgHoldingPeriod, portfolioStats } = useMemo(() => {
    const totalValue = openPositions.reduce((sum, pos) => sum + (pos.currentValue || 0), 0);
    const diversification = openPositions
      .map(pos => ({
        ticker: pos.ticker,
        percentage: totalValue > 0 ? ((pos.currentValue || 0) / totalValue) * 100 : 0,
        value: pos.currentValue || 0,
        holdingPeriod: calculateHoldingPeriod(pos),
        dayChange: pos.dayChange,
        dayChangePercent: pos.dayChangePercent
      }))
      .sort((a, b) => b.percentage - a.percentage);

    const avgHoldingPeriod = Math.floor(
      openPositions.reduce((sum, pos) => sum + calculateHoldingPeriod(pos), 0) / 
      (openPositions.length || 1)
    );

    const portfolioStats = {
      gainers: openPositions.filter(pos => pos.dayChange > 0).length,
      losers: openPositions.filter(pos => pos.dayChange < 0).length,
      unchanged: openPositions.filter(pos => pos.dayChange === 0).length,
      totalDayChange: openPositions.reduce((sum, pos) => sum + pos.dayChange, 0)
    };

    return { diversification, avgHoldingPeriod, portfolioStats };
  }, [openPositions]);

  const formatCurrency = (value) => {
    if (value == null) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: Math.abs(value) >= 1000000 ? 'compact' : 'standard',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value, decimals = 1) => {
    if (value == null) return '0.0%';
    return `${value.toFixed(decimals)}%`;
  };

  const safeNumber = (value) => value ?? 0;

  return (
    <div className="w-full max-w-6xl mx-auto">
      <swiper-container ref={swiperRef} init="false" class="!pb-0 !mb-0">
        {/* Portfolio Value Card */}
        <swiper-slide>
          <Card className="h-40 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
            <CardHeader className="space-y-0.5 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold">Portfolio Value</CardTitle>
                <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(safeNumber(metrics?.totalValue))}
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Daily Change</span>
                  <span className={cn(
                    "font-medium",
                    portfolioStats.totalDayChange >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {formatCurrency(portfolioStats.totalDayChange)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Total Return</span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    {formatPercentage(safeNumber(totals?.totalReturn))}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </swiper-slide>
        
        {/* Active Positions Card */}
        <swiper-slide>
          <Card className="h-40 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900">
            <CardHeader className="space-y-0.5 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold">Active Positions</CardTitle>
                <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {openPositions.length}
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Gainers</span>
                  <span className="font-medium text-green-600">{portfolioStats.gainers}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Losers</span>
                  <span className="font-medium text-red-600">{portfolioStats.losers}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </swiper-slide>
        
        {/* Performance Card */}
        <swiper-slide>
          <Card className="h-40 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-800 dark:to-gray-900">
            <CardHeader className="space-y-0.5 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold">Performance</CardTitle>
                <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Best Return</span>
                  <span className={cn("font-medium text-green-600")}>
                    {formatPercentage(metrics?.avgWinPercent || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Worst Return</span>
                  <span className={cn("font-medium text-red-600")}>
                    {formatPercentage(metrics?.avgLossPercent || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </swiper-slide>
        
        {/* Hold Time Card */}
        <swiper-slide>
          <Card className="h-40 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-900">
            <CardHeader className="space-y-0.5 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold">Hold Time</CardTitle>
                <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {avgHoldingPeriod} days
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Total Closed</span>
                  <span className="font-medium text-purple-600">{closedPositions.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Win Rate</span>
                  <span className="font-medium text-purple-600">
                    {formatPercentage(metrics?.winRate || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </swiper-slide>
        
        {/* Diversification Card */}
        <swiper-slide>
          <Card className="h-40 bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-gray-800 dark:to-gray-900">
            <CardHeader className="space-y-0.5 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold">Diversification</CardTitle>
                <PieChart className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {diversification.slice(0, 2).map((holding) => (
                  <div key={holding.ticker} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{holding.ticker} Exposure</span>
                    <span className="font-medium text-teal-600">
                      {formatPercentage(holding.percentage)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </swiper-slide>
      </swiper-container>
    </div>
  );
};

export default PortfolioSummary;