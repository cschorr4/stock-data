import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart2, ArrowRight, PieChart } from 'lucide-react';
import {
  BarChart,
  Bar,
  Cell,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid
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
    if (value > 20) return '#dc2626'; // High concentration - red
    if (value > 15) return '#f97316'; // Medium-high - orange
    if (value > 10) return '#eab308'; // Medium - yellow
    return '#16a34a'; // Good - green
  };

  return (
    <Card className="w-[220px] xs:w-[200px] sm:w-[220px] md:w-[240px] bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl border-0 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardContent className="p-4 relative">
        <div className="space-y-4">
          {/* Header with improved styling */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/20 dark:bg-white/10 backdrop-blur-sm p-2 shadow-sm">
                <PieChart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Value Distribution
              </span>
            </div>
          </div>

          {/* Distribution Chart with improved height and axes */}
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#16a34a" strokeOpacity={0.1} />
                <XAxis 
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#16a34a' }}
                  stroke="#16a34a"
                  strokeOpacity={0.4}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#16a34a' }}
                  stroke="#16a34a"
                  strokeOpacity={0.4}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-gray-800 p-2 rounded shadow-md border border-gray-200 dark:border-gray-700">
                          <p className="text-sm font-medium">{data.name}</p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400">
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
                <ReferenceLine y={10} stroke="#16a34a" strokeDasharray="3 3" />
                <ReferenceLine y={20} stroke="#dc2626" strokeDasharray="3 3" />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.value)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Concentration Metrics with improved styling */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Top 3 Weight
              </p>
              <div className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-emerald-600" />
                <p className={`text-sm font-semibold ${
                  top3Allocation > 50 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {formatPercentage(top3Allocation)}
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Top 5 Weight
              </p>
              <div className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-emerald-600" />
                <p className={`text-sm font-semibold ${
                  top5Allocation > 70 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {formatPercentage(top5Allocation)}
                </p>
              </div>
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Largest Position
              </p>
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                {positionsByValue[0]?.ticker}
                <span className="text-xs ml-1 text-gray-500">
                  ({formatPercentage(positionsByValue[0]?.allocation || 0)})
                </span>
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Position Count
              </p>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
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