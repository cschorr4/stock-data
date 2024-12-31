import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, TrendingUp, Timer, Trophy } from 'lucide-react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { formatCurrency, formatPercentage } from './utils/portfolio-utils';

interface PerformanceMetricsCardProps {
  metrics: {
    totalValue: number;
    winRate: number;
    avgWinPercent: number;
    avgHoldingPeriodWinners: number;
  };
  totals: {
    realizedProfits: number;
    unrealizedProfits: number;
    totalReturn: number;
  };
  closedPositions: Array<{
    profit: number;
    percentChange: number;
    sellDate: string;
  }>;
}

interface ChartDataPoint {
  date: string;
  value: number;
  return: number;
}

const PerformanceMetricsCard: React.FC<PerformanceMetricsCardProps> = ({
  metrics,
  totals,
  closedPositions
}) => {
  // Calculate cumulative performance data
  const performanceData: ChartDataPoint[] = closedPositions
    .sort((a, b) => new Date(a.sellDate).getTime() - new Date(b.sellDate).getTime())
    .reduce((acc: ChartDataPoint[], position) => {
      const lastValue = acc.length > 0 ? acc[acc.length - 1].value : 0;
      const date = new Date(position.sellDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      
      acc.push({
        date,
        value: lastValue + position.profit,
        return: position.percentChange
      });
      
      return acc;
    }, []);

  const totalProfits = totals.realizedProfits + totals.unrealizedProfits;

  return (
    <Card className="flex-none w-[220px] xs:w-[200px] sm:w-[220px] md:w-[240px] bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-0 shadow-sm transition-all duration-200 hover:shadow-md">
      <CardContent className="p-3">
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-white/10 p-1">
                <Trophy className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Performance
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className={`text-xs font-medium ${
                totals.totalReturn >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
              }`}>
                {formatPercentage(totals.totalReturn)}
              </span>
            </div>
          </div>

          {/* Performance Chart */}
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as ChartDataPoint;
                      return (
                        <div className="bg-white dark:bg-gray-800 p-2 rounded shadow-lg border border-gray-200 dark:border-gray-700">
                          <p className="text-xs font-medium">{data.date}</p>
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            {formatCurrency(data.value)}
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
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  fill="url(#performanceGradient)"
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                Realized P/L
              </p>
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-blue-600" />
                <p className={`text-xs font-medium ${
                  totals.realizedProfits >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {formatCurrency(totals.realizedProfits)}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                Win Rate
              </p>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <p className="text-xs font-medium text-green-600">
                  {formatPercentage(metrics.winRate)}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                Avg Win
              </p>
              <p className="text-xs font-medium text-green-600">
                {formatPercentage(metrics.avgWinPercent)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                Avg Hold Time
              </p>
              <div className="flex items-center gap-1">
                <Timer className="w-3 h-3 text-gray-600" />
                <p className="text-xs font-medium text-gray-600">
                  {metrics.avgHoldingPeriodWinners}d
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                Total P/L
              </p>
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-blue-600" />
                <p className={`text-xs font-medium ${
                  totalProfits >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {formatCurrency(totalProfits)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceMetricsCard;