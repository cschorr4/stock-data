import React, { useMemo } from 'react';
import type { PortfolioSummaryProps } from '@/lib/types';

// Components
import SectorAnalysisCard from './SectorAnalysisCard';
import StockCard from './StockCard';
import SectorBreakdownCard from './SectorBreakdownCard';
import PerformanceMetricsCard from './PerformanceMetricsCard';
import RiskMetricsCard from './RiskMetricsCard';
import ValueDistributionCard from './ValueDistributionCard';
import PortfolioValueCard from './PortfolioValueCard';

// Utils
import {
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
            <SectorAnalysisCard
              sectorData={sectorData}
              positions={openPositions}
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