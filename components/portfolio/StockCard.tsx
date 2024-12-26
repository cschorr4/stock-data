import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  BarChart3,
  Globe,
  ShoppingCart,
  Wallet,
  Clock,
  ChevronUp,
  ChevronDown,
  Building2,
  Car,
  Store,
  Cpu,
  Laptop,
  HeartPulse,
  Wrench,
  DollarSign,
  TrendingUp,
  Banknote,
  Network
} from 'lucide-react';
import { Position, PortfolioMetrics, PortfolioTotals } from '@/lib/types';
import { formatCurrency, formatPercentage } from './utils/portfolio-utils';

interface StockCardProps {
  position: Position;
  metrics: PortfolioMetrics;
  companyName?: string;
  totals?: PortfolioTotals;
}

const sectorIcons: Record<string, React.ReactNode> = {
  // Consumer Sectors
  'Consumer Cyclical': <ShoppingCart className="w-4 h-4" />,
  'Consumer Defensive': <Store className="w-4 h-4" />,
  'Retail': <Store className="w-4 h-4" />,
  
  // Industrial & Manufacturing
  'Auto Manufacturers': <Car className="w-4 h-4" />,
  'Industrial': <Wrench className="w-4 h-4" />,
  'Manufacturing': <Wrench className="w-4 h-4" />,
  
  // Technology
  'Technology': <Cpu className="w-4 h-4" />,
  'Communications': <Network className="w-4 h-4" />,
  'Software': <Laptop className="w-4 h-4" />,
  
  // Financial Services
  'Financial': <Wallet className="w-4 h-4" />,
  'Banking': <Banknote className="w-4 h-4" />,
  'Investment': <TrendingUp className="w-4 h-4" />,
  'Insurance': <DollarSign className="w-4 h-4" />,
  
  // Real Estate
  'Real Estate': <Building2 className="w-4 h-4" />,
  
  // Healthcare
  'Healthcare': <HeartPulse className="w-4 h-4" />,
  
  'Default': <Globe className="w-4 h-4" />
};

const metricIcons = {
  shares: <BarChart3 className="w-4 h-4" />,
  holdingPeriod: <Clock className="w-4 h-4" />,
  positive: <ChevronUp className="w-4 h-4 text-green-500" />,
  negative: <ChevronDown className="w-4 h-4 text-red-500" />
};

const StockCard: React.FC<StockCardProps> = ({ position, totals }) => {
  const holdingPeriod = Math.floor((new Date().getTime() - new Date(position.buyDate).getTime()) / (1000 * 60 * 60 * 24));
  const portfolioAllocation = totals ? (position.currentValue / totals.currentValue) * 100 : 0;
  const sectorIcon = sectorIcons[position.sector] || sectorIcons.Default;
  const trendIcon = position.percentChange >= 0 ? metricIcons.positive : metricIcons.negative;
  
  return (
    <Card className="w-[300px] h-[180px] relative overflow-hidden bg-white dark:bg-gray-900">
      <CardContent className="p-4 h-full">
        <div className="h-full flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {trendIcon}
              <h3 className="text-lg font-bold">{position.ticker}</h3>
              <div className="px-2 py-0.5 rounded text-xs font-medium bg-black/5 dark:bg-white/5">
                {formatPercentage(position.dayChangePercent)} today
              </div>
            </div>
            <span className="text-lg font-semibold">{formatCurrency(position.currentPrice)}</span>
          </div>

          {/* Sector & Position Info */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              {sectorIcon}
              <span>{position.sector}</span>
            </div>
            <div className="text-right">
              <div className="relative w-8 h-8 ml-auto">
                <svg viewBox="0 0 36 36" className="w-full h-full">
                  <circle
                    cx="18"
                    cy="18"
                    r="15.91549430918954"
                    fill="transparent"
                    stroke="#e5e7eb"
                    strokeWidth="3"
                    className="dark:stroke-gray-700"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.91549430918954"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={`${portfolioAllocation} ${100 - portfolioAllocation}`}
                    strokeDashoffset="25"
                    className="text-blue-500 dark:text-blue-400"
                  />
                  <text
                    x="18"
                    y="18"
                    textAnchor="middle"
                    dy=".3em"
                    className="text-xs font-medium fill-gray-600 dark:fill-gray-400"
                  >
                    {Math.round(portfolioAllocation)}%
                  </text>
                </svg>
              </div>
            </div>
          </div>

          {/* Position Details */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              {metricIcons.shares}
              <span>{position.shares} shares</span>
            </div>
            <div className="text-right text-gray-600 dark:text-gray-400">
              Avg: {formatCurrency(position.avgCost)}
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              {metricIcons.holdingPeriod}
              <span>{holdingPeriod}d held</span>
            </div>
            <div className="text-right font-medium">
              P/L: {formatPercentage(position.percentChange)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockCard;