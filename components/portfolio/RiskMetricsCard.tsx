import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, TrendingDown, Target, Shield } from 'lucide-react';
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

const RiskMetricsCard: React.FC<RiskMetricsCardProps> = ({ metrics, positions, totalValue }) => {
  const getBetaStatus = (beta: number) => {
    if (beta > 1.2) return { color: 'text-red-600 dark:text-red-400', label: 'High Risk' };
    if (beta < 0.8) return { color: 'text-green-600 dark:text-green-400', label: 'Low Risk' };
    return { color: 'text-amber-600 dark:text-amber-400', label: 'Moderate' };
  };

  const betaStatus = getBetaStatus(metrics.portfolioBeta);

  return (
    <Card className="w-[220px] xs:w-[200px] sm:w-[220px] md:w-[240px] bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border-0 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardContent className="p-4 relative">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-white/20 dark:bg-white/10 backdrop-blur-sm p-2 shadow-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Risk Analysis
              </span>
            </div>
          </div>

          {/* Portfolio Risk Score */}
          <div className="bg-white/30 dark:bg-white/10 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Portfolio β</span>
              <span className={`text-lg font-bold ${betaStatus.color}`}>
                {metrics.portfolioBeta.toFixed(2)}
              </span>
            </div>
            <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full">
              <div 
                className="h-1 bg-amber-500 rounded-full transition-all"
                style={{ width: `${Math.min(metrics.portfolioBeta * 50, 100)}%` }}
              />
            </div>
          </div>

          {/* Risk Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/20 dark:bg-white/5 p-2 rounded-lg">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Max Drawdown
              </p>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                  {formatPercentage(metrics.maxDrawdown)}
                </p>
              </div>
            </div>
            
            <div className="bg-white/20 dark:bg-white/5 p-2 rounded-lg">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Risk Score
              </p>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-600" />
                <p className={`text-sm font-semibold ${betaStatus.color}`}>
                  {betaStatus.label}
                </p>
              </div>
            </div>

            <div className="bg-white/20 dark:bg-white/5 p-2 rounded-lg">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Sharpe Ratio
              </p>
              <p className={`text-sm font-semibold ${
                metrics.sharpeRatio > 1 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-amber-600 dark:text-amber-400'
              }`}>
                {metrics.sharpeRatio.toFixed(2)}
              </p>
            </div>

            <div className="bg-white/20 dark:bg-white/5 p-2 rounded-lg">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Avg Loss
              </p>
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">
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