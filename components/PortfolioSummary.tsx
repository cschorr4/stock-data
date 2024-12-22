import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { cn } from '@/lib/utils';
import { PortfolioSummaryProps } from '@/lib/types';
import { TrendingUp, PieChart, Clock, Activity, BarChart3, Shield } from 'lucide-react';

const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({
  metrics,
  totals,
  openPositions,
  closedPositions
}) => {
  const calculateDiversification = () => {
    const totalValue = openPositions.reduce((sum, pos) => sum + (pos.currentValue || 0), 0);
    return openPositions
      .map(pos => ({
        ticker: pos.ticker,
        percentage: totalValue > 0 ? ((pos.currentValue || 0) / totalValue) * 100 : 0,
        value: pos.currentValue || 0,
        holdingPeriod: pos.holdingPeriod || 0
      }))
      .sort((a, b) => b.percentage - a.percentage);
  };

  const diversification = calculateDiversification();
  const avgHoldingPeriod = Math.floor(
    openPositions.reduce((sum, pos) => sum + (pos.holdingPeriod || 0), 0) / 
    (openPositions.length || 1)
  );

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

  const safeNumber = (value: number | undefined | null) => {
    return value ?? 0;
  };

  // Calculate valid percentages safely
  const getTotalReturn = () => {
    const totalReturn = safeNumber(totals?.totalReturn);
    return isFinite(totalReturn) ? totalReturn : 0;
  };

  const getPortfolioTurnover = () => {
    if (!openPositions?.length && !closedPositions?.length) return 0;
    return ((closedPositions?.length || 0) / 
           ((openPositions?.length || 0) + (closedPositions?.length || 0))) * 100;
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
                    {formatCurrency(safeNumber(totals?.unrealizedProfits))}
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>

          {/* Investment Approach Card */}
          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Investment Approach
                </div>
                <Clock className="w-5 h-5 text-primary/60" />
              </div>
              <div className="space-y-4">
                {[
                  { 
                    label: "Avg Holding Period",
                    value: `${avgHoldingPeriod} days`
                  },
                  {
                    label: "Active Positions",
                    value: openPositions?.length || 0
                  },
                  {
                    label: "Portfolio Turnover",
                    value: formatPercentage(getPortfolioTurnover())
                  },
                  {
                    label: "Avg Position Size",
                    value: formatCurrency(
                      safeNumber(metrics?.totalValue) / (openPositions?.length || 1)
                    )
                  }
                ].map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {item.label}
                    </span>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Core Holdings Card */}
          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Core Holdings
                </div>
                <Activity className="w-5 h-5 text-primary/60" />
              </div>
              <div className="space-y-4">
                {diversification.slice(0, 5).map((holding) => (
                  <div key={holding.ticker} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{holding.ticker}</span>
                    </div>
                    <div className="text-sm space-x-2">
                      <span className="font-medium">{formatPercentage(holding.percentage)}</span>
                      <span className="text-gray-400">{holding.holdingPeriod}d</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Position Analysis Card */}
          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Position Analysis
                </div>
                <BarChart3 className="w-5 h-5 text-primary/60" />
              </div>
              <div className="space-y-4">
                {[
                  { 
                    label: "Long-term Positions",
                    value: openPositions?.filter(p => (p.holdingPeriod || 0) >= 365).length || 0
                  },
                  {
                    label: "Mid-term Positions",
                    value: openPositions?.filter(p => 
                      (p.holdingPeriod || 0) >= 180 && (p.holdingPeriod || 0) < 365
                    ).length || 0
                  },
                  {
                    label: "Recent Positions",
                    value: openPositions?.filter(p => (p.holdingPeriod || 0) < 180).length || 0
                  }
                ].map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {item.label}
                    </span>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Context Card */}
          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Performance Context
                </div>
                <TrendingUp className="w-5 h-5 text-primary/60" />
              </div>
              <div className="space-y-4">
                {[
                  {
                    label: "Realized Gains",
                    value: formatCurrency(safeNumber(totals?.realizedProfits)),
                    isPositive: safeNumber(totals?.realizedProfits) >= 0
                  },
                  {
                    label: "Unrealized Gains",
                    value: formatCurrency(safeNumber(totals?.unrealizedProfits)),
                    isPositive: safeNumber(totals?.unrealizedProfits) >= 0
                  },
                  {
                    label: "Avg Hold Winners",
                    value: `${safeNumber(metrics?.avgHoldingPeriodWinners)} days`
                  }
                ].map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {item.label}
                    </span>
                    <span className={cn(
                      "text-sm font-medium",
                      'isPositive' in item
                        ? item.isPositive ? 'text-green-600' : 'text-red-600'
                        : ''
                    )}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Portfolio Health Card */}
          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Portfolio Health
                </div>
                <Shield className="w-5 h-5 text-primary/60" />
              </div>
              <div className="space-y-4">
                {[
                  {
                    label: "Concentration Risk",
                    value: formatPercentage(diversification[0]?.percentage || 0),
                    warning: (diversification[0]?.percentage || 0) > 25
                  },
                  {
                    label: "Top 3 Holdings",
                    value: formatPercentage(
                      diversification.slice(0, 3)
                        .reduce((sum, h) => sum + (h.percentage || 0), 0)
                    )
                  },
                  {
                    label: "Cash Position",
                    value: formatPercentage(
                      (safeNumber(metrics?.cashBalance) / 
                       safeNumber(metrics?.totalValue)) * 100
                    )
                  }
                ].map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {item.label}
                    </span>
                    <span className={cn(
                      "text-sm font-medium",
                      item.warning ? 'text-yellow-600' : ''
                    )}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioSummary;