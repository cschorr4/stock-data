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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DollarSign, PercentIcon } from 'lucide-react';
import StockSelector from '@/components/StockSelector';

const PositionTimelineChart = ({ transactions, openPositions, closedPositions }) => {
  const [chartData, setChartData] = useState([]);
  const [timeRange, setTimeRange] = useState('6M');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [positionData, setPositionData] = useState({});
  const [showPercentage, setShowPercentage] = useState(false);
  const [selectedTickers, setSelectedTickers] = useState(['SPY']);
  const [allTickers, setAllTickers] = useState(['SPY']);
  const [rawData, setRawData] = useState([]);
  const [tickerData, setTickerData] = useState([]);
  const [tickers, setTickers] = useState([]);

  useEffect(() => {
    const uniqueTickers = [...new Set([
      ...transactions.filter(t => t.ticker).map(t => t.ticker),
      'SPY'
    ])];
    setAllTickers(uniqueTickers);
  }, [transactions]);

  const getTickerColor = (ticker) => {
    if (ticker === 'SPY') return '#fbbf24';
    const isOpen = openPositions.some(p => p.ticker === ticker);
    return isOpen ? '#2563eb' : '#dc2626';
  };

  const handleTickerSelect = (ticker) => {
    if (ticker === 'SPY') return;
    setSelectedTickers(current =>
      current.includes(ticker)
        ? current.filter(t => t !== ticker)
        : [...current, ticker]
    );
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length > 0) {
      return (
        <div className="bg-white p-4 border rounded shadow">
          <p className="font-medium">{format(new Date(label), "PPP")}</p>
          {payload.map((entry, index) => {
            const ticker = entry.dataKey.split('_')[0];
            const shares = positionData[label]?.[ticker]?.shares || 0;
            const value = entry.value;
            
            if (value !== undefined && value !== null) {
              return (
                <div key={index} className="text-sm">
                  <span style={{ color: getTickerColor(ticker) }}>{ticker}</span>
                  <span className="ml-2">
                    {showPercentage ? `${value.toFixed(2)}%` : `$${value.toFixed(2)}`}
                  </span>
                  {shares > 0 && (
                    <span className="ml-2 text-gray-600">
                      ({shares} shares)
                    </span>
                  )}
                </div>
              );
            }
            return null;
          })}
        </div>
      );
    }
    return null;
  };

  const processDataForDisplay = (rawData) => {
    if (!rawData || rawData.length === 0) return [];
    
    // Store original data
    const processedData = rawData.map(point => ({...point}));
    
    if (showPercentage) {
      const baselineValues = {};
      processedData.forEach(point => {
        Object.entries(point).forEach(([key, value]) => {
          if (key !== 'date' && value !== null) {
            const ticker = key.split('_')[0];
            if (baselineValues[ticker] === undefined) {
              baselineValues[ticker] = value;
            }
            const percentChange = ((value - baselineValues[ticker]) / baselineValues[ticker]) * 100;
            point[key] = percentChange;
          }
        });
      });
    }
    
    return processedData;
  };

  const processChartData = async (tickerData, tickers, transactions) => {
    const sharesData = {};
    const timelineData = [];
    const rawData = [];

    const allDates = [...new Set(
      tickerData.flatMap(({ data }) => data.map(d => d.date))
    )].sort();

    allDates.forEach(date => {
      const dataPoint = { date };
      const rawPoint = { date };
      sharesData[date] = {};
      
      tickers.forEach(ticker => {
        if (ticker === 'SPY') {
          const tickerPrices = tickerData.find(t => t.ticker === ticker)?.data;
          const priceOnDate = tickerPrices?.find(d => d.date === date)?.close;
          if (priceOnDate !== undefined) {
            dataPoint[ticker] = priceOnDate;
            rawPoint[ticker] = priceOnDate;
          }
          return;
        }

        const relevantTransactions = transactions
          .filter(t => t.ticker === ticker && new Date(t.date) <= new Date(date))
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        let shares = 0;
        relevantTransactions.forEach(t => {
          shares += t.type === 'buy' ? t.shares : -t.shares;
        });
        
        if (shares > 0) {
          sharesData[date][ticker] = { shares };
        }

        const tickerPrices = tickerData.find(t => t.ticker === ticker)?.data;
        const priceOnDate = tickerPrices?.find(d => d.date === date)?.close;

        if (priceOnDate !== undefined) {
          if (shares > 0) {
            dataPoint[`${ticker}`] = priceOnDate;
            rawPoint[`${ticker}`] = priceOnDate;
          } else {
            dataPoint[`${ticker}_dashed`] = priceOnDate;
            rawPoint[`${ticker}_dashed`] = priceOnDate;
          }
        }
      });

      timelineData.push(dataPoint);
      rawData.push(rawPoint);
    });

    return { timelineData, sharesData, rawData };
  };

  useEffect(() => {
    const fetchStockData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const transactionTickers = [...new Set(
          transactions
            .filter(t => t.ticker)
            .map(t => t.ticker)
        )];
        
        const uniqueTickers = new Set([...selectedTickers, ...transactionTickers]);
        if (!uniqueTickers.has('SPY')) {
          uniqueTickers.add('SPY');
        }
        const newTickers = Array.from(uniqueTickers);
        setTickers(newTickers);
     
        if (newTickers.length === 0) {
          setChartData([]);
          setIsLoading(false);
          return;
        }
     
        const newTickerData = await Promise.all(
          newTickers.map(async ticker => {
            try {
              const response = await fetch(`/api/stock/chart?symbol=${ticker}&range=${timeRange}`);
              if (!response.ok) {
                throw new Error(`Failed to fetch data for ${ticker}`);
              }
              const data = await response.json();
              return { ticker, data: data.error ? [] : data };
            } catch (err) {
              console.error(`Error fetching ${ticker}:`, err);
              return { ticker, data: [] };
            }
          })
        );
        setTickerData(newTickerData);
     
        const { timelineData, sharesData, rawData: newRawData } = await processChartData(newTickerData, newTickers, transactions);
        setRawData(newRawData);
        const processedData = processDataForDisplay(newRawData);
        setChartData(processedData);
        setPositionData(sharesData);
     
      } catch (error) {
        console.error('Error processing chart data:', error);
        setError('Failed to load chart data');
      }
      
      setIsLoading(false);
     };


    fetchStockData();
  }, [timeRange, transactions, selectedTickers]);
  
  useEffect(() => {
    const reprocessData = () => {
      if (rawData.length > 0) {
        const processedData = processDataForDisplay(rawData);
        setChartData(processedData);
      }
    };
    reprocessData();
  }, [showPercentage, rawData]);

  const handleTimeRangeChange = (value) => {
    setTimeRange(value);
    setIsLoading(true);
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
        <div className="flex items-center space-x-4">
          <StockSelector
            tickers={allTickers}
            selectedTickers={selectedTickers}
            onSelectTicker={handleTickerSelect}
          />
          <div className="flex items-center space-x-2">
            <Switch
              id="chart-view-toggle"
              checked={showPercentage}
              onCheckedChange={(checked) => setShowPercentage(checked)}
            />
            <Label htmlFor="chart-view-toggle" className="flex items-center space-x-1">
              {showPercentage ? <PercentIcon className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />}
            </Label>
          </div>
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1M">1 Month</SelectItem>
              <SelectItem value="3M">3 Months</SelectItem>
              <SelectItem value="6M">6 Months</SelectItem>
              <SelectItem value="1Y">1 Year</SelectItem>
              <SelectItem value="5Y">5 Years</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => format(new Date(date), 'MMM d')}
                />
                <YAxis 
                  tickFormatter={(value) => 
                    showPercentage 
                      ? `${value.toFixed(1)}%` 
                      : `$${value.toFixed(0)}`
                  }
                  domain={['auto', 'auto']}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {selectedTickers.map((ticker) => (
                  <React.Fragment key={ticker}>
                    {showPercentage ? (
                      <>
                        <Line
                          type="monotone"
                          dataKey={ticker}
                          stroke={getTickerColor(ticker)}
                          strokeWidth={2}
                          dot={false}
                          name={ticker}
                          connectNulls={true}
                        />
                        {ticker !== 'SPY' && (
                          <Line
                            type="monotone"
                            dataKey={`${ticker}_dashed`}
                            stroke={getTickerColor(ticker)}
                            strokeWidth={1}
                            strokeDasharray="3 3"
                            dot={false}
                            name={`${ticker} (Inactive)`}
                            connectNulls={true}
                          />
                        )}
                      </>
                    ) : (
                      <>
                        <Line
                          type="monotone"
                          dataKey={ticker}
                          stroke={getTickerColor(ticker)}
                          strokeWidth={2}
                          dot={false}
                          name={ticker}
                          connectNulls={true}
                        />
                        {ticker !== 'SPY' && (
                          <Line
                            type="monotone"
                            dataKey={`${ticker}_dashed`}
                            stroke={getTickerColor(ticker)}
                            strokeWidth={1}
                            strokeDasharray="3 3"
                            dot={false}
                            name={`${ticker} (Inactive)`}
                            connectNulls={true}
                          />
                        )}
                      </>
                    )}
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