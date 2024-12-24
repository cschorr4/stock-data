import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DollarSign, Activity, TrendingUp, Clock, 
  PieChart, Target, Waypoints, BarChart3,
  ArrowUpRight, ArrowDownRight, TrendingDown, Network, AlertTriangle
} from 'lucide-react';

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
  spyReturn?: number;
  buyDate: string;
  lastUpdated: string;
  sector: string;
  industry: string;
  marketCap?: number;
  beta?: number;
}

interface ClosedPosition {
  ticker: string;
  buyDate: string;
  sellDate: string;
  buyPrice: number;
  sellPrice: number;
  shares: number;
  profit: number;
  percentChange: number;
  holdingPeriod: number;
}

export interface SectorMetric {
  name: string;
  allocation: number;
  return: number;
  positions: number;
}

export interface IndustryMetric {
  name: string;
  allocation: number;
  return: number;
  positions: number;
  sector: string;
}

interface PortfolioMetrics {
  totalValue: number;
  totalCost: number;
  winRate: number;
  avgWinPercent: number;
  avgLossPercent: number;
  bestPerformer: Position | null;
  worstPerformer: Position | null;
  avgHoldingPeriodWinners: number;
  portfolioBeta: number;
  maxDrawdown: number;
  sharpeRatio: number;
  cashBalance: number;
  buyingPower: number;
  sectorMetrics: SectorMetric[];
  industryMetrics: IndustryMetric[];
}

interface PortfolioTotals {
  realizedProfits: number;
  unrealizedProfits: number;
  totalInvestment: number;
  currentValue: number;
  totalReturn: number;
}

interface MetricCardProps {
  title: string;
  icon: React.ReactNode;
  mainValue: string | number;
  mainValueColor: string;
  metric1Label: string;
  metric1Value: string | number;
  metric1Color: string;
  metric2Label: string;
  metric2Value: string | number;
  metric2Color: string;
  gradient: string;
}



