import React, { useMemo } from 'react';
import { PieChart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import _ from 'lodash';
import { formatPercentage } from './utils/portfolio-utils';

interface Position {
  sector: string;
  currentValue: number;
}

interface SectorAnalysisCardProps {
  sectorData: Array<{
    sector: string;
    allocation: number;
    positions: number;
  }>;
  positions: Position[];
}

const SectorAnalysisCard: React.FC<SectorAnalysisCardProps> = ({
  sectorData,
  positions
}) => {
  const topSector = useMemo(() => 
    sectorData.length ? _.maxBy(sectorData, 'allocation') || {
      sector: 'None',
      allocation: 0,
      positions: 0
    } : {
      sector: 'None',
      allocation: 0,
      positions: 0
    }, 
    [sectorData]
  );

  return (
    <Card
      className={cn(
        "w-[220px] xs:w-[200px] sm:w-[220px] md:w-[240px]",
        "bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20",
        "rounded-xl border-0",
        "shadow-sm transition-all duration-300",
        "hover:shadow-lg hover:-translate-y-1",
        "relative overflow-hidden"
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5" />
      <CardContent className="p-4 relative">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-white/20 dark:bg-white/10 backdrop-blur-sm p-2 shadow-sm">
                <PieChart className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Sector Analysis
              </span>
            </div>
          </div>

          {/* Main Value */}
          <div className="space-y-1">
            <div className="text-2xl md:text-3xl font-bold tracking-tight text-violet-600 dark:text-violet-400">
              {formatPercentage(topSector.allocation)}
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Top Sector
              </p>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                {topSector.sector}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Active Positions
              </p>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                {positions.length}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SectorAnalysisCard;