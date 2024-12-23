import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { cn } from '@/lib/utils';
import { PortfolioSummaryProps, Position } from '@/lib/types';
import { TrendingUp, PieChart, Clock, Activity, BarChart3, Shield } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({
  metrics,
  totals,
  openPositions,
  closedPositions
}) => {
  const calculateHoldingPeriod = (position: Position): number => {
    const buyDate = new Date(position.buyDate);
    const today = new Date();
    return Math.floor((today.getTime() - buyDate.getTime()) / (1000 * 60 * 60 * 24));
  };

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

  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardHeader className="border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-gray-500" />
          <CardTitle>Portfolio Overview</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Use Swiper for Mobile */}
        <div className="block md:hidden">
          <Swiper spaceBetween={16} slidesPerView={1.1}>
            {[
              { title: "Total Portfolio Value", icon: PieChart, content: formatCurrency(metrics?.totalValue) },
              { title: "Avg Holding Period", icon: Clock, content: `${avgHoldingPeriod} days` },
              { title: "Core Holdings", icon: Activity, content: diversification.slice(0, 3).map(h => h.ticker).join(', ') },
            ].map((item, index) => (
              <SwiperSlide key={index}>
                <Card className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <item.icon className="w-5 h-5 text-primary/60" />
                      <div className="font-medium text-gray-600">{item.title}</div>
                    </div>
                    <div className="text-xl font-bold">{item.content}</div>
                  </CardContent>
                </Card>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Grid for Desktop */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Portfolio Value Card */}
          <Card className="border-2">
            <CardContent className="p-6">
              <div className="text-xl font-bold">
                {formatCurrency(safeNumber(metrics?.totalValue))}
              </div>
              <div className="text-sm text-gray-500">
                Total Portfolio Value
              </div>
            </CardContent>
          </Card>

          {/* Core Holdings */}
          <Card className="border-2">
            <CardContent className="p-6">
              <div className="text-xl font-bold">{diversification.slice(0, 3).map(h => h.ticker).join(', ')}</div>
              <div className="text-sm text-gray-500">
                Core Holdings
              </div>
            </CardContent>
          </Card>

          {/* Add more cards as needed */}
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioSummary;
