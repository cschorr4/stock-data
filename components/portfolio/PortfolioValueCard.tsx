import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowDownSquare, ArrowUpSquare, Scale } from 'lucide-react';
import { formatCurrency, formatPercentage } from './utils/portfolio-utils';

interface PortfolioValueCardProps {
  openPositions: Array<{
    currentValue: number;
    percentChange: number;
  }>;
  closedPositions: Array<{
    sellDate: string;
    profit: number;
    percentChange: number;
  }>;
  totals: {
    realizedProfits: number;
    unrealizedProfits: number;
  };
}

const PortfolioValueCard: React.FC<PortfolioValueCardProps> = ({
  openPositions,
  closedPositions,
  totals
}) => {
  const stats = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const ytdClosedPositions = closedPositions.filter(
      pos => new Date(pos.sellDate).getFullYear() === currentYear
    );

    const openValue = openPositions.reduce((sum, pos) => sum + pos.currentValue, 0);
    const closedValue = Math.abs(totals.realizedProfits);
    
    const ytdStats = {
      sells: ytdClosedPositions.length,
      buys: openPositions.length,
      avgWinPercent: ytdClosedPositions
        .filter(pos => pos.profit > 0)
        .reduce((avg, pos, _, arr) => avg + pos.percentChange / arr.length, 0),
      avgLossPercent: ytdClosedPositions
        .filter(pos => pos.profit < 0)
        .reduce((avg, pos, _, arr) => avg + pos.percentChange / arr.length, 0)
    };

    return {
      openValue,
      closedValue,
      ...ytdStats
    };
  }, [openPositions, closedPositions, totals]);

  return (
    <Card className="w-[220px] xs:w-[200px] sm:w-[220px] md:w-[240px] bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border-0 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardContent className="p-4 relative">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-white/20 dark:bg-white/10 backdrop-blur-sm p-2 shadow-sm">
                <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Position Summary
              </span>
            </div>
          </div>

          {/* Position Values */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/30 dark:bg-white/10 rounded-lg p-2">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Open Positions
              </p>
              <div className="flex items-center gap-2">
                <ArrowUpSquare className="w-4 h-4 text-emerald-600" />
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(stats.openValue)}
                </p>
              </div>
            </div>

            <div className="bg-white/30 dark:bg-white/10 rounded-lg p-2">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Closed P/L
              </p>
              <div className="flex items-center gap-2">
                <ArrowDownSquare className="w-4 h-4 text-emerald-600" />
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(stats.closedValue)}
                </p>
              </div>
            </div>
          </div>

          {/* YTD Trading Activity */}
          <div className="bg-white/20 dark:bg-white/5 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              YTD Trading Activity
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Buys
                </p>
                <p className="text-sm font-semibold text-emerald-600">
                  {stats.buys}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Sells
                </p>
                <p className="text-sm font-semibold text-emerald-600">
                  {stats.sells}
                </p>
              </div>
            </div>
          </div>

          {/* YTD Performance */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/20 dark:bg-white/5 p-2 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Avg Win
              </p>
              <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                {formatPercentage(stats.avgWinPercent || 0)}
              </p>
            </div>
            <div className="bg-white/20 dark:bg-white/5 p-2 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Avg Loss
              </p>
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                {formatPercentage(stats.avgLossPercent || 0)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioValueCard;