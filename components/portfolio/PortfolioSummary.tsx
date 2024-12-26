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

  return (
    <div className="w-full space-y-4">
      <div className="w-full overflow-hidden">
        <div className="flex space-x-4 p-4 min-w-fit">
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
            tooltipContent={`Portfolio value of ${formatCurrency(metrics.totalValue)} with ${formatPercentage(totals.totalReturn)} total return.`}
          />
          <MetricCard
            title="Risk Profile"
            icon={<AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
            mainValue={formatPercentage(riskMetrics.portfolioBeta)}
            mainValueColor="text-amber-600 dark:text-amber-400"
            metric1Label="Max Drawdown"
            metric1Value={formatPercentage(metrics.maxDrawdown)}
            metric1Color="text-red-600 dark:text-red-400"
            metric2Label="Risk Score"
            metric2Value={formatPercentage(riskMetrics.riskScore)}
            metric2Color={getColorForValue(-riskMetrics.riskScore)}
            gradient="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20"
            tooltipContent={`Portfolio beta of ${riskMetrics.portfolioBeta.toFixed(2)} with ${formatPercentage(metrics.maxDrawdown)} maximum drawdown.`}
          />
          <MetricCard
            title="Performance"
            icon={<Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
            mainValue={formatPercentage(metrics.winRate)}
            mainValueColor="text-emerald-600 dark:text-emerald-400"
            metric1Label="Avg Win"
            metric1Value={formatPercentage(metrics.avgWinPercent)}
            metric1Color="text-green-600 dark:text-green-400"
            metric2Label="Avg Loss"
            metric2Value={formatPercentage(Math.abs(metrics.avgLossPercent))}
            metric2Color="text-red-600 dark:text-red-400"
            gradient="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20"
            tooltipContent={`Win rate of ${formatPercentage(metrics.winRate)} across ${openPositions.length + closedPositions.length} total positions.`}
          />
          <MetricCard
            title={`Sector Analysis`}
            icon={<PieChart className="w-4 h-4 text-violet-600 dark:text-violet-400" />}
            mainValue={formatPercentage(topSector.allocation)}
            mainValueColor="text-violet-600 dark:text-violet-400"
            metric1Label="Top Sector"
            metric1Value={topSector.sector}
            metric1Color="text-gray-600 dark:text-gray-400"
            metric2Label="Concentration"
            metric2Value={formatPercentage(riskMetrics.sectorConcentration * 100)}
            metric2Color={getColorForValue(-riskMetrics.sectorConcentration * 100)}
            gradient="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20"
            tooltipContent={`${topSector.sector} represents ${formatPercentage(topSector.allocation)} of portfolio with ${topSector.positions} positions.`}
          />
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div className="flex space-x-4 p-4 infinite-scroll">
          {[...openPositions, ...openPositions, ...openPositions]
            .sort((a, b) => b.currentValue - a.currentValue)
            .map((position, index) => (
              <div key={`${position.ticker}-${index}`} className="flex-none">
                <StockCard
                  position={position}
                  metrics={metrics}
                />
              </div>
            ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.33%);
          }
        }
        .infinite-scroll {
          animation: scroll 10s linear infinite;
          will-change: transform;
        }
        .infinite-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default PortfolioSummary;