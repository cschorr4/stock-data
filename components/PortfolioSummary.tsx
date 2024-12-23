import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { cn } from '@/lib/utils';
import { PortfolioSummaryProps, Position } from '@/lib/types';
import { TrendingUp, PieChart } from 'lucide-react';

const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({
  metrics,
  totals,
  openPositions,
  closedPositions,
}) => {
  const calculateHoldingPeriod = (position: Position): number => {
    const buyDate = new Date(position.buyDate);
    const today = new Date();
    return Math.floor((today.getTime() - buyDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  const avgHoldingPeriod = Math.floor(
    openPositions.reduce((sum, pos) => sum + calculateHoldingPeriod(pos), 0) / 
    (openPositions.length || 1)
  );

  const formatCurrency = (value: number | undefined | null) => {
    if (value == null) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number | undefined | null) => {
    if (value == null) return '0.0%';
    return `${value.toFixed(1)}%`;
  };

  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardHeader className="border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-gray-500" />
          <CardTitle>Fundamental Portfolio Overview</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Portfolio Value Card */}
          <HoverCard>
            <HoverCardTrigger asChild>
              <Card className="cursor-help border-2 hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Portfolio Value
                    </div>
                    <PieChart className="w-5 h-5 text-primary/60" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold tracking-tight">
                      {formatCurrency(metrics?.totalValue)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Cost Basis: {formatCurrency(metrics?.totalCost)}
                    </div>
                    <div
                      className={cn(
                        "text-sm font-medium",
                        (totals?.totalReturn || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      )}
                    >
                      {formatPercentage(totals?.totalReturn)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-2">
                <h4 className="font-medium">Long-term Value Analysis</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-500">Avg Holding Period:</div>
                  <div className="font-medium">{avgHoldingPeriod} days</div>
                  <div className="text-gray-500">Unrealized Gains:</div>
                  <div className="font-medium">
                    {formatCurrency(totals?.unrealizedProfits)}
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>

          {/* Other Cards */}
          {/* Repeat similar structure for other cards like Investment Approach, Core Holdings, etc. */}
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioSummary;
