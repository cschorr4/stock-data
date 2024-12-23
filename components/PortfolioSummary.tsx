import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { cn } from '@/lib/utils';
import { PortfolioSummaryProps, Position } from '@/lib/types';
import { TrendingUp, PieChart, Clock, Activity, BarChart3, Shield } from 'lucide-react';

const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({
  metrics,
  totals,
  openPositions,
  closedPositions
}) => {
  // Helper function to calculate the holding period in days
  const calculateHoldingPeriod = (position: Position): number => {
    const buyDate = new Date(position.buyDate);
    const today = new Date();
    return Math.floor((today.getTime() - buyDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Calculate portfolio diversification
  const calculateDiversification = () => {
    const totalValue = openPositions.reduce((sum, pos) => sum + (pos.currentValue || 0), 0);
    return openPositions
      .map(pos => ({
        ticker: pos.ticker,
        percentage: totalValue > 0 ? ((pos.currentValue || 0) / totalValue) * 100 : 0,
        value: pos.currentValue || 0,
        holdingPeriod: calculateHoldingPeriod(pos)
      }))
      .sort((a, b) => b.percentage - a.percentage);
  };

  const diversification = calculateDiversification();

  // Calculate average holding period
  const avgHoldingPeriod = Math.floor(
    openPositions.reduce((sum, pos) => sum + calculateHoldingPeriod(pos), 0) / 
    (openPositions.length || 1)
  );

  // Formatting helpers
  const formatCurrency = (value: number | undefined | null) => {
    if (value == null) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number | undefined | null) => {
    if (value == null) return '0.0%';
    return `${value.toFixed(1)}%`;
  };

  const safeNumber = (value: number | undefined | null) => value ?? 0;

  // Portfolio metrics calculations
  const getTotalReturn = () => {
    const totalReturn = safeNumber(totals?.totalReturn);
    return isFinite(totalReturn) ? totalReturn : 0;
  };

  const getPortfolioTurnover = () => {
    const totalPositions = (openPositions?.length || 0) + (closedPositions?.length || 0);
    return totalPositions > 0 
      ? ((closedPositions?.length || 0) / totalPositions) * 100 
      : 0;
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
          {/* Total Portfolio Value */}
          <HoverCard>
            <HoverCardTrigger asChild>
              <Card className="cursor-help border-2 hover:border-primary/50 transition-colors">
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Portfolio Value
                    </span>
                    <PieChart className="w-5 h-5 text-primary/60" />
                  </div>
                  <div className="text-3xl font-bold tracking-tight">
                    {formatCurrency(safeNumber(metrics?.totalValue))}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Cost Basis: {formatCurrency(safeNumber(metrics?.totalCost))}
                  </div>
                  <div className={cn(
                    "text-sm font-medium",
                    getTotalReturn() >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {formatPercentage(getTotalReturn())} total return
                  </div>
                </CardContent>
              </Card>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <h4 className="font-medium">Long-term Value Analysis</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-500">Avg Holding Period:</span>
                <span className="font-medium">{avgHoldingPeriod} days</span>
                <span className="text-gray-500">Unrealized Gains:</span>
                <span className="font-medium">
                  {formatCurrency(safeNumber(totals?.unrealizedProfits))}
                </span>
              </div>
            </HoverCardContent>
          </HoverCard>

          {/* Add other cards (Investment Approach, Core Holdings, etc.) here following the same pattern */}
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioSummary;