const MetricCards: React.FC<{
  metrics: PortfolioMetrics,
  totals: PortfolioTotals,
  positions: Position[]
}> = ({ metrics, totals, positions }) => {
  const defaultMetrics = {
    sectorMetrics: [],
    industryMetrics: []
  };
  
  const { topSector = { name: '-', allocation: 0, return: 0, positions: 0 }, 
          topIndustry = { name: '-', allocation: 0, return: 0, positions: 0, sector: '-' } 
  } = calculateTopMetrics(positions, {...metrics, ...defaultMetrics});

  return (
    <>
      <MetricCard
        title="Portfolio Value"
        icon={<DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
        mainValue={formatCurrency(metrics.totalValue)}
        mainValueColor="text-blue-600 dark:text-blue-400"
        metric1Label="Daily P/L"
        metric1Value={formatCurrency(totals.realizedProfits)}
        metric1Color={totals.realizedProfits >= 0 ? 'text-green-600' : 'text-red-600'}
        metric2Label="Total Return"
        metric2Value={formatPercentage(totals.totalReturn)}
        metric2Color={totals.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}
        gradient="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900"
      />

      <MetricCard
        title="Risk Metrics"
        icon={<AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
        mainValue={formatPercentage(metrics.portfolioBeta)}
        mainValueColor="text-amber-600 dark:text-amber-400"
        metric1Label="Max Drawdown"
        metric1Value={formatPercentage(metrics.maxDrawdown)}
        metric1Color="text-red-600"
        metric2Label="Sharpe Ratio"
        metric2Value={metrics.sharpeRatio ? metrics.sharpeRatio.toFixed(2) : 'N/A'}
        metric2Color={metrics.sharpeRatio >= 1.5 ? 'text-green-600' : 'text-gray-600'}
        gradient="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-gray-800 dark:to-gray-900"
      />

      <MetricCard
        title={`Top Sector (${topSector.name})`}
        icon={<PieChart className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
        mainValue={formatPercentage(topSector.allocation)}
        mainValueColor="text-indigo-600 dark:text-indigo-400"
        metric1Label="Return"
        metric1Value={formatPercentage(topSector.return)}
        metric1Color={topSector.return >= 0 ? 'text-green-600' : 'text-red-600'}
        metric2Label="Positions"
        metric2Value={topSector.positions}
        metric2Color="text-gray-600"
        gradient="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-gray-800 dark:to-gray-900"
      />

      <MetricCard
        title={`Top Industry (${topIndustry.name})`}
        icon={<Network className="w-4 h-4 text-violet-600 dark:text-violet-400" />}
        mainValue={formatPercentage(topIndustry.allocation)}
        mainValueColor="text-violet-600 dark:text-violet-400"
        metric1Label="Return"
        metric1Value={formatPercentage(topIndustry.return)}
        metric1Color={topIndustry.return >= 0 ? 'text-green-600' : 'text-red-600'}
        metric2Label="Sector"
        metric2Value={topIndustry.sector}
        metric2Color="text-gray-600"
        gradient="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-gray-800 dark:to-gray-900"
      />

      <MetricCard
        title="Performance"
        icon={<Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
        mainValue={formatPercentage(metrics.winRate)}
        mainValueColor="text-emerald-600 dark:text-emerald-400"
        metric1Label="Avg Win"
        metric1Value={formatPercentage(metrics.avgWinPercent)}
        metric1Color="text-green-600"
        metric2Label="Avg Loss"
        metric2Value={formatPercentage(Math.abs(metrics.avgLossPercent))}
        metric2Color="text-red-600"
        gradient="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-gray-800 dark:to-gray-900"
      />
    </>
  );
};

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  icon,
  mainValue,
  mainValueColor,
  metric1Label,
  metric1Value,
  metric1Color,
  metric2Label,
  metric2Value,
  metric2Color,
  gradient
}) => (
  <Card className={`flex-none w-[280px] ${gradient}`}>
    <CardHeader className="space-y-0 p-3">
      <div className="flex items-center justify-between">
        <CardTitle className="text-base font-bold">{title}</CardTitle>
        {icon}
      </div>
      <p className={`text-2xl font-bold ${mainValueColor}`}>
        {mainValue}
      </p>
    </CardHeader>
    <CardContent className="p-3 pt-0">
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-gray-600 dark:text-gray-400">{metric1Label}</span>
          <span className={`font-medium ${metric1Color}`}>{metric1Value}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-600 dark:text-gray-400">{metric2Label}</span>
          <span className={`font-medium ${metric2Color}`}>{metric2Value}</span>
        </div>
      </div>
    </CardContent>
  </Card>
);

const StockTicker: React.FC<{position: Position}> = ({ position }) => {
  const isPositive = position.percentChange >= 0;
  const trendIcon = isPositive ? 
    <ArrowUpRight className="w-4 h-4 text-green-500" /> : 
    <ArrowDownRight className="w-4 h-4 text-red-500" />;

  const getDayChangeIndicator = () => {
    if (position.dayChangePercent > 1) return "bg-green-500";
    if (position.dayChangePercent > 0) return "bg-green-300";
    if (position.dayChangePercent > -1) return "bg-red-300";
    return "bg-red-500";
  };

  return (
    <Card className="flex-none w-[220px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 hover:shadow-lg transition-shadow">
      <CardHeader className="p-3 pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-bold">{position.ticker}</CardTitle>
            {trendIcon}
          </div>
          <div className={`h-2 w-2 rounded-full ${getDayChangeIndicator()}`} />
        </div>
      </CardHeader>
      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-base font-medium">{formatCurrency(position.currentPrice)}</span>
            <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentage(position.percentChange)}
            </span>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <div className="flex flex-col">
              <span>Shares: {position.shares}</span>
              <span>Avg Cost: {formatCurrency(position.avgCost)}</span>
            </div>
            <div className="flex flex-col items-end">
              <span>Value: {formatCurrency(position.currentValue)}</span>
              <span className={position.dollarChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                P/L: {formatCurrency(position.dollarChange)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const SwipeableContainer: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [startX, setStartX] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleStart = (clientX: number) => {
    setIsDragging(true);
    setStartX(clientX);
    if (innerRef.current) {
      innerRef.current.style.transition = 'none';
    }
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || !containerRef.current || !innerRef.current) return;
    const diff = clientX - startX;
    const maxScroll = innerRef.current.scrollWidth - containerRef.current.clientWidth;
    const newPosition = Math.max(Math.min(scrollPosition - diff, maxScroll), 0);
    if (innerRef.current) {
      innerRef.current.style.transform = `translateX(-${newPosition}px)`;
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
    if (innerRef.current) {
      const currentTransform = getComputedStyle(innerRef.current).transform;
      const matrix = new DOMMatrix(currentTransform);
      setScrollPosition(-matrix.m41);
      innerRef.current.style.transition = 'transform 0.3s ease-out';
    }
  };

  return (
    <div className="w-full overflow-hidden">
      <style jsx>{`
        @keyframes slideLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-280px * (var(--num-items) / 2))); }
        }
        .scroll-metrics {
          animation: slideLeft 5s linear infinite;
        }
        .scroll-stocks {
          animation: slideLeft 40s linear infinite;
        }
        .scroll-metrics:hover, .scroll-stocks:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div 
        ref={containerRef}
        className="relative overflow-x-hidden cursor-grab active:cursor-grabbing"
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={handleEnd}
        onMouseDown={(e) => handleStart(e.clientX)}
        onMouseMove={(e) => handleMove(e.clientX)}
        onMouseUp={handleEnd}
        onMouseLeave={() => isDragging && handleEnd()}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <div 
          ref={innerRef}
          className={`flex gap-4 pb-4 ${
            children[0]?.type?.name === 'StockTicker' ? 'scroll-stocks' : 'scroll-metrics'
          } ${isDragging ? 'animation-play-state: paused' : ''}`}
          style={{ 
            width: 'fit-content',
            transform: 'translateX(0)',
            '--num-items': React.Children.count(children) * 2
          } as React.CSSProperties}
        >
          {React.Children.map(children, child => child)}
          {React.Children.map(children, child => child)}
        </div>
      </div>
    </div>
  );
};

const calculateTopMetrics = (positions: Position[], metrics: PortfolioMetrics) => {
  const defaultMetric = { name: '-', allocation: 0, return: 0, positions: 0, sector: '-' };
  
  const topSector = metrics.sectorMetrics?.length > 0 
    ? metrics.sectorMetrics.reduce((a, b) => a.allocation > b.allocation ? a : b)
    : defaultMetric;

  const topIndustry = metrics.industryMetrics?.length > 0
    ? metrics.industryMetrics.reduce((a, b) => a.allocation > b.allocation ? a : b)
    : defaultMetric;

  return { topSector, topIndustry };
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: Math.abs(value) >= 1000000 ? 'compact' : 'standard',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatPercentage = (value: number | undefined | null, decimals = 1): string => {
  if (value == null) return '0%';
  return `${value.toFixed(decimals)}%`;
};

const PortfolioSummary: React.FC<{
  metrics: PortfolioMetrics;
  totals: PortfolioTotals;
  openPositions: Position[];
  closedPositions: ClosedPosition[];
}> = ({
  metrics,
  totals,
  openPositions,
  closedPositions
}) => {
  
  const ytdStart = new Date(new Date().getFullYear(), 0, 1);
  const ytdClosedProfits = closedPositions
    .filter(pos => new Date(pos.sellDate) >= ytdStart)
    .reduce((sum, pos) => sum + pos.profit, 0);

  const avgPositionSize = openPositions.length > 0 
    ? totals.currentValue / openPositions.length 
    : 0;

  const largestPosition = openPositions.reduce((max, pos) => 
    pos.currentValue > (max?.currentValue || 0) ? pos : max
  , openPositions[0]);

  return (
    <div className="w-full">
      <div className="px-4">
      <SwipeableContainer>
  <MetricCards 
    metrics={metrics}
    totals={totals}
    positions={openPositions}
  />
</SwipeableContainer>
      </div>
      
      <div className="px-4">
        <SwipeableContainer>
            {openPositions
              .sort((a, b) => b.currentValue - a.currentValue)
              .map(position => (
                <StockTicker key={position.ticker} position={position} />
              ))}
          </SwipeableContainer>
        </div>
      </div>
  );
};

export default PortfolioSummary;