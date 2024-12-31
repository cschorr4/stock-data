import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart2, ArrowRight } from 'lucide-react';
import {
  BarChart,
  Bar,
  Cell,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine
} from 'recharts';
import { formatCurrency, formatPercentage } from './utils/portfolio-utils';
import _ from 'lodash';

interface ValueDistributionCardProps {
  positions: Array<{
    ticker: string;
    currentValue: number;
    percentChange: number;
    shares: number;
  }>;
  totalValue: number;
}

const ValueDistributionCard: React.FC<ValueDistributionCardProps> = ({
  positions,
  totalValue
}) => {
  // Sort positions by value and calculate allocation
  const positionsByValue = positions
    .map(position => ({
      ticker: position.ticker,
      value: position.currentValue,
      allocation: (position.currentValue / totalValue) * 100,
      return: position.percentChange,
      shares: position.shares
    }))
    .sort((a, b) => b.value - a.value);

  // Calculate concentration metrics
  const top3Allocation = _.sumBy(positionsByValue.slice(0, 3), 'allocation');
  const top5Allocation = _.sumBy(positionsByValue.slice(0, 5), 'allocation');
  
  // Prepare chart data
  const chartData = positionsByValue.map(pos => ({
    name: pos.ticker,
    value: pos.allocation,
    actualValue: pos.value,
    return: pos.return,
    shares: pos.shares
  }));

  const getBarColor = (value: number) => {
    if (value > 20) return '#dc2626'; // red
    if (value > 15) return '#ea580c'; // orange
    if (value > 10) return '#ca8a04'; // yellow
    return '#059669'; // green
  };

  return (
    <Card className="flex-none w-[220px] xs:w-[200px] sm:w-[220px] md:w-[240px] bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border-0 shadow-sm transition-all duration-200 hover:shadow-md">
      <CardContent className="p-3">
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-white/10 p-1">
                <BarChart2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Value Distribution
              </span>
            </div>
          </div>

          {/* Distribution Chart */}
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-gray-800 p-2 rounded shadow-lg border border-gray-200 dark:border-gray-700">
                          <p className="text-xs font-medium">{data.name}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Value: {formatCurrency(data.actualValue)}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Weight: {formatPercentage(data.value)}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Return: {formatPercentage(data.return)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={10} stroke="#059669" strokeDasharray="3 3" />
                <ReferenceLine y={20} stroke="#dc2626" strokeDasharray="3 3" />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.value)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Concentration Metrics */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                Top 3 Weight
              </p>
              <div className="flex items-center gap-1">
                <ArrowRight className="w-3 h-3 text-purple-600" />
                <p className={`text-xs font-medium ${
                  top3Allocation > 50 ? 'text-red-600' : 'text-purple-600'
                }`}>
                  {formatPercentage(top3Allocation)}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                Top 5 Weight
              </p>
              <div className="flex items-center gap-1">
                <ArrowRight className="w-3 h-3 text-purple-600" />
                <p className={`text-xs font-medium ${
                  top5Allocation > 70 ? 'text-red-600' : 'text-purple-600'
                }`}>
                  {formatPercentage(top5Allocation)}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                Largest Pos
              </p>
              <p className="text-xs font-medium text-purple-600">
                {positionsByValue[0]?.ticker} 
                ({formatPercentage(positionsByValue[0]?.allocation || 0)})
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                Position Count
              </p>
              <p className="text-xs font-medium text-gray-600">
                {positions.length}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ValueDistributionCard;