import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, TrendingUp, Timer, Trophy, LucideIcon } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface Position {
  profit: number;
  percentChange: number;
  sellDate: string;
}

interface Metrics {
  totalValue: number;
  winRate: number;
  avgWinPercent: number;
  avgHoldingPeriodWinners: number;
}

interface Totals {
  realizedProfits: number;
  unrealizedProfits: number;
  totalReturn: number;
}

interface ChartDataPoint {
  date: string;
  value: number;
  return: number;
}

interface MetricTileProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  valueColor?: string;
}

const gradientId = "performanceGradient";
const gradientDef = (
  <defs>
    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3} />
      <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
    </linearGradient>
  </defs>
);

const MetricTile: React.FC<MetricTileProps> = ({ 
  label, 
  value, 
  icon: Icon, 
  valueColor = "text-gray-600 dark:text-gray-300" 
}) => (
  <div className="p-2 bg-white/20 dark:bg-white/10 rounded-lg grid place-items-center gap-1" role="group" aria-label={label}>
    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
    <div className="flex items-center gap-1">
      {Icon && <Icon className="w-4 h-4 text-purple-600" />}
      <span className={`text-sm font-semibold ${valueColor}`}>{value}</span>
    </div>
  </div>
);

interface PerformanceMetricsCardProps {
  metrics: Metrics;
  totals: Totals;
  closedPositions: Position[];
}

const PerformanceMetricsCard: React.FC<PerformanceMetricsCardProps> = ({ 
  metrics, 
  totals, 
  closedPositions 
}) => {
  const performanceData = useMemo<ChartDataPoint[]>(() => {
    if (!closedPositions.length) return [];
    return closedPositions
      .sort((a, b) => new Date(a.sellDate).getTime() - new Date(b.sellDate).getTime())
      .reduce((acc: ChartDataPoint[], position) => {
        const lastValue = acc.length > 0 ? acc[acc.length - 1].value : 0;
        acc.push({
          date: new Date(position.sellDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          }),
          value: lastValue + position.profit,
          return: position.percentChange
        });
        return acc;
      }, []);
  }, [closedPositions]);

  const formatCurrency = (value: number): string => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  
  const formatPercentage = (value: number): string => 
    `${(value * 100).toFixed(1)}%`;

  const totalReturnColor = totals.totalReturn >= 0 
    ? 'text-green-600 dark:text-green-400' 
    : 'text-red-600 dark:text-red-400';

  return (
    <Card className="w-[440px] bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 rounded-xl border-0 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardContent className="p-3">
        <section className="grid gap-4" role="region" aria-label="Performance Metrics">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/20 dark:bg-white/10 backdrop-blur-sm p-2 shadow-sm">
                <Trophy className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Performance Metrics
              </h2>
            </div>
            <div className="flex items-center gap-2 bg-white/30 dark:bg-white/10 rounded-lg px-3 py-1">
              <span className={`text-sm font-semibold ${totalReturnColor}`}>
                {formatPercentage(totals.totalReturn)} Total Return
              </span>
            </div>
          </header>

          {performanceData.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData}>
                    {gradientDef}
                    <XAxis dataKey="date" tick={{fontSize: 10}} interval="preserveStartEnd" stroke="#9333ea" strokeOpacity={0.4} />
                    <YAxis tick={{fontSize: 10}} stroke="#9333ea" strokeOpacity={0.4} />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (!active || !payload?.[0]) return null;
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
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#9333ea" 
                      fill={`url(#${gradientId})`} 
                      strokeWidth={2} 
                      isAnimationActive={false} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <MetricTile
                  label="Realized P/L"
                  value={formatCurrency(totals.realizedProfits)}
                  icon={DollarSign}
                  valueColor={totals.realizedProfits >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
                />
                <MetricTile
                  label="Win Rate"
                  value={formatPercentage(metrics.winRate)}
                  icon={TrendingUp}
                  valueColor="text-green-600 dark:text-green-400"
                />
                <MetricTile
                  label="Average Win"
                  value={formatPercentage(metrics.avgWinPercent)}
                  valueColor="text-green-600 dark:text-green-400"
                />
                <MetricTile
                  label="Avg Hold Time"
                  value={`${metrics.avgHoldingPeriodWinners}d`}
                  icon={Timer}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 space-y-2">
              <Trophy className="w-6 h-6 text-purple-400/50" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                No Closed Transactions Yet
              </p>
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  );
};

export default PerformanceMetricsCard;