import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  BarChart3, Globe, ShoppingCart, Wallet, Clock, 
  ChevronUp, ChevronDown, Building2, Car, Store, 
  Cpu, Laptop, HeartPulse, Wrench, DollarSign, 
  TrendingUp, Banknote, Network
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
  'Consumer Cyclical': <ShoppingCart className="w-4 h-4" />,
  'Consumer Defensive': <Store className="w-4 h-4" />,
  'Retail': <Store className="w-4 h-4" />,
  'Auto Manufacturers': <Car className="w-4 h-4" />,
  'Industrial': <Wrench className="w-4 h-4" />,
  'Manufacturing': <Wrench className="w-4 h-4" />,
  'Technology': <Cpu className="w-4 h-4" />,
  'Communications': <Network className="w-4 h-4" />,
  'Software': <Laptop className="w-4 h-4" />,
  'Financial': <Wallet className="w-4 h-4" />,
  'Banking': <Banknote className="w-4 h-4" />,
  'Investment': <TrendingUp className="w-4 h-4" />,
  'Insurance': <DollarSign className="w-4 h-4" />,
  'Real Estate': <Building2 className="w-4 h-4" />,
  'Healthcare': <HeartPulse className="w-4 h-4" />,
  'Default': <Globe className="w-4 h-4" />
};

const StockCard: React.FC<StockCardProps> = ({ position, totals }) => {
  const holdingPeriod = Math.floor((new Date().getTime() - new Date(position.buyDate).getTime()) / (1000 * 60 * 60 * 24));
  const portfolioAllocation = totals ? (position.currentValue / totals.currentValue) * 100 : 0;
  const sectorIcon = sectorIcons[position.sector] || sectorIcons.Default;
  const isPositive = position.percentChange >= 0;
  
  return (
    <Card className="flex-none w-[calc(100vw-2rem)] sm:w-72 bg-white/50 dark:bg-gray-900/50 
      rounded-xl border-0 shadow-sm transition-all duration-200 hover:shadow-md 
      touch-pan-x select-none">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{position.ticker}</h3>
              <span className={`inline-flex items-center text-sm font-medium px-2 py-0.5 rounded-full
                ${isPositive ? 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20' : 
                'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20'}`}>
                {isPositive ? <ChevronUp className="w-3 h-3 mr-0.5" /> : <ChevronDown className="w-3 h-3 mr-0.5" />}
                {formatPercentage(position.dayChangePercent)}
              </span>
            </div>
            <span className="text-lg font-semibold">{formatCurrency(position.currentPrice)}</span>
          </div>

          {/* Sector and Weight */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
                {sectorIcon}
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">{position.sector}</span>
            </div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {Math.round(portfolioAllocation)}% weight
            </div>
          </div>

          {/* Position Details Grid */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Position</p>
              <div className="flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium">{position.shares} shares</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Avg Cost</p>
              <p className="text-sm font-medium">{formatCurrency(position.avgCost)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Hold Time</p>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium">{holdingPeriod}d</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Return</p>
              <p className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(position.percentChange)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockCard;