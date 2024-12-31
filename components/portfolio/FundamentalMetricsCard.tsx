import React from 'react';
import { TrendingUp, BarChart2, DollarSign, Briefcase, Scale } from 'lucide-react';
import { Position } from '@/lib/types';

interface FundamentalMetricsCardProps {
  position: Position;
}

const formatLargeNumber = (value: number | undefined): string => {
  if (value === undefined || value === null) return 'N/A';
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  return value.toFixed(2);
};

const formatMetric = (value: number | undefined): string => {
  if (value === undefined || value === null) return 'N/A';
  return value.toLocaleString('en-US', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  });
};

const MetricItem: React.FC<{
  label: string;
  value: string | number | undefined;
  format?: 'number' | 'large' | 'percentage';
  color?: boolean;
}> = ({ label, value, format = 'number', color = false }) => {
  let displayValue = 'N/A';
  let colorClass = '';

  if (value !== undefined && value !== null) {
    if (format === 'large') {
      displayValue = formatLargeNumber(value as number);
    } else if (format === 'percentage') {
      displayValue = `${(value as number) > 0 ? '+' : ''}${formatMetric(value as number)}%`;
      colorClass = (value as number) > 0 ? 'text-green-600' : 'text-red-600';
    } else {
      displayValue = formatMetric(value as number);
    }
  }

  return (
    <div className="flex flex-col">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-2xl font-semibold ${color ? colorClass : ''}`}>
        {displayValue}
      </span>
    </div>
  );
};

const FundamentalMetricsCard: React.FC<FundamentalMetricsCardProps> = ({ position }) => {
  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Valuation */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-lg text-gray-700 dark:text-gray-300">
          <TrendingUp className="w-5 h-5" />
          <h3>Valuation</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <MetricItem label="P/E Ratio" value={position.peRatio} />
          <MetricItem label="Forward P/E" value={position.forwardPE} />
          <MetricItem 
            label="Market Cap" 
            value={position.marketCap} 
            format="large" 
          />
        </div>
      </section>

      {/* Market Metrics */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-lg text-gray-700 dark:text-gray-300">
          <BarChart2 className="w-5 h-5" />
          <h3>Market Metrics</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <MetricItem label="Beta" value={position.beta} />
          <MetricItem label="Industry P/E" value={position.industryPE} />
          {position.dividendYield && (
            <MetricItem 
              label="Dividend Yield" 
              value={position.dividendYield} 
              format="percentage" 
            />
          )}
        </div>
      </section>

      {/* Performance */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-lg text-gray-700 dark:text-gray-300">
          <Scale className="w-5 h-5" />
          <h3>Performance</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <MetricItem 
            label="vs S&P 500" 
            value={position.spyReturn} 
            format="percentage"
            color
          />
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Industry</span>
            <span className="text-xl font-medium">
              {position.industry || 'N/A'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Sector</span>
            <span className="text-xl font-medium">
              {position.sector || 'N/A'}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FundamentalMetricsCard;