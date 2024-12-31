import React, { useMemo } from 'react';
import _ from 'lodash';
import { DollarSign, PieChart, Target, AlertTriangle } from 'lucide-react';
import type { Position, PortfolioMetrics, PortfolioTotals, ClosedPosition } from '@/lib/types';
import MetricCard from './MetricCard';
import StockCard from './StockCard';
import {
  formatCurrency,
  formatPercentage,
  getColorForValue,
  calculateSectorData,
  calculateRiskMetrics
} from './utils/portfolio-utils';
import SectorBreakdownCard from './SectorBreakdownCard';
import PerformanceTrendsCard from './PerformanceTrendsCard';
import PositionDistributionCard from './PositionDistributionCard';

interface PortfolioSummaryProps {
  metrics: PortfolioMetrics;
  totals: PortfolioTotals;
  openPositions: Position[];
  closedPositions: ClosedPosition[];
}

const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({
  metrics,
  totals,
  openPositions,
  closedPositions
}) => {
  const sectorData = useMemo(() => calculateSectorData(openPositions), [openPositions]);
  const riskMetrics = useMemo(() => calculateRiskMetrics(metrics, openPositions), [metrics, openPositions]);
  
  const topSector = useMemo(() => 
    sectorData.length ? _.maxBy(sectorData, 'allocation') || {
      sector: 'None',
      allocation: 0,
      return: 0,
      positions: 0
    } : {
      sector: 'None',
      allocation: 0,
      return: 0,
      positions: 0
    }, 
    [sectorData]
  );

  // Calculate additional performance metrics using closed positions
  const performanceMetrics = useMemo(() => {
    const totalTrades = closedPositions.length;
    const winningTrades = closedPositions.filter(pos => pos.profit > 0).length;
    const avgHoldingPeriod = totalTrades > 0 
      ? Math.round(closedPositions.reduce((sum, pos) => sum + pos.holdingPeriod, 0) / totalTrades)
      : 0;
    
    return {
      totalTrades,
      winningTrades,
      avgHoldingPeriod,
      winRate: totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0
    };
  }, [closedPositions]);

  return (
    <div className="w-full">
      {/* Metric Cards Section */}
      <div className="overflow-x-auto snap-x snap-mandatory scrollbar-none mb-4">
        <div className="flex gap-4 px-4 pb-4 w-max min-w-full">
          <MetricCard
            title="Portfolio Value"
            icon={<DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
            mainValue={formatCurrency(metrics.totalValue)}
            mainValueColor="text-blue-600 dark:text-blue-400"
            metric1Label="Daily P/L"
            metric1Value={formatCurrency(totals.realizedProfits)}
            metric1Color={getColorForValue(totals.realizedProfits)}
            metric2Label="Total Return"
            metric2Value={formatPercentage(totals.totalReturn)}
            metric2Color={getColorForValue(totals.totalReturn)}
            gradient="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20"
          />
          <MetricCard
            title="Risk Profile"
            icon={<AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
            mainValue={formatPercentage(riskMetrics.portfolioBeta)}
            mainValueColor="text-amber-600 dark:text-amber-400"
            metric1Label="Max Drawdown"
            metric1Value={formatPercentage(metrics.maxDrawdown)}
            metric1Color="text-red-600 dark:text-red-400"
            metric2Label="Avg Hold Time"
            metric2Value={`${performanceMetrics.avgHoldingPeriod}d`}
            metric2Color="text-gray-600 dark:text-gray-400"
            gradient="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20"
          />
          <MetricCard
            title="Performance"
            icon={<Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
            mainValue={formatPercentage(performanceMetrics.winRate)}
            mainValueColor="text-emerald-600 dark:text-emerald-400"
            metric1Label="Winning Trades"
            metric1Value={`${performanceMetrics.winningTrades}/${performanceMetrics.totalTrades}`}
            metric1Color="text-green-600 dark:text-green-400"
            metric2Label="Avg Loss"
            metric2Value={formatPercentage(Math.abs(metrics.avgLossPercent))}
            metric2Color="text-red-600 dark:text-red-400"
            gradient="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20"
          />
          <MetricCard
            title="Sector Analysis"
            icon={<PieChart className="w-4 h-4 text-violet-600 dark:text-violet-400" />}
            mainValue={formatPercentage(topSector.allocation)}
            mainValueColor="text-violet-600 dark:text-violet-400"
            metric1Label="Top Sector"
            metric1Value={topSector.sector}
            metric1Color="text-gray-600 dark:text-gray-400"
            metric2Label="Active Positions"
            metric2Value={`${openPositions.length}`}
            metric2Color="text-gray-600 dark:text-gray-400"
            gradient="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20"
          />
          <SectorBreakdownCard sectorData={sectorData} />
          <PerformanceTrendsCard 
            data={{
              totalTrades: performanceMetrics.totalTrades,
              winningTrades: performanceMetrics.winningTrades,
              winRate: performanceMetrics.winRate,
              avgWinPercent: metrics.avgWinPercent,
              avgLossPercent: metrics.avgLossPercent
            }}
            closedPositions={closedPositions}
          />
          <PositionDistributionCard 
            positions={openPositions}
            totalValue={metrics.totalValue}
          />
        </div>
      </div>

      {/* Stock Cards Section */}
      <div className="overflow-x-auto snap-x snap-mandatory scrollbar-none">
        <div className="flex gap-4 px-4 pb-4 w-max min-w-full">
          {openPositions
            .sort((a, b) => b.currentValue - a.currentValue)
            .map((position) => (
              <StockCard 
                key={position.ticker} 
                position={position} 
                metrics={metrics} 
                totals={totals} 
              />
          ))}
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default PortfolioSummary;