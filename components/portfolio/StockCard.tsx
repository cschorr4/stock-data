import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { 
  BarChart3, Globe, ShoppingCart, Wallet, Clock, 
  ChevronUp, ChevronDown, Building2, Car, Store, 
  Cpu, Laptop, HeartPulse, Wrench, DollarSign, 
  TrendingUp, Banknote, Network
} from 'lucide-react';
import { Position, PortfolioMetrics, PortfolioTotals } from '@/lib/types';
import { formatCurrency, formatPercentage } from './utils/portfolio-utils';
import FundamentalMetricsCard from './FundamentalMetricsCard';

interface StockCardProps {
  position: Position;
  metrics: PortfolioMetrics;
  companyName?: string;
  totals?: PortfolioTotals;
}

const sectorIcons: Record<string, React.ReactNode> = {
  'Consumer Cyclical': <ShoppingCart className="w-3 h-3" />,
  'Consumer Defensive': <Store className="w-3 h-3" />,
  'Retail': <Store className="w-3 h-3" />,
  'Auto Manufacturers': <Car className="w-3 h-3" />,
  'Industrial': <Wrench className="w-3 h-3" />,
  'Manufacturing': <Wrench className="w-3 h-3" />,
  'Technology': <Cpu className="w-3 h-3" />,
  'Communications': <Network className="w-3 h-3" />,
  'Software': <Laptop className="w-3 h-3" />,
  'Financial': <Wallet className="w-3 h-3" />,
  'Banking': <Banknote className="w-3 h-3" />,
  'Investment': <TrendingUp className="w-3 h-3" />,
  'Insurance': <DollarSign className="w-3 h-3" />,
  'Real Estate': <Building2 className="w-3 h-3" />,
  'Healthcare': <HeartPulse className="w-3 h-3" />,
  'Default': <Globe className="w-3 h-3" />
};

const StockCard: React.FC<StockCardProps> = ({ position, totals }) => {
  const holdingPeriod = Math.floor((new Date().getTime() - new Date(position.buyDate).getTime()) / (1000 * 60 * 60 * 24));
  const portfolioAllocation = totals ? (position.currentValue / totals.currentValue) * 100 : 0;
  const sectorIcon = sectorIcons[position.sector] || sectorIcons.Default;
  const isPositive = position.percentChange >= 0;
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="flex-none w-[220px] xs:w-[200px] sm:w-[220px] md:w-[240px] bg-white/50 
          dark:bg-gray-900/50 rounded-xl border-0 shadow-sm transition-all duration-200 
          hover:shadow-md hover:scale-[1.02] touch-pan-x select-none cursor-pointer">
          <CardContent className="p-3">
            <div className="space-y-2">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-semibold">{position.ticker}</h3>
                  <span className={`inline-flex items-center text-xs font-medium px-1.5 py-0.5 rounded-full
                    ${isPositive ? 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20' : 
                    'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20'}`}>
                    {isPositive ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {formatPercentage(position.dayChangePercent)}
                  </span>
                </div>
                <span className="text-sm font-semibold">{formatCurrency(position.currentPrice)}</span>
              </div>

              {/* Sector and Weight */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="p-1 rounded-full bg-gray-100 dark:bg-gray-800">
                    {sectorIcon}
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">{position.sector}</span>
                </div>
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {Math.round(portfolioAllocation)}% weight
                </div>
              </div>

              {/* Position Details Grid */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Position</p>
                  <div className="flex items-center gap-1">
                    <BarChart3 className="w-3 h-3 text-gray-400" />
                    <span className="text-xs font-medium">{position.shares} shares</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Avg Cost</p>
                  <p className="text-xs font-medium">{formatCurrency(position.avgCost)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Hold Time</p>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-xs font-medium">{holdingPeriod}d</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Total Return</p>
                  <p className={`text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(position.percentChange)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                {position.ticker}
                <span className="text-sm font-normal text-gray-500">
                  {position.sector}
                </span>
              </h2>
              <p className="text-sm text-gray-500">Fundamental Analysis</p>
            </div>
            <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
              {sectorIcon}
            </div>
          </div>
          <FundamentalMetricsCard position={position} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StockCard;