import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart2 } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, Tooltip } from 'recharts';
import _ from 'lodash';

interface PositionDistributionCardProps {
  positions: Array<{
    currentValue: number;
    percentChange: number;
    ticker: string;
  }>;
  totalValue: number;
}

const PositionDistributionCard: React.FC<PositionDistributionCardProps> = ({ positions, totalValue }) => {
  // Calculate position size distribution
  const sizeRanges = [0, 5, 10, 15, 20, 100];
  const distribution = positions.reduce((acc, position) => {
    const weight = (position.currentValue / totalValue) * 100;
    const range = sizeRanges.findIndex((max, i) => 
      weight <= max && (i === 0 || weight > sizeRanges[i - 1])
    );
    const rangeLabel = range === sizeRanges.length - 1 
      ? `>${sizeRanges[range - 1]}%`
      : `${sizeRanges[range - 1] || 0}-${sizeRanges[range]}%`;
    
    acc[rangeLabel] = (acc[rangeLabel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(distribution).map(([range, count]) => ({
    range,
    count
  }));

  return (
    <Card className="flex-none w-[220px] xs:w-[200px] sm:w-[220px] md:w-[240px] bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20 rounded-xl border-0 shadow-sm transition-all duration-200 hover:shadow-md">
      <CardContent className="p-3">
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-white/10 p-1">
              <BarChart2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Position Distribution
            </span>
          </div>

          {/* Chart */}
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <Bar 
                  dataKey="count" 
                  fill="#0891b2"
                  radius={[4, 4, 0, 0]}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-gray-800 p-2 rounded shadow-lg border border-gray-200 dark:border-gray-700">
                          <p className="text-xs font-medium">{payload[0].payload.range}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {payload[0].value} positions
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-x-3">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                Largest
              </p>
              <p className="text-xs font-medium text-cyan-600 dark:text-cyan-400">
                {(_.maxBy(positions, 'currentValue')?.currentValue / totalValue * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                Average
              </p>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {(100 / positions.length).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PositionDistributionCard;