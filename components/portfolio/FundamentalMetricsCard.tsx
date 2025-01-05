import React, { useState, useEffect } from 'react';
import { TrendingUp, BarChart2, Scale } from 'lucide-react';
import { Position } from '@/lib/types';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, ReferenceLine } from 'recharts';

interface FundamentalMetricsCardProps {
  position: Position;
}

interface ChartDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface IndexPerformance {
  date: string;
  displayDate: string;
  [key: string]: number | string;
}

interface ETFMapping {
  [key: string]: string;
}

interface InitialPrices {
  [key: string]: number;
}

interface LineColors {
  [key: string]: string;
}

interface MetricItemProps {
  label: string;
  value: number | undefined;
  format?: 'currency' | 'percentage';
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
  symbol: string;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const formatPercentage = (value: number): string => {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
};

const MetricItem: React.FC<MetricItemProps> = ({ label, value, format = 'currency' }) => {
  if (value === undefined) return null;

  let displayValue = 'N/A';
  let colorClass = '';

  if (format === 'currency') {
    displayValue = formatCurrency(value);
  } else if (format === 'percentage') {
    displayValue = formatPercentage(value);
    colorClass = value > 0 ? 'text-green-500' : 'text-red-500';
  }

  return (
    <div className="flex flex-col">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-2xl font-semibold ${colorClass}`}>
        {displayValue}
      </span>
    </div>
  );
};

// Get sector and industry ETFs based on position
const getRelatedETFs = (sector: string, industry: string): string[] => {
  const sectorETFs: ETFMapping = {
    'Technology': 'XLK',
    'Healthcare': 'XLV',
    'Financial': 'XLF',
    'Consumer Cyclical': 'XLY',
    'Consumer Defensive': 'XLP',
    'Energy': 'XLE',
    'Industrial': 'XLI',
    'Basic Materials': 'XLB',
    'Real Estate': 'XLRE',
    'Utilities': 'XLU',
    'Communication Services': 'XLC'
  };

  const industryETFs: ETFMapping = {
    'Semiconductors': 'SOXX',
    'Software': 'IGV',
    'Banks': 'KBE',
    'Biotechnology': 'IBB',
    'Retail': 'XRT',
    'Aerospace & Defense': 'ITA',
    'Auto Manufacturers': 'CARZ'
  };

  const etfs: string[] = [];
  if (sectorETFs[sector]) etfs.push(sectorETFs[sector]);
  if (industryETFs[industry]) etfs.push(industryETFs[industry]);
  return etfs;
};

const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
        <p className="text-base font-medium mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p 
            key={index} 
            className="text-sm mb-1"
            style={{ color: entry.color }}
          >
            {entry.name}: {formatPercentage(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const FundamentalMetricsCard: React.FC<FundamentalMetricsCardProps> = ({ position }) => {
  const [performanceData, setPerformanceData] = useState<IndexPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get related ETFs
        const relatedETFs = getRelatedETFs(position.sector, position.industry);
        const symbolsToFetch = [position.ticker, 'SPY', ...relatedETFs];
        
        // Fetch data for all symbols
        const responses = await Promise.all(
          symbolsToFetch.map(symbol => 
            fetch(`/api/stock/chart?symbol=${symbol}&range=1Y`)
          )
        );

        const datasets = await Promise.all(
          responses.map(response => response.json())
        );

        // Calculate percentage changes from initial price
        const processedData: IndexPerformance[] = [];
        const [stockData, spyData, ...etfData] = datasets;

        // Find YTD start index
        const ytdStartDate = `${new Date().getFullYear()}-01-01`;

        // Initialize starting prices
        const initialPrices: InitialPrices = symbolsToFetch.reduce((acc, symbol, index) => ({
          ...acc,
          [symbol]: datasets[index][0]?.close || 0
        }), {});

        stockData.forEach((point: ChartDataPoint, index: number) => {
          const dataPoint: IndexPerformance = {
            date: point.date,
            displayDate: formatDate(point.date),
          };

          // Calculate percentage changes
          symbolsToFetch.forEach((symbol, i) => {
            const currentPrice = datasets[i][index]?.close;
            const initialPrice = initialPrices[symbol];
            if (currentPrice && initialPrice) {
              const percentChange = ((currentPrice - initialPrice) / initialPrice) * 100;
              dataPoint[symbol] = percentChange;
            }
          });

          processedData.push(dataPoint);
        });

        setPerformanceData(processedData);
      } catch (err) {
        console.error('Error fetching performance data:', err);
        setError('Failed to load performance data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPerformanceData();
  }, [position.ticker, position.sector, position.industry]);

  // Get related ETFs for legend
  const relatedETFs = getRelatedETFs(position.sector, position.industry);

  const lineColors: LineColors = {
    [position.ticker]: '#6366f1',
    'SPY': '#94a3b8',
    [relatedETFs[0]]: '#2dd4bf',
    [relatedETFs[1]]: '#f59e0b'
  };

  const ytdDate = `${new Date().getFullYear()}-01-01`;

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-8">
      {/* Performance Chart */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 text-lg text-gray-700 dark:text-gray-300">
          <BarChart2 className="w-5 h-5" />
          <h3>Relative Performance (1Y)</h3>
        </div>
        <div className="h-72 w-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <XAxis
                  dataKey="displayDate"
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  interval="preserveStartEnd"
                  tickLine={false}
                  stroke="#94a3b8"
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  tickFormatter={(value) => `${value}%`}
                  tickLine={false}
                  axisLine={false}
                  stroke="#94a3b8"
                />
                <Tooltip content={<CustomTooltip symbol={position.ticker} />} />
                <Legend 
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                />
                <ReferenceLine
                  x={formatDate(ytdDate)}
                  stroke="#94a3b8"
                  strokeDasharray="3 3"
                  label={{ value: 'YTD', position: 'insideTopRight', fill: '#94a3b8' }}
                />
                <Line
                  type="monotone"
                  name={position.ticker}
                  dataKey={position.ticker}
                  stroke={lineColors[position.ticker]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  name="S&P 500"
                  dataKey="SPY"
                  stroke={lineColors['SPY']}
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="5 5"
                />
                {relatedETFs.map((etf, index) => (
                  <Line
                    key={etf}
                    type="monotone"
                    name={`${index === 0 ? position.sector : position.industry} Index`}
                    dataKey={etf}
                    stroke={lineColors[etf]}
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="3 3"
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* Valuation */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-lg text-gray-700 dark:text-gray-300">
          <TrendingUp className="w-5 h-5" />
          <h3>Valuation</h3>
        </div>
        <div className="grid grid-cols-3 gap-8">
          <MetricItem 
            label="Current Price" 
            value={position.currentPrice} 
          />
          <MetricItem 
            label="Average Cost" 
            value={position.avgCost}
          />
          <MetricItem 
            label="Return" 
            value={position.percentChange}
            format="percentage"
          />
        </div>
      </section>

      {/* Company Info */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-lg text-gray-700 dark:text-gray-300">
          <Scale className="w-5 h-5" />
          <h3>Company Info</h3>
        </div>
        <div className="grid grid-cols-2 gap-8">
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