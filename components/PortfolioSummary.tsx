import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DollarSign, Activity, TrendingUp, Clock, 
  PieChart, Target, Waypoints, BarChart3,
  ArrowUpRight, ArrowDownRight, TrendingDown
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

  return (
    <div className="w-full overflow-hidden">
      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .continuous-scroll {
          animation: ${React.Children.count(children) <= 3 ? 'none' : `scroll ${React.Children.count(children) < 4 ? '10s' : '30s'} linear infinite`};
        }
        .fast-scroll {
          animation: ${React.Children.count(children) <= 3 ? 'none' : `scroll ${React.Children.count(children) < 4 ? '5s' : '15s'} linear infinite`};
        }
        .continuous-scroll.dragging {
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
          className={`flex gap-4 pb-4 ${children[0]?.type?.name === 'StockTicker' ? 'fast-scroll' : 'continuous-scroll'} ${isDragging ? 'dragging' : ''}`}
          style={{ width: 'fit-content' }}
        >
          {React.Children.count(children) <= 3 ? children : (
            <>
              {React.Children.map(children, child => child)}
              {React.Children.map(children, child => child)}
              {React.Children.map(children, child => child)}
              {React.Children.count(children) < 4 && React.Children.map(children, child => child)}
            </>
          )}
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
    <div className="w-full">
      <div className="px-4">
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
            title="Risk Analysis"
            icon={<Target className="w-4 h-4 text-red-600 dark:text-red-400" />}
            mainValue={formatPercentage(Math.abs(metrics.avgLossPercent))}
            mainValueColor="text-red-600 dark:text-red-400"
            metric1Label="Max Drawdown"
            metric1Value={formatPercentage(Math.min(...openPositions.map(p => p.percentChange)))}
            metric1Color="text-red-600"
            metric2Label="Risk Ratio"
            metric2Value={formatPercentage(Math.abs(metrics.avgWinPercent / metrics.avgLossPercent))}
            metric2Color="text-blue-600"
            gradient="bg-gradient-to-br from-red-50 to-pink-50 dark:from-gray-800 dark:to-gray-900"
          />

          <MetricCard
            title="Trading Stats"
            icon={<Activity className="w-4 h-4 text-green-600 dark:text-green-400" />}
            mainValue={formatPercentage(metrics.winRate)}
            mainValueColor="text-green-600 dark:text-green-400"
            metric1Label="Win/Loss"
            metric1Value={`${openPositions.filter(p => p.percentChange > 0).length}/${openPositions.filter(p => p.percentChange < 0).length}`}
            metric1Color="text-green-600"
            metric2Label="Avg Days Held"
            metric2Value={metrics.avgHoldingPeriodWinners}
            metric2Color="text-green-600"
            gradient="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900"
          />

          <MetricCard
            title="Volatility"
            icon={<BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
            mainValue={formatPercentage(
              Math.sqrt(openPositions.reduce((sum, pos) => sum + Math.pow(pos.dayChangePercent, 2), 0) / openPositions.length)
            )}
            mainValueColor="text-purple-600 dark:text-purple-400"
            metric1Label="Daily Range"
            metric1Value={formatPercentage(
              openPositions.reduce((sum, pos) => sum + ((pos.dayHigh || 0) - (pos.dayLow || 0)) / (pos.currentPrice || 1), 0) / openPositions.length
            )}
            metric1Color="text-purple-600"
            metric2Label="Beta"
            metric2Value={formatPercentage(metrics.bestPerformer?.spyReturn || 0)}
            metric2Color="text-purple-600"
            gradient="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-gray-800 dark:to-gray-900"
          />

          <MetricCard
            title="Sector Analysis"
            icon={<PieChart className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />}
            mainValue={openPositions.length}
            mainValueColor="text-cyan-600 dark:text-cyan-400"
            metric1Label="Sector Count"
            metric1Value={new Set(openPositions.map(p => p.ticker.slice(0,2))).size}
            metric1Color="text-cyan-600"
            metric2Label="Concentration"
            metric2Value={formatPercentage((largestPosition?.currentValue || 0) / metrics.totalValue * 100)}
            metric2Color="text-cyan-600"
            gradient="bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-gray-800 dark:to-gray-900"
          />

          <MetricCard
            title="Position Signals"
            icon={<Waypoints className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />}
            mainValue={`${openPositions.filter(p => p.percentChange > 0 && p.dayChangePercent > 0).length}`}
            mainValueColor="text-yellow-600 dark:text-yellow-400"
            metric1Label="Trending Up"
            metric1Value={openPositions.filter(p => p.percentChange > 0 && p.dayChangePercent > 0).length}
            metric1Color="text-green-600"
            metric2Label="Trending Down"
            metric2Value={openPositions.filter(p => p.percentChange < 0 && p.dayChangePercent < 0).length}
            metric2Color="text-red-600"
            gradient="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-gray-800 dark:to-gray-900"
          />

          {/* Additional MetricCards as before */}
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