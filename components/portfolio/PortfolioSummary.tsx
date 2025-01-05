import React, { useMemo } from 'react';
import _ from 'lodash';
import { PieChart } from 'lucide-react';
import type { PortfolioSummaryProps } from '@/lib/types';

// Components
import MetricCard from './MetricCard';
import StockCard from './StockCard';
import SectorBreakdownCard from './SectorBreakdownCard';
import PerformanceMetricsCard from './PerformanceMetricsCard';
import RiskMetricsCard from './RiskMetricsCard';
import ValueDistributionCard from './ValueDistributionCard';
import PortfolioValueCard from './PortfolioValueCard';

// Utils
import {
  formatPercentage,
  calculateSectorData
} from './utils/portfolio-utils';

const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({
  metrics,
  totals,
  openPositions,
  closedPositions
}) => {
  // Calculate metrics
  const sectorData = useMemo(() => calculateSectorData(openPositions), [openPositions]);  
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
    <div className="w-full space-y-6">
      {/* All Overview Cards in One Row */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 px-4">
          Portfolio Overview
        </h3>
        <div className="overflow-x-auto snap-x snap-mandatory scrollbar-none">
          <div className="flex gap-4 px-4 pb-4 w-max min-w-full">
            {/* Portfolio Value */}
            <PortfolioValueCard
              openPositions={openPositions}
              closedPositions={closedPositions}
              totals={totals}
            />
                        
            {/* Performance Metrics */}
            <PerformanceMetricsCard 
              metrics={metrics}
              totals={totals}
              closedPositions={closedPositions}
            />
            
            {/* Risk Analysis */}
            <RiskMetricsCard
              metrics={metrics}
              positions={openPositions}
              totalValue={metrics.totalValue}
            />
            
            {/* Value Distribution */}
            <ValueDistributionCard
              positions={openPositions}
              totalValue={metrics.totalValue}
            />
            
            {/* Sector Analysis */}
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
            
            {/* Sector Breakdown */}
            <SectorBreakdownCard sectorData={sectorData} />
          
          </div>
        </div>
      </div>

      {/* Position Details */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 px-4">
          Position Details
        </h3>
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
      </div>
    </div>
  );
};

export default PortfolioSummary;