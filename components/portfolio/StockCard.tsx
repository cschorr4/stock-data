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
  Building,
  Car,
  Store,
  Plane,
  Factory,
  Cpu,
  Pill,
  Wrench,
  Gem,
  Radio,
  Wheat,
  Trees,
  Flask,
  Shield,
  DollarSign,
  TrendingUp,
  Banknote,
  Network,
  Scale
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
  'Consumer Defensive': <Shield className="w-4 h-4" />,
  'Retail': <Store className="w-4 h-4" />,
  
  // Industrial & Manufacturing
  'Auto Manufacturers': <Car className="w-4 h-4" />,
  'Aerospace': <Plane className="w-4 h-4" />,
  'Industrial': <Factory className="w-4 h-4" />,
  'Manufacturing': <Wrench className="w-4 h-4" />,
  
  // Technology
  'Technology': <Cpu className="w-4 h-4" />,
  'Communications': <Radio className="w-4 h-4" />,
  'Networking': <Network className="w-4 h-4" />,
  
  // Financial Services
  'Financial': <Wallet className="w-4 h-4" />,
  'Banking': <Banknote className="w-4 h-4" />,
  'Investment': <TrendingUp className="w-4 h-4" />,
  'Insurance': <DollarSign className="w-4 h-4" />,
  
  // Healthcare & Basic Materials
  'Healthcare': <Pill className="w-4 h-4" />,
  'Biotechnology': <Flask className="w-4 h-4" />,
  'Basic Materials': <Gem className="w-4 h-4" />,
  
  // Natural Resources
  'Agriculture': <Wheat className="w-4 h-4" />,
  'Forestry': <Trees className="w-4 h-4" />,
  
  'Default': <Globe className="w-4 h-4" />
};

const metricIcons = {
  shares: <BarChart3 className="w-4 h-4" />,
  holdingPeriod: <Clock className="w-4 h-4" />,
  pe: <Scale className="w-4 h-4" />,
  positive: <ChevronUp className="w-4 h-4 text-green-500" />,
  negative: <ChevronDown className="w-4 h-4 text-red-500" />
};

const StockCard: React.FC<StockCardProps> = ({ position, totals }) => {
  const performanceClass = getPerformanceClass(position.percentChange);
  const holdingPeriod = Math.floor((new Date().getTime() - new Date(position.buyDate).getTime()) / (1000 * 60 * 60 * 24));
  const portfolioAllocation = totals ? (position.currentValue / totals.currentValue) * 100 : 0;
  const sectorIcon = sectorIcons[position.sector] || sectorIcons.Default;
  const trendIcon = position.percentChange >= 0 ? metricIcons.positive : metricIcons.negative;

  // Calculate PE ratio comparison percentages
  const maxPE = Math.max(position.peRatio || 0, position.industryPE || 0);
  const stockPEPercent = ((position.peRatio || 0) / maxPE) * 100;
  const industryPEPercent = ((position.industryPE || 0) / maxPE) * 100;
  
  return (
    <Card className="w-[300px] relative overflow-hidden bg-white dark:bg-gray-900">
      <CardContent className="p-4">
        <div className="space-y-3">
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

          {/* PE Ratio Comparison */}
          {position.peRatio && position.industryPE && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  {metricIcons.pe}
                  <span>PE Ratio Comparison</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-14">Stock</span>
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 dark:bg-blue-400 rounded-full"
                      style={{ width: `${stockPEPercent}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 w-12 text-right">
                    {position.peRatio.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-14">Industry</span>
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gray-400 dark:bg-gray-600 rounded-full"
                      style={{ width: `${industryPEPercent}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 w-12 text-right">
                    {position.industryPE.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const getPerformanceClass = (percentChange: number) => {
  if (percentChange >= 10) return {
    pattern: 'bg-white dark:bg-gray-900',
    backgroundPattern: `repeating-linear-gradient(
      45deg,
      transparent,
      transparent 10px,
      rgba(0,0,0,0.05) 10px,
      rgba(0,0,0,0.05) 20px
    )`,
    percentChange
  };
  if (percentChange > 0) return {
    pattern: 'bg-white dark:bg-gray-900',
    backgroundPattern: `repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 8px,
      rgba(0,0,0,0.03) 8px,
      rgba(0,0,0,0.03) 16px
    )`,
    percentChange
  };
  if (percentChange > -10) return {
    pattern: 'bg-white dark:bg-gray-900',
    backgroundPattern: `repeating-linear-gradient(
      90deg,
      transparent,
      transparent 8px,
      rgba(0,0,0,0.03) 8px,
      rgba(0,0,0,0.03) 16px
    )`,
    percentChange
  };
  return {
    pattern: 'bg-white dark:bg-gray-900',
    backgroundPattern: `repeating-linear-gradient(
      0deg,
      transparent,
      transparent 8px,
      rgba(0,0,0,0.05) 8px,
      rgba(0,0,0,0.05) 16px
    )`,
    percentChange
  };
};

export default StockCard;