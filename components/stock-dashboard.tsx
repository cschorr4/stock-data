import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Search, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import TechnicalAnalysis from './analysis/technical-analysis';
import FundamentalAnalysis from './analysis/fundamental-analysis';
import FinancialStatements from './analysis/financial-statements';
import StockTracker from './analysis/stock-tracker';

const LoadingValue = () => (
  <div className="animate-pulse">
    <div className="h-6 w-20 bg-muted-foreground/20 rounded" />
  </div>
);

const formatValue = (value, prefix = '') => {
  if (!value && value !== 0) return 'N/A';
  if (typeof value === 'number') {
    if (Math.abs(value) >= 1e12) return `${prefix}${(value / 1e12).toFixed(2)}T`;
    if (Math.abs(value) >= 1e9) return `${prefix}${(value / 1e9).toFixed(2)}B`;
    if (Math.abs(value) >= 1e6) return `${prefix}${(value / 1e6).toFixed(2)}M`;
    if (Math.abs(value) >= 1e3) return `${prefix}${(value / 1e3).toFixed(2)}K`;
    return `${prefix}${value.toFixed(2)}`;
  }
  return 'N/A';
};

const QuickStats = ({ data, isLoading }) => {
  if (!data?.quote && !isLoading) return null;

  const StatCard = ({ title, value, trend = null }) => (
    <Card className="bg-card">
      <CardContent className="pt-6">
        <h3 className="text-sm text-muted-foreground">{title}</h3>
        <div className="flex items-baseline gap-2 mt-2">
          {isLoading ? (
            <LoadingValue />
          ) : (
            <>
              <p className="text-2xl font-bold">{value}</p>
              {trend !== null && (
                <span className={`text-sm ${parseFloat(trend) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {parseFloat(trend) >= 0 ? '+' : ''}{trend}%
                </span>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard 
        title="Current Price" 
        value={`$${formatValue(data?.quote?.price)}`}
        trend={data?.quote?.changePercent?.toFixed(2)}
      />
      <StatCard 
        title="Trading Volume" 
        value={formatValue(data?.quote?.volume)}
      />
      <StatCard 
        title="Market Cap" 
        value={`$${formatValue(data?.fundamentals?.marketCap)}`}
      />
    </div>
  );
};

export function StockDashboard() {
  console.log('StockDashboard rendering');
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [stockData, setStockData] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('technical');

  const fetchData = async () => {
    if (!ticker.trim()) {
      setError('Please enter a stock symbol');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('Fetching data for:', ticker.trim().toUpperCase());
      const response = await fetch(`/api/stock?symbol=${ticker.trim().toUpperCase()}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to fetch stock data');
      }
      
      if (!data) {
        throw new Error('No data received from server');
      }

      console.log('Received data:', data);
      setStockData(data);
    } catch (err) {
      console.error('Error fetching stock data:', err);
      setError(err.message || 'Failed to fetch stock data. Please try again.');
      setStockData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      fetchData();
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      <Card className="max-w-7xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Stock Analysis Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 max-w-xl mx-auto">
            <div className="flex gap-4">
              <Input
                type="text"
                placeholder="Enter stock symbol (e.g., AAPL)"
                value={ticker}
                onChange={(e) => {
                  setError('');
                  setTicker(e.target.value.toUpperCase());
                }}
                onKeyPress={handleKeyPress}
                className="text-lg"
              />
              <Button 
                onClick={fetchData}
                disabled={loading}
                className="w-32"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Loading
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Search
                  </div>
                )}
              </Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <QuickStats data={stockData} isLoading={loading} />
          
          {stockData && (
            <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 w-full max-w-2xl mx-auto">
                <TabsTrigger value="technical">Technical Analysis</TabsTrigger>
                <TabsTrigger value="fundamental">Fundamental Analysis</TabsTrigger>
                <TabsTrigger value="financial">Financial Statements</TabsTrigger>
              </TabsList>
              
              <div className="mt-6">
                <TabsContent value="technical">
                  <TechnicalAnalysis 
                    symbol={ticker} 
                    data={stockData?.technical} 
                  />
                </TabsContent>
                <TabsContent value="fundamental">
                  <FundamentalAnalysis 
                    data={stockData?.fundamentals}
                    isLoading={loading}
                  />
                </TabsContent>
                <TabsContent value="financial">
                  <FinancialStatements 
                    data={stockData?.financials}
                    isLoading={loading}
                  />
                </TabsContent>
              </div>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Portfolio Tracker Section */}
      <Card className="max-w-7xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Portfolio Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StockTracker />
        </CardContent>
      </Card>
    </div>
  );

}

export default StockDashboard;