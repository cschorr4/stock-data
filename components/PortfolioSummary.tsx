import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DollarSign, Activity, TrendingUp, Clock, 
  PieChart, Target, Waypoints, BarChart3 
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

interface PortfolioMetrics {
  totalValue: number;
  totalCost: number;
  winRate: number;
  avgWinPercent: number;
  avgLossPercent: number;
  bestPerformer: Position | null;
  worstPerformer: Position | null;
  avgHoldingPeriodWinners: number;
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

const SwipeableContainer: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [startX, setStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleStart = (clientX: number) => {
    setIsDragging(true);
    setStartX(clientX);
    if (innerRef.current) {
      innerRef.current.style.transform = 'none';
      innerRef.current.style.transition = 'none';
    }
  };

  const handleMove = (clientX: number) => {
    if (!isDragging) return;
    const diff = (clientX - startX) * 1.5;
    if (innerRef.current) {
      innerRef.current.style.transform = `translateX(${diff}px)`;
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
    if (innerRef.current) {
      innerRef.current.style.transform = 'none';
      innerRef.current.style.transition = 'transform 0.3s ease-out';
    }
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleEnd();
    }
  };

  return (
    <div className="w-full overflow-hidden">
      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .continuous-scroll {
          animation: scroll 30s linear infinite;
        }
        .continuous-scroll.dragging {
          animation-play-state: paused;
        }
      `}</style>
      <div 
        ref={containerRef}
        className="relative overflow-x-hidden cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <div 
          ref={innerRef}
          className={`flex gap-4 pb-4 continuous-scroll ${isDragging ? 'dragging' : ''}`}
          style={{ width: 'fit-content' }}
        >
          {children}
          {children}
        </div>
      </div>
    </div>
  );
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

const formatPercentage = (value: number, decimals = 1): string => {
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
    <div className="w-full px-4 overflow-hidden">
      <SwipeableContainer>
        <MetricCard
          title="Portfolio Value"
          icon={<DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
          mainValue={formatCurrency(metrics.totalValue)}
          mainValueColor="text-blue-600 dark:text-blue-400"
          metric1Label="Daily Change"
          metric1Value={formatCurrency(totals.realizedProfits)}
          metric1Color={totals.realizedProfits >= 0 ? 'text-green-600' : 'text-red-600'}
          metric2Label="YTD Profit"
          metric2Value={formatCurrency(ytdClosedProfits)}
          metric2Color={ytdClosedProfits >= 0 ? 'text-green-600' : 'text-red-600'}
          gradient="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900"
        />

        <MetricCard
          title="Performance"
          icon={<TrendingUp className="w-4 h-4 text-orange-600 dark:text-orange-400" />}
          mainValue={formatPercentage(totals.totalReturn)}
          mainValueColor="text-orange-600 dark:text-orange-400"
          metric1Label="vs SPY"
          metric1Value={formatPercentage(metrics.bestPerformer?.spyReturn || 0)}
          metric1Color={(metrics.bestPerformer?.spyReturn || 0) >= 0 ? 'text-green-600' : 'text-red-600'}
          metric2Label="Best Position"
          metric2Value={formatPercentage(metrics.avgWinPercent)}
          metric2Color="text-green-600"
          gradient="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-800 dark:to-gray-900"
        />

        <MetricCard
          title="Risk Management"
          icon={<Target className="w-4 h-4 text-red-600 dark:text-red-400" />}
          mainValue={formatPercentage(Math.abs(metrics.avgLossPercent))}
          mainValueColor="text-red-600 dark:text-red-400"
          metric1Label="Max Drawdown"
          metric1Value={formatPercentage(Math.min(...openPositions.map(p => p.percentChange)))}
          metric1Color="text-red-600"
          metric2Label="Losing Positions"
          metric2Value={openPositions.filter(p => p.percentChange < 0).length}
          metric2Color="text-red-600"
          gradient="bg-gradient-to-br from-red-50 to-pink-50 dark:from-gray-800 dark:to-gray-900"
        />

        <MetricCard
          title="Position Mgmt"
          icon={<Activity className="w-4 h-4 text-green-600 dark:text-green-400" />}
          mainValue={openPositions.length}
          mainValueColor="text-green-600 dark:text-green-400"
          metric1Label="Avg Size"
          metric1Value={formatCurrency(avgPositionSize)}
          metric1Color="text-green-600"
          metric2Label="Largest"
          metric2Value={largestPosition?.ticker || 'N/A'}
          metric2Color="text-green-600"
          gradient="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900"
        />

        <MetricCard
          title="Trading Stats"
          icon={<BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
          mainValue={formatPercentage(metrics.winRate)}
          mainValueColor="text-purple-600 dark:text-purple-400"
          metric1Label="Avg Win"
          metric1Value={formatPercentage(metrics.avgWinPercent)}
          metric1Color="text-green-600"
          metric2Label="Avg Loss"
          metric2Value={formatPercentage(Math.abs(metrics.avgLossPercent))}
          metric2Color="text-red-600"
          gradient="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-gray-800 dark:to-gray-900"
        />

        <MetricCard
          title="Hold Times"
          icon={<Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />}
          mainValue={`${metrics.avgHoldingPeriodWinners} days`}
          mainValueColor="text-cyan-600 dark:text-cyan-400"
          metric1Label="Winning Holds"
          metric1Value={`${metrics.avgHoldingPeriodWinners} days`}
          metric1Color="text-cyan-600"
          metric2Label="Total Closed"
          metric2Value={closedPositions.length}
          metric2Color="text-cyan-600"
          gradient="bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-gray-800 dark:to-gray-900"
        />

        <MetricCard
          title="Market Analysis"
          icon={<Waypoints className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />}
          mainValue={`${openPositions.filter(p => p.peRatio).length} stocks`}
          mainValueColor="text-yellow-600 dark:text-yellow-400"
          metric1Label="Avg P/E"
          metric1Value={formatPercentage(
            openPositions.reduce((sum, p) => sum + (p.peRatio || 0), 0) / 
            openPositions.filter(p => p.peRatio).length || 0
          )}
          metric1Color="text-yellow-600"
          metric2Label="vs Industry"
          metric2Value={formatPercentage(
            ((metrics.bestPerformer?.peRatio || 0) / 
            (metrics.bestPerformer?.industryPE || 1) - 1) * 100
          )}
          metric2Color={(metrics.bestPerformer?.peRatio || 0) <= (metrics.bestPerformer?.industryPE || 0) 
            ? 'text-green-600' 
            : 'text-red-600'}
          gradient="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-gray-800 dark:to-gray-900"
        />

        <MetricCard
          title="Diversification"
          icon={<PieChart className="w-4 h-4 text-teal-600 dark:text-teal-400" />}
          mainValue={`${openPositions.length} sectors`}
          mainValueColor="text-teal-600 dark:text-teal-400"
          metric1Label="Largest Pos"
          metric1Value={formatPercentage(
            (largestPosition?.currentValue || 0) / (totals.currentValue || 1) * 100
          )}
          metric1Color="text-teal-600"
          metric2Label="Top 3 Weight"
          metric2Value={formatPercentage(
            openPositions
              .sort((a, b) => (b.currentValue || 0) - (a.currentValue || 0))
              .slice(0, 3)
              .reduce((sum, pos) => sum + (pos.currentValue || 0), 0) / 
              (totals.currentValue || 1) * 100
          )}
          metric2Color="text-teal-600"
          gradient="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900"
        />
      </SwipeableContainer>
    </div>
  );
};

export default PortfolioSummary;