import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const TechnicalAnalysis = ({ symbol }) => {
  const [timeRange, setTimeRange] = useState('1M');
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (symbol) {
      fetchChartData();
    }
  }, [timeRange, symbol]);

  const fetchChartData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/stock/chart?symbol=${symbol}&range=${timeRange}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch chart data');
      }
      
      const processed = data.map(point => ({
        ...point,
        date: new Date(point.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })
      }));
      
      setChartData(processed);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const timeRanges = [
    { label: '1M', value: '1M' },
    { label: '3M', value: '3M' },
    { label: '6M', value: '6M' },
    { label: '1Y', value: '1Y' }
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm text-muted-foreground">{data.date}</p>
          <p className="text-base font-medium">
            ${Number(data.close).toFixed(2)}
          </p>
          {data.volume && (
            <p className="text-sm text-muted-foreground">
              Vol: {new Intl.NumberFormat().format(data.volume)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>Price Chart</CardTitle>
          <div className="flex flex-wrap gap-2">
            {timeRanges.map(({ label, value }) => (
              <Button
                key={value}
                variant={timeRange === value ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(value)}
                className={`
                  min-w-[60px] transition-all duration-200 
                  ${timeRange === value ? 'shadow-lg scale-105' : 'hover:scale-105'}
                `}
                disabled={loading}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          {loading ? (
            <div className="h-full w-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  domain={['auto', 'auto']}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="close"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 6,
                    className: "animate-pulse",
                    fill: "hsl(var(--primary))"
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TechnicalAnalysis;