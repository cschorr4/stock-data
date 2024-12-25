import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Position, PortfolioMetrics } from '@/lib/types';
import { formatCurrency, formatPercentage } from './utils/portfolio-utils';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';

interface StockCardProps {
  position: Position;
  metrics: PortfolioMetrics;
}

const StockCard: React.FC<StockCardProps> = ({ position }) => {
  const isPositive = position.percentChange >= 0;
  const dayChangeColor = getDayChangeColor(position.dayChangePercent);
  
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Card className="w-[280px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 transition-all duration-200 hover:scale-105 cursor-pointer">
          <CardHeader className="p-3 pb-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">{position.ticker}</h3>
                {isPositive ? 
                  <ArrowUpRight className="w-4 h-4 text-green-500" /> : 
                  <ArrowDownRight className="w-4 h-4 text-red-500" />
                }
              </div>
              <div className={`h-2 w-2 rounded-full ${dayChangeColor}`} />
            </div>
          </CardHeader>
          <CardContent className="p-3">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-base font-medium">{formatCurrency(position.currentPrice)}</span>
                <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(position.percentChange)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <div className="flex flex-col">
                  <span className="text-gray-600 dark:text-gray-400">Shares: {position.shares}</span>
                  <span className="text-gray-600 dark:text-gray-400">Avg: {formatCurrency(position.avgCost)}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-gray-600 dark:text-gray-400">Value: {formatCurrency(position.currentValue)}</span>
                  <span className={position.dollarChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                    P/L: {formatCurrency(position.dollarChange)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">{position.ticker} Details</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Sector: {position.sector}</p>
              <p className="text-gray-600 dark:text-gray-400">Industry: {position.industry}</p>
              {position.peRatio && <p className="text-gray-600 dark:text-gray-400">P/E: {position.peRatio.toFixed(2)}</p>}
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Day Range:</p>
              <p className="text-gray-600 dark:text-gray-400">
                {formatCurrency(position.dayLow || 0)} - {formatCurrency(position.dayHigh || 0)}
              </p>
              <p className="text-gray-600 dark:text-gray-400">Volume: {position.volume?.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

const getDayChangeColor = (changePercent: number): string => {
  if (changePercent > 1) return "bg-green-500";
  if (changePercent > 0) return "bg-green-300";
  if (changePercent > -1) return "bg-red-300";
  return "bg-red-500";
};

export default StockCard;