'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TechnicalAnalysis from '@/components/analysis/technical-analysis';
import FundamentalAnalysis from '@/components/analysis/fundamental-analysis';
import FinancialStatements from '@/components/analysis/financial-statements';
import StockLog from '@/components/stock-log';
import { useState } from "react";

export default function Home() {
  const [ticker, setTicker] = useState('');
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(false);
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
      const response = await fetch(`/api/stock?symbol=${ticker.trim().toUpperCase()}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to fetch stock data');
      }
      
      setStockData(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch stock data');
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
    <main className="min-h-screen bg-background p-4 space-y-6">
      {/* Stock Analysis Section */}
      <Card className="max-w-7xl mx-auto">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <CardTitle className="text-xl">Stock Analysis Dashboard</CardTitle>
            <div className="flex gap-4 w-full md:w-auto">
              <Input
                type="text"
                placeholder="Enter symbol (e.g., AAPL)"
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
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Search
                  </div>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="text-red-500 text-center p-2 rounded bg-red-100">{error}</div>
          )}

          {stockData && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-card">
                  <CardContent className="pt-6">
                    <h3 className="text-sm text-muted-foreground">Current Price</h3>
                    <div className="flex items-baseline gap-2 mt-2">
                      <p className="text-2xl font-bold">${stockData.quote?.price?.toFixed(2)}</p>
                      {stockData.quote?.changePercent && (
                        <span className={`text-sm ${stockData.quote.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {stockData.quote.changePercent >= 0 ? '+' : ''}
                          {stockData.quote.changePercent.toFixed(2)}%
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card">
                  <CardContent className="pt-6">
                    <h3 className="text-sm text-muted-foreground">Trading Volume</h3>
                    <p className="text-2xl font-bold mt-2">
                      {new Intl.NumberFormat().format(stockData.quote?.volume)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-card">
                  <CardContent className="pt-6">
                    <h3 className="text-sm text-muted-foreground">Market Cap</h3>
                    <p className="text-2xl font-bold mt-2">
                      ${(stockData.fundamentals?.marketCap / 1e12).toFixed(2)}T
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 w-full max-w-2xl mx-auto">
                  <TabsTrigger value="technical">Technical Analysis</TabsTrigger>
                  <TabsTrigger value="fundamental">Fundamental Analysis</TabsTrigger>
                  <TabsTrigger value="financial">Financial Statements</TabsTrigger>
                </TabsList>
                
                <div className="mt-6">
                  <TabsContent value="technical">
                    <TechnicalAnalysis symbol={ticker} data={stockData?.technical} />
                  </TabsContent>
                  <TabsContent value="fundamental">
                    <FundamentalAnalysis data={stockData?.fundamentals} isLoading={loading} />
                  </TabsContent>
                  <TabsContent value="financial">
                    <FinancialStatements data={stockData?.financials} isLoading={loading} />
                  </TabsContent>
                </div>
              </Tabs>
            </>
          )}
        </CardContent>
      </Card>

      {/* Portfolio Tracker Section */}
      <Card className="max-w-7xl mx-auto">
        <CardHeader>
          <CardTitle className="text-xl text-center">Portfolio Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <StockLog />
        </CardContent>
      </Card>
    </main>
  );
}