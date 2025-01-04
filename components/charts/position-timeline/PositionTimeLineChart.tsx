import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChartControls } from './ChartControls';
import { usePositionTimeline, useChartDataProcessing } from './hooks/useChartData';
import { PositionTimelineChartProps, ChartDataPoint, ChartPoint} from '@/lib/types';

const PositionTimelineChart: React.FC<PositionTimelineChartProps> = ({ openPositions, closedPositions }) => {
  const [timeRange, setTimeRange] = useState<string>('6M');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showPercentage, setShowPercentage] = useState<boolean>(false);
  const [selectedTickers, setSelectedTickers] = useState<string[]>(['SPY']);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const positionStates = usePositionTimeline(openPositions, closedPositions);
  const filteredChartData = chartData.map(point => {
    const filteredPoint: ChartPoint = { date: point.date };
    Object.entries(point).forEach(([key, value]) => {
      if (value !== null && key !== 'date') {
        filteredPoint[key] = value as string | number;
      }
    });
    return filteredPoint;
  });

  const processedChartData = useChartDataProcessing(filteredChartData, positionStates, showPercentage);

  const handleCustomDateChange = (from: Date, to: Date) => {
    setStartDate(from);
    setEndDate(to);
  };

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const tickers = Array.from(new Set([...selectedTickers, 'SPY']));
      let url = '/api/stock/chart?';
      
      if (timeRange === 'Custom' && startDate && endDate) {
        url += `start=${format(startDate, 'yyyy-MM-dd')}&end=${format(endDate, 'yyyy-MM-dd')}`;
      } else {
        url += `range=${timeRange}`;
      }

      const responses = await Promise.all(
        tickers.map(async ticker => {
          const response = await fetch(`${url}&symbol=${ticker}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch ${ticker}: ${response.statusText}`);
          }
          return response.json();
        })
      );

      const allDates = new Set();
      responses.forEach((data: any[]) => 
        data.forEach((point: { date: string }) => allDates.add(point.date))
      );

      const combinedData = Array.from(allDates)
        .sort()
        .map(date => {
          const point = { date: date as string } as { date: string } & { [key: string]: number | null };
          tickers.forEach((ticker, idx) => {
            const tickerData = responses[idx].find((d: { date: string }) => d.date === date);
            point[ticker] = tickerData?.close ?? tickerData?.price ?? null;
          });
          return point;
        });

      setChartData(combinedData);
    } catch (err) {
      console.error('Error fetching chart data:', err);
      if (err instanceof Error) {
        setError(err.message || 'Failed to load chart data');
      } else {
        setError('Failed to load chart data');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange, startDate, endDate, selectedTickers, retryCount]);

  // Loading state with enhanced animation
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Position Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`${isMobile ? 'h-64' : 'h-96'} flex items-center justify-center bg-background relative overflow-hidden`}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 relative">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="absolute inset-0 border-2 border-primary rounded-full opacity-75"
                    style={{
                      animation: `ripple 3s cubic-bezier(0, 0.2, 0.8, 1) infinite ${i * 0.2}s`,
                      borderColor: i % 3 === 0 ? 'var(--primary)' : i % 3 === 1 ? 'var(--muted-foreground)' : '#34D399'
                    }}
                  />
                ))}
                <style jsx>{`
                  @keyframes ripple {
                    0% { 
                      transform: scale(1);
                      opacity: 0.8;
                    }
                    100% { 
                      transform: scale(12);
                      opacity: 0;
                    }
                  }
                `}</style>
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="text-3xl font-bold text-primary">GTI</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  // Error state with retry button
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Position Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertDescription className="flex flex-col gap-4">
              <p className="text-sm">{error}</p>
              <Button 
                onClick={() => setRetryCount(c => c + 1)}
                variant="outline"
                size="sm"
                className="w-fit"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

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
            onTimeRangeChange={setTimeRange}
            onCustomDateChange={handleCustomDateChange}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`${isMobile ? 'h-64' : 'h-96'}`}>
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
                labelFormatter={(label) => format(new Date(label as string), 'PPP')}
                formatter={(value: number, name: string) => {
                  const displayName = typeof name === 'string' ? name.split('_')[0] : name;
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
                strokeWidth={2}
                dot={false}
              />

              {selectedTickers.filter(ticker => ticker !== 'SPY').map((ticker) => (
                <React.Fragment key={ticker}>
                  <Line
                    type="monotone"
                    dataKey={`${ticker}_inactive`}
                    stroke="#888888"
                    strokeWidth={2}
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