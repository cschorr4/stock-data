import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChartControls } from './ChartControls';
import { Transaction } from '@/lib/types'

interface Position {
  ticker: string;
  buyDate: string;
  sellDate?: string;
}

interface StockDataPoint {
  date: string;
  close?: number;
  price?: number;
}

interface ChartDataPoint {
  date: string;
  [key: string]: number | string | undefined;
}

interface ProcessedDataPoint extends ChartDataPoint {
  SPY?: number;
}

interface TickerData {
  ticker: string;
  data: StockDataPoint[];
}
interface PositionTimelineChartProps {
  transactions: Transaction[];
  openPositions: Position[];
  closedPositions: Position[];
}

const PositionTimelineChart: React.FC<PositionTimelineChartProps> = ({
  openPositions,
  closedPositions
}) => {
  const [timeRange, setTimeRange] = useState('6M');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPercentage, setShowPercentage] = useState(false);
  const [selectedTickers, setSelectedTickers] = useState<string[]>(['SPY']);
  const [allTickers, setAllTickers] = useState<string[]>(['SPY']);
  const [chartData, setChartData] = useState<ProcessedDataPoint[]>([]);

  const getBaselineValues = (data: ProcessedDataPoint[], tickers: string[]): Record<string, number> => {
    const baselines: Record<string, number> = {};
    tickers.forEach(ticker => {
      const firstPoint = data.find(point => 
        point[`${ticker}_base`] !== undefined || 
        point[`${ticker}_closed`] !== undefined || 
        point[`${ticker}_open`] !== undefined || 
        point[ticker] !== undefined
      );
      if (firstPoint) {
        const value = firstPoint[`${ticker}_base`] || 
                     firstPoint[`${ticker}_closed`] || 
                     firstPoint[`${ticker}_open`] || 
                     firstPoint[ticker];
        if (typeof value === 'number') {
          baselines[ticker] = value;
        }
      }
    });
    return baselines;
  };

  useEffect(() => {
    const uniqueTickers = Array.from(new Set([
      ...openPositions.map(p => p.ticker),
      ...closedPositions.map(p => p.ticker),
      'SPY'
    ]));
    setAllTickers(uniqueTickers);
  }, [openPositions, closedPositions]);

  const handleTickerSelect = (ticker: string) => {
    if (ticker === 'SPY') return;
    setSelectedTickers(current =>
      current.includes(ticker)
        ? current.filter(t => t !== ticker)
        : [...current, ticker]
    );
  };

  useEffect(() => {
    const fetchStockData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const uniqueTickers = new Set([...selectedTickers]);
        if (!uniqueTickers.has('SPY')) uniqueTickers.add('SPY');
        const tickers = Array.from(uniqueTickers);

        if (tickers.length === 0) {
          setChartData([]);
          setIsLoading(false);
          return;
        }

        const tickerDataPromises = tickers.map(async ticker => {
          try {
            const response = await fetch(`/api/stock/chart?symbol=${ticker}&range=${timeRange}`);
            if (!response.ok) throw new Error(`Failed to fetch data for ${ticker}`);
            const data = await response.json();
            return { ticker, data: data.error ? [] : data } as TickerData;
          } catch (err) {
            console.error(`Error fetching ${ticker}:`, err);
            return { ticker, data: [] } as TickerData;
          }
        });

        const results = await Promise.all(tickerDataPromises);
        
        const allDates = new Set<string>();
        results.forEach(({ data }) => {
          data.forEach((point: StockDataPoint) => allDates.add(point.date));
        });

        const initialProcessedData = Array.from(allDates).sort().map(date => {
          const point: ChartDataPoint = { date };
          const dateObj = new Date(date);

          results.forEach(({ ticker, data }) => {
            const dataPoint = data.find((p: StockDataPoint) => p.date === date);
            if (!dataPoint) return;

            const value = dataPoint.close ?? dataPoint.price;
            if (value === undefined) return;

            if (ticker === 'SPY') {
              point[ticker] = value;
            } else {
              point[`${ticker}_base`] = value;

              const isInClosedPeriod = closedPositions.some(position => {
                if (position.ticker !== ticker) return false;
                const buyDate = new Date(position.buyDate);
                const sellDate = position.sellDate ? new Date(position.sellDate) : new Date();
                return dateObj >= buyDate && dateObj <= sellDate;
              });

              const isInOpenPeriod = openPositions.some(position => {
                if (position.ticker !== ticker) return false;
                const buyDate = new Date(position.buyDate);
                return dateObj >= buyDate;
              });

              if (isInClosedPeriod) {
                point[`${ticker}_closed`] = value;
              }
              if (isInOpenPeriod) {
                point[`${ticker}_open`] = value;
              }
            }
          });

          return point;
        });

        const baselines = getBaselineValues(initialProcessedData, tickers);
        const processedData = initialProcessedData.map(point => {
          const newPoint: ChartDataPoint = { date: point.date };
          Object.entries(point).forEach(([key, value]) => {
            if (key === 'date') return;
            
            if (typeof value === 'number') {
              const ticker = key.split('_')[0];
              if (showPercentage && baselines[ticker]) {
                newPoint[key] = ((value - baselines[ticker]) / baselines[ticker]) * 100;
              } else {
                newPoint[key] = value;
              }
            }
          });
          return newPoint;
        });

        setChartData(processedData);
      } catch (error) {
        console.error('Error processing chart data:', error);
        setError('Failed to load chart data');
      }
      
      setIsLoading(false);
    };

    fetchStockData();
  }, [timeRange, selectedTickers, showPercentage, openPositions, closedPositions]);

  const getTickerColor = (ticker: string): string => {
    const colors: Record<string, string> = {
      SPY: '#888888',
      AAPL: '#2563eb',
      LLY: '#dc2626'
    };
    return colors[ticker] || '#16a34a';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Position Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            Loading chart data...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Position Timeline</CardTitle>
        <ChartControls
          allTickers={allTickers}
          selectedTickers={selectedTickers}
          showPercentage={showPercentage}
          timeRange={timeRange}
          onTickerSelect={handleTickerSelect}
          onShowPercentageChange={setShowPercentage}
          onTimeRangeChange={setTimeRange}
        />
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No position data to display
          </div>
        ) : (
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date"
                  tickFormatter={(date) => format(new Date(date), 'MMM d')}
                  angle={-45}
                  textAnchor="end"
                  height={50}
                  interval="preserveStartEnd"
                  stroke="#000000"
                  strokeWidth={2}
                  tick={{ fontSize: 12, fontWeight: 500 }}
                  label={{ 
                    value: 'Date',
                    position: 'bottom',
                    offset: 0,
                    style: { textAnchor: 'middle', fontWeight: 600 }
                  }}
                />
                <YAxis 
                  tickFormatter={(value) => 
                    showPercentage 
                      ? `${value.toFixed(1)}%` 
                      : `$${value.toFixed(2)}`
                  }
                  domain={['auto', 'auto']}
                  stroke="#000000"
                  strokeWidth={2}
                  tick={{ fontSize: 12, fontWeight: 500 }}
                  label={{
                    value: showPercentage ? 'Change (%)' : 'Price ($)',
                    angle: -90,
                    position: 'insideLeft',
                    offset: 0,
                    style: { textAnchor: 'middle', fontWeight: 600 }
                  }}
                />
                <Tooltip
                  labelFormatter={(label) => format(new Date(label), 'PPP')}
                  formatter={(value, name: string | number) => {
                    const nameStr = String(name);
                    const displayName = nameStr.replace(/_closed|_open|_base/, '');
                    const type = nameStr.includes('_open') ? ' (Open)' : 
                               nameStr.includes('_closed') ? ' (Closed)' : '';
                    return [
                      showPercentage 
                        ? `${Number(value).toFixed(1)}%` 
                        : `${Number(value).toFixed(2)}`,
                      displayName + type
                    ];
                  }}
                />
                
                <Line
                  type="monotone"
                  dataKey="SPY"
                  stroke="#888888"
                  strokeWidth={1}
                  dot={false}
                  connectNulls={true}
                />
                
                {selectedTickers.filter(ticker => ticker !== 'SPY').map((ticker) => (
                  <React.Fragment key={ticker}>
                    <Line
                      type="monotone"
                      dataKey={`${ticker}_base`}
                      stroke={getTickerColor(ticker)}
                      strokeWidth={1}
                      strokeDasharray="3 3"
                      dot={false}
                      connectNulls={true}
                    />
                    <Line
                      type="monotone"
                      dataKey={`${ticker}_closed`}
                      stroke={getTickerColor(ticker)}
                      strokeWidth={2}
                      dot={false}
                      connectNulls={false}
                    />
                    <Line
                      type="monotone"
                      dataKey={`${ticker}_open`}
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={false}
                      connectNulls={false}
                    />
                  </React.Fragment>
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PositionTimelineChart;