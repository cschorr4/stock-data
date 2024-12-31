import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

interface PerformanceTrendsCardProps {
  data: {
    totalTrades: number;
    winningTrades: number;
    winRate: number;
    avgWinPercent: number;
    avgLossPercent: number;
  };
  closedPositions: Array<{
    profit: number;
    percentChange: number;
    sellDate: string;
  }>;
}

const PerformanceTrendsCard: React.FC<PerformanceTrendsCardProps> = ({ data, closedPositions }) => {
  // Process closed positions to create trend data
  const trendData = closedPositions
    .sort((a, b) => new Date(a.sellDate).getTime() - new Date(b.sellDate).getTime())
    .map((position, index) => ({
      date: position.sellDate,
      return: position.percentChange,
      profit: position.profit,
    }))
    .slice(-30); // Last 30 trades

  return (
    <Card className="flex-none w-[220px] xs:w-[200px] sm:w-[220px] md:w-[240px] bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-xl border-0 shadow-sm transition-all duration-200 hover:shadow-md">
      <CardContent className="p-3">
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-white/10 p-1">
              <TrendingUp className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Performance Trends
            </span>
          </div>

          {/* Chart */}
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <Line
                  type="monotone"
                  dataKey="return"
                  stroke="#e11d48"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-gray-800 p-2 rounded shadow-lg border border-gray-200 dark:border-gray-700">
                          <p className="text-xs font-medium">
                            {payload[0].value.toFixed(2)}%
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-x-3">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                Win Rate
              </p>
              <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                {data.winRate.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                Avg Win
              </p>
              <p className="text-xs font-medium text-green-600 dark:text-green-400">
                {data.avgWinPercent.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceTrendsCard;