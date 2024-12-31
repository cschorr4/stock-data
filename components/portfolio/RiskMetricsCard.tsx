import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, TrendingDown, Target } from 'lucide-react';
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine
} from 'recharts';
import { formatPercentage } from './utils/portfolio-utils';

interface RiskMetricsCardProps {
  metrics: {
    maxDrawdown: number;
    portfolioBeta: number;
    sharpeRatio: number;
    avgLossPercent: number;
  };
  positions: Array<{
    ticker: string;
    beta?: number;
    percentChange: number;
    currentValue: number;
  }>;
  totalValue: number;
}

interface BetaContribution {
  name: string;
  value: number;
}

const RiskMetricsCard: React.FC<RiskMetricsCardProps> = ({ metrics, positions, totalValue }) => {
  // Calculate position-weighted beta
  const weightedBetas = positions
    .filter(pos => pos.beta !== undefined)
    .map(pos => ({
      ticker: pos.ticker,
      beta: pos.beta || 0,
      weight: pos.currentValue / totalValue,
      weightedBeta: (pos.beta || 0) * (pos.currentValue / totalValue)
    }))
    .sort((a, b) => b.weightedBeta - a.weightedBeta);

  const betaContribution: BetaContribution[] = weightedBetas.map(item => ({
    name: item.ticker,
    value: item.weightedBeta
  }));

  return (
    <Card className="flex-none w-[220px] xs:w-[200px] sm:w-[220px] md:w-[240px] bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border-0 shadow-sm transition-all duration-200 hover:shadow-md">
      <CardContent className="p-3">
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-white/10 p-1">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Risk Analysis
            </span>
          </div>

          {/* Beta Contribution Chart */}
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={betaContribution.slice(0, 5)}>
                <Bar 
                  dataKey="value" 
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as BetaContribution;
                      return (
                        <div className="bg-white dark:bg-gray-800 p-2 rounded shadow-lg border border-gray-200 dark:border-gray-700">
                          <p className="text-xs font-medium">{data.name}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Beta Contribution: {data.value.toFixed(3)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={0} stroke="#dc2626" strokeDasharray="3 3" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Risk Metrics Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                Portfolio β
              </p>
              <div className="flex items-center gap-1">
                <Target className="w-3 h-3 text-amber-600" />
                <p className={`text-xs font-medium ${
                  metrics.portfolioBeta > 1.2 
                    ? 'text-red-600' 
                    : metrics.portfolioBeta < 0.8
                    ? 'text-green-600'
                    : 'text-amber-600'
                }`}>
                  {metrics.portfolioBeta.toFixed(2)}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                Max Drawdown
              </p>
              <div className="flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-red-600" />
                <p className="text-xs font-medium text-red-600">
                  {formatPercentage(metrics.maxDrawdown)}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                Sharpe Ratio
              </p>
              <p className={`text-xs font-medium ${
                metrics.sharpeRatio > 1 
                  ? 'text-green-600' 
                  : 'text-amber-600'
              }`}>
                {metrics.sharpeRatio.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                Avg Loss
              </p>
              <p className="text-xs font-medium text-red-600">
                {formatPercentage(Math.abs(metrics.avgLossPercent))}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RiskMetricsCard;