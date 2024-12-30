import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChartControls } from './ChartControls';
import { usePositionTimeline, useChartDataProcessing } from './hooks/useChartData';
import { DateRange } from "react-day-picker";
import { Transaction, Position, ClosedPosition } from '@/lib/types';

interface StockDataPoint {
  date: string;
  close?: number;
  price?: number;
}

interface PositionTimelineChartProps {
  transactions: Transaction[];
  openPositions: Position[];
  closedPositions: ClosedPosition[];
}

const PositionTimelineChart: React.FC<PositionTimelineChartProps> = ({ 
  transactions, 
  openPositions, 
  closedPositions 
}) => {
  const [timeRange, setTimeRange] = useState('6M');
  const [dateRange, setDateRange] = useState<DateRange>();
  const [showPercentage, setShowPercentage] = useState(false);
  const [selectedTickers, setSelectedTickers] = useState(['SPY']);
  const [chartData, setChartData] = useState<Array<{ date: string; [key: string]: any }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile] = useState(() => window.innerWidth < 768);

  const positionStates = usePositionTimeline(openPositions, closedPositions);
  const processedChartData = useChartDataProcessing(chartData, positionStates, showPercentage);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const tickers = Array.from(new Set([...selectedTickers, 'SPY']));
        let url = `/api/stock/chart?`;
        
        if (timeRange === 'Custom' && dateRange?.from && dateRange?.to) {
          url += `start=${format(dateRange.from, 'yyyy-MM-dd')}&end=${format(dateRange.to, 'yyyy-MM-dd')}`;
        } else {
          url += `range=${timeRange}`;
        }

        const responses = await Promise.all(
          tickers.map(ticker => 
            fetch(`${url}&symbol=${ticker}`).then(res => res.json())
          )
        );

        const allDates = new Set<string>();
        responses.forEach(data => data.forEach((point: StockDataPoint) => allDates.add(point.date)));

        const combinedData = Array.from(allDates)
          .sort()
          .map(date => {
            const point: { date: string; [key: string]: number | string } = { date };
            tickers.forEach((ticker, idx) => {
              const tickerData = responses[idx].find((d: StockDataPoint) => d.date === date);
              if (tickerData) {
                point[ticker] = tickerData.close || tickerData.price;
              }
            });
            return point;
          });

        setChartData(combinedData);
      } catch (err) {
        console.error('Error fetching chart data:', err);
        setError('Failed to load chart data');
      }
      setIsLoading(false);
    };

    fetchData();
  }, [timeRange, dateRange, selectedTickers]);

  const handleTimeRangeChange = (range: string, customRange?: DateRange) => {
    if (range === 'Custom' && customRange) {
      setDateRange(customRange);
      setTimeRange('Custom');
    } else {
      setDateRange(undefined);
      setTimeRange(range);
    }
  };

  if (isLoading) return <div>Loading chart data...</div>;
  if (error) return <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <CardTitle>Position Timeline</CardTitle>
          <ChartControls
            allTickers={Object.keys(positionStates)}
            selectedTickers={selectedTickers}
            showPercentage={showPercentage}
            timeRange={timeRange}
            onTickerSelect={(ticker: string) => {
              setSelectedTickers(current => 
                current.includes(ticker) 
                  ? current.filter(t => t !== ticker)
                  : [...current, ticker]
              );
            }}
            onShowPercentageChange={setShowPercentage}
            onTimeRangeChange={handleTimeRangeChange}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`h-${isMobile ? '64' : '96'}`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={processedChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(new Date(date), 'MMM d')}
                angle={-45}
                textAnchor="end"
                height={isMobile ? 60 : 30}
                tick={{ fontSize: isMobile ? 10 : 12 }}
              />
              <YAxis
                tickFormatter={(value) => 
                  showPercentage ? `${value.toFixed(1)}%` : `$${value.toFixed(0)}`
                }
                width={55}
              />
              <Tooltip
                labelFormatter={(label) => format(new Date(label), 'PPP')}
                formatter={(value: number, name: string) => {
                  const displayName = name.split('_')[0];
                  const formattedValue = showPercentage 
                    ? `${value.toFixed(1)}%` 
                    : `$${value.toFixed(2)}`;
                  return [formattedValue, displayName];
                }}
              />
              
              <Line
                type="monotone"
                dataKey="SPY"
                stroke="#888888"
                strokeWidth={1}
                dot={false}
              />

              {selectedTickers.filter(ticker => ticker !== 'SPY').map((ticker) => (
                <React.Fragment key={ticker}>
                  <Line
                    type="monotone"
                    dataKey={`${ticker}_inactive`}
                    stroke="#888888"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey={`${ticker}_open`}
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey={`${ticker}_closed`}
                    stroke="#dc2626"
                    strokeWidth={2}
                    dot={false}
                  />
                </React.Fragment>
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default PositionTimelineChart;