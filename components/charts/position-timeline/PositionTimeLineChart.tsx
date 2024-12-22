import React, { useState, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';
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

const PositionTimelineChart = ({
  transactions,
  openPositions,
  closedPositions
}) => {
  const [timeRange, setTimeRange] = useState('6M');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPercentage, setShowPercentage] = useState(false);
  const [selectedTickers, setSelectedTickers] = useState(['SPY']);
  const [allTickers, setAllTickers] = useState(['SPY']);
  const [chartData, setChartData] = useState([]);
  const [baselineValues, setBaselineValues] = useState({});

  // Get reference prices for percentage calculations
  const getBaselineValues = (data, tickers) => {
    const baselines = {};
    tickers.forEach(ticker => {
      const firstPoint = data.find(point => 
        point[`${ticker}_base`] !== undefined || 
        point[`${ticker}_closed`] !== undefined || 
        point[`${ticker}_open`] !== undefined || 
        point[ticker] !== undefined
      );
      if (firstPoint) {
        baselines[ticker] = firstPoint[`${ticker}_base`] || 
                           firstPoint[`${ticker}_closed`] || 
                           firstPoint[`${ticker}_open`] || 
                           firstPoint[ticker] || 0;
      }
    });
    return baselines;
  };

  useEffect(() => {
    const uniqueTickers = [...new Set([
      ...openPositions.map(p => p.ticker),
      ...closedPositions.map(p => p.ticker),
      'SPY'
    ])];
    setAllTickers(uniqueTickers);
  }, [openPositions, closedPositions]);

  const handleTickerSelect = (ticker) => {
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
            return { ticker, data: data.error ? [] : data };
          } catch (err) {
            console.error(`Error fetching ${ticker}:`, err);
            return { ticker, data: [] };
          }
        });

        const results = await Promise.all(tickerDataPromises);
        
        const allDates = new Set();
        results.forEach(({ data }) => {
          data.forEach(point => allDates.add(point.date));
        });

        let initialProcessedData = Array.from(allDates).sort().map(date => {
          const point = { date };
          const dateObj = new Date(date);

          results.forEach(({ ticker, data }) => {
            const dataPoint = data.find(p => p.date === date);
            if (!dataPoint) return;

            const value = dataPoint.close || dataPoint.price;

            if (ticker === 'SPY') {
              point[ticker] = value;
            } else {
              point[`${ticker}_base`] = value;

              const isInClosedPeriod = closedPositions.some(position => {
                if (position.ticker !== ticker) return false;
                const buyDate = new Date(position.buyDate);
                const sellDate = new Date(position.sellDate);
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

        // Get baseline values for percentage calculations
        const baselines = getBaselineValues(initialProcessedData, tickers);
        setBaselineValues(baselines);

        // Convert to percentages if needed
        const processedData = initialProcessedData.map(point => {
          const newPoint = { date: point.date };
          Object.entries(point).forEach(([key, value]) => {
            if (key === 'date') return;
            
            const ticker = key.split('_')[0];
            if (showPercentage && baselines[ticker]) {
              newPoint[key] = ((value - baselines[ticker]) / baselines[ticker]) * 100;
            } else {
              newPoint[key] = value;
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

  const getTickerColor = (ticker) => {
    const colors = {
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
                  formatter={(value, name) => {
                    const displayName = name.replace(/_closed|_open|_base/, '');
                    const type = name.includes('_open') ? ' (Open)' : 
                               name.includes('_closed') ? ' (Closed)' : '';
                    return [
                      showPercentage 
                        ? `${Number(value).toFixed(1)}%` 
                        : `$${Number(value).toFixed(2)}`,
                      displayName + type
                    ];
                  }}
                />
                
                {/* SPY reference line */}
                <Line
                  type="monotone"
                  dataKey="SPY"
                  stroke="#888888"
                  strokeWidth={1}
                  dot={false}
                  connectNulls={true}
                />
                
                {/* Lines for selected tickers */}
                {selectedTickers.filter(ticker => ticker !== 'SPY').map((ticker) => (
                  <React.Fragment key={ticker}>
                    {/* Dotted line showing price between positions */}
                    <Line
                      type="monotone"
                      dataKey={`${ticker}_base`}
                      stroke={getTickerColor(ticker)}
                      strokeWidth={1}
                      strokeDasharray="3 3"
                      dot={false}
                      connectNulls={true}
                    />
                    {/* Closed position line */}
                    <Line
                      type="monotone"
                      dataKey={`${ticker}_closed`}
                      stroke={getTickerColor(ticker)}
                      strokeWidth={2}
                      dot={false}
                      connectNulls={false}
                    />
                    {/* Open position line */}
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