'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, BarChart2, Scale } from 'lucide-react';
import { Position } from '@/lib/types';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
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

const getRelatedETFs = (sector: string, industry: string): string[] => {
  const etfs: string[] = [];
  if (sectorETFs[sector]) etfs.push(sectorETFs[sector]);
  if (industryETFs[industry]) etfs.push(industryETFs[industry]);
  return etfs;
};

const FundamentalMetricsCard: React.FC<FundamentalMetricsCardProps> = ({ position }) => {
  const [performanceData, setPerformanceData] = useState<IndexPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const relatedETFs = useMemo(() => 
    getRelatedETFs(position.sector, position.industry),
    [position.sector, position.industry]
  );

  const lineColors = useMemo(() => ({
    [position.ticker]: '#6366f1',
    'SPY': '#94a3b8',
    [relatedETFs[0]]: '#2dd4bf',
    [relatedETFs[1]]: '#f59e0b'
  }), [position.ticker, relatedETFs]);

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const symbolsToFetch = [position.ticker, 'SPY', ...relatedETFs];
        
        // Fetch data for all symbols
        const responses = await Promise.all(
          symbolsToFetch.map(symbol => 
            fetch(`/api/stock/chart?symbol=${symbol}&range=1Y`)
              .then(response => {
                if (!response.ok) {
                  throw new Error(`Failed to fetch data for ${symbol}`);
                }
                return response.json();
              })
          )
        );

        // Process the first dataset (stock data)
        const stockData = responses[0];
        
        // Initialize starting prices for percentage calculations
        const initialPrices: InitialPrices = {};
        symbolsToFetch.forEach((symbol, index) => {
          if (responses[index]?.[0]?.close) {
            initialPrices[symbol] = responses[index][0].close;
          }
        });

        // Process all datasets into unified performance data
        const processedData: IndexPerformance[] = stockData.map((point: ChartDataPoint, index: number) => {
          const dataPoint: IndexPerformance = {
            date: point.date,
            displayDate: formatDate(point.date),
          };

          // Calculate percentage changes for all symbols
          symbolsToFetch.forEach((symbol, i) => {
            const currentPrice = responses[i]?.[index]?.close;
            const initialPrice = initialPrices[symbol];
            if (currentPrice && initialPrice) {
              const percentChange = ((currentPrice - initialPrice) / initialPrice) * 100;
              dataPoint[symbol] = percentChange;
            }
          });

          return dataPoint;
        });

        setPerformanceData(processedData);
      } catch (err) {
        console.error('Error fetching performance data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load performance data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPerformanceData();
  }, [position.ticker, relatedETFs]);

  const ytdDate = `${new Date().getFullYear()}-01-01`;

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Performance Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-72 text-red-500">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Fundamental Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
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
                <LineChart 
                  data={performanceData} 
                  margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                >
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
                    label={{ 
                      value: 'YTD', 
                      position: 'insideTopRight', 
                      fill: '#94a3b8' 
                    }}
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
      </CardContent>
    </Card>
  );
};

export default FundamentalMetricsCard;