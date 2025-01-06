import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, TrendingUp, Timer, Trophy } from 'lucide-react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
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

const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-40 space-y-3">
    <Trophy className="w-8 h-8 text-purple-400/50" />
    <div className="text-center space-y-1">
      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
        No Closed Transactions Yet
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Your trading performance metrics will appear here once you close your first position
      </p>
    </div>
  </div>
);

const PerformanceMetricsCard: React.FC<PerformanceMetricsCardProps> = ({
  metrics,
  totals,
  closedPositions
}) => {
  const hasClosedPositions = closedPositions.length > 0;

  const performanceData: ChartDataPoint[] = hasClosedPositions 
    ? closedPositions
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
        }, [])
    : [];

  return (
    <Card className="w-[440px] xs:w-[440px] sm:w-[440px] md:w-[480px] bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 rounded-xl border-0 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardContent className="p-4 relative">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/20 dark:bg-white/10 backdrop-blur-sm p-2 shadow-sm">
                <Trophy className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Performance Metrics
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white/30 dark:bg-white/10 rounded-lg px-3 py-1">
              <span className={`text-sm font-semibold ${
                totals.totalReturn >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
              }`}>
                {formatPercentage(totals.totalReturn)} Total Return
              </span>
            </div>
          </div>

          {hasClosedPositions ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData}>
                    <defs>
                      <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }}
                      interval="preserveStartEnd"
                      stroke="#9333ea"
                      strokeOpacity={0.4}
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }}
                      stroke="#9333ea"
                      strokeOpacity={0.4}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as ChartDataPoint;
                          return (
                            <div className="bg-white dark:bg-gray-800 p-2 rounded shadow-md border border-gray-200 dark:border-gray-700">
                              <p className="text-xs font-medium">{data.date}</p>
                              <p className="text-xs text-purple-600 dark:text-purple-400">
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
                      stroke="#9333ea"
                      fill="url(#performanceGradient)"
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-4 p-2">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Realized P/L
                  </p>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-purple-600" />
                    <p className={`text-sm font-semibold ${
                      totals.realizedProfits >= 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {formatCurrency(totals.realizedProfits)}
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Win Rate
                  </p>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {formatPercentage(metrics.winRate)}
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Average Win
                  </p>
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {formatPercentage(metrics.avgWinPercent)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Avg Hold Time
                  </p>
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-purple-600" />
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                      {metrics.avgHoldingPeriodWinners}d
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceMetricsCard;
