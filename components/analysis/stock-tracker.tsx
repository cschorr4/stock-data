// components/analysis/stock-tracker.tsx
import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import TransactionTable from './portfolio/transaction-table';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface Transaction {
  id: string;
  symbol: string;
  action: 'buy' | 'sell';
  quantity: number;
  price: number;
  date: string;
}

interface HoldingPeriod {
  symbol: string;
  startDate: string;
  endDate: string | null;
  quantity: number;
  isComplete: boolean;
  buyPrice: number;
  sellPrice?: number;
}

const StockTracker = () => {
  console.log('StockTracker rendering');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [newTransaction, setNewTransaction] = useState({
    symbol: '',
    action: 'buy' as const,
    quantity: '',
    price: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [error, setError] = useState<string | null>(null);
  const [performanceData, setPerformanceData] = useState<Record<string, any[]>>({});

  useEffect(() => {
    const savedTransactions = localStorage.getItem('stockTransactions');
    if (savedTransactions) {
      const loaded = JSON.parse(savedTransactions);
      setTransactions(loaded);
      const uniqueSymbols = [...new Set(loaded.map(t => t.symbol))];
      uniqueSymbols.forEach(symbol => {
        const earliestTransaction = loaded
          .filter(t => t.symbol === symbol)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
        if (earliestTransaction) {
          fetchStockPerformance(symbol, earliestTransaction.date);
        }
      });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('stockTransactions', JSON.stringify(transactions));
  }, [transactions]);

  const fetchStockPerformance = async (symbol: string, startDate: string) => {
    try {
      const response = await fetch(`/api/stock/chart?symbol=${symbol}&range=1Y`);
      const data = await response.json();
      
      const filteredData = data.filter((point: any) => 
        new Date(point.date) >= new Date(startDate)
      );

      setPerformanceData(prev => ({
        ...prev,
        [symbol]: filteredData
      }));
    } catch (error) {
      console.error('Error fetching performance data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTransaction.symbol || !newTransaction.quantity || !newTransaction.price) {
      setError('Please fill in all fields');
      return;
    }

    const transaction = {
      id: Date.now().toString(),
      ...newTransaction,
      quantity: parseFloat(newTransaction.quantity),
      price: parseFloat(newTransaction.price)
    };

    const existingTransactions = transactions.filter(t => t.symbol === transaction.symbol);
    if (existingTransactions.length === 0) {
      await fetchStockPerformance(transaction.symbol, transaction.date);
    }

    setTransactions(prev => [...prev, transaction]);
    setNewTransaction({
      symbol: '',
      action: 'buy',
      quantity: '',
      price: '',
      date: new Date().toISOString().split('T')[0]
    });
    setError(null);
  };

  const processTransactions = () => {
    const holdingPeriods: HoldingPeriod[] = [];
    const positions: Record<string, { quantity: number; value: number }> = {};
    const openBuys: Record<string, { date: string; quantity: number; price: number }[]> = {};

    const sortedTransactions = [...transactions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    sortedTransactions.forEach(transaction => {
      const { symbol, action, quantity, date, price } = transaction;
      
      if (!positions[symbol]) {
        positions[symbol] = { quantity: 0, value: 0 };
      }
      
      if (action === 'buy') {
        if (!openBuys[symbol]) openBuys[symbol] = [];
        openBuys[symbol].push({ date, quantity, price });
        positions[symbol].quantity += quantity;
        positions[symbol].value += quantity * price;
        
        holdingPeriods.push({
          symbol,
          startDate: date,
          endDate: null,
          quantity,
          isComplete: false,
          buyPrice: price
        });
      } else if (action === 'sell') {
        let remainingToSell = quantity;
        positions[symbol].quantity -= quantity;
        positions[symbol].value -= quantity * price;
        
        while (remainingToSell > 0 && openBuys[symbol]?.length > 0) {
          const oldestBuy = openBuys[symbol][0];
          const sellQuantity = Math.min(remainingToSell, oldestBuy.quantity);
          
          const holdingPeriod = holdingPeriods.find(p => 
            p.symbol === symbol && 
            p.startDate === oldestBuy.date && 
            !p.endDate
          );

          if (sellQuantity === oldestBuy.quantity) {
            openBuys[symbol].shift();
            if (holdingPeriod) {
              holdingPeriod.endDate = date;
              holdingPeriod.isComplete = true;
              holdingPeriod.sellPrice = price;
            }
          } else {
            oldestBuy.quantity -= sellQuantity;
            if (holdingPeriod) {
              holdingPeriods.push({
                symbol,
                startDate: holdingPeriod.startDate,
                endDate: date,
                quantity: sellQuantity,
                isComplete: true,
                buyPrice: holdingPeriod.buyPrice,
                sellPrice: price
              });
              holdingPeriod.quantity -= sellQuantity;
            }
          }
          remainingToSell -= sellQuantity;
        }
      }
    });

    return { holdingPeriods, positions };
  };

  const { holdingPeriods, positions } = processTransactions();
  const symbols = [...new Set(holdingPeriods.map(p => p.symbol))];

  // Create unified dataset with actual prices
  const chartData = Object.values(performanceData)[0]?.map((point, i) => {
    const dataPoint = { date: point.date };
    symbols.forEach(symbol => {
      if (performanceData[symbol]?.[i]) {
        dataPoint[`${symbol}-price`] = performanceData[symbol][i].close;
      }
    });
    return dataPoint;
  }) || [];

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Portfolio Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Object.entries(positions)
                      .filter(([_, pos]) => pos.quantity > 0)
                      .map(([symbol, pos]) => ({
                        name: symbol,
                        value: Math.abs(pos.value)
                      }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={130}
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(1)}%`}
                  >
                    {Object.entries(positions).map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Portfolio Summary</h3>
                <p className="text-2xl font-bold">
                  ${Object.values(positions)
                    .filter(pos => pos.quantity > 0)
                    .reduce((sum, pos) => sum + pos.value, 0).toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">Total Investment</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <input
                    type="text"
                    placeholder="Stock Symbol"
                    className="border rounded p-2"
                    value={newTransaction.symbol}
                    onChange={(e) => setNewTransaction({
                      ...newTransaction,
                      symbol: e.target.value.toUpperCase()
                    })}
                  />
                  <select
                    className="border rounded p-2"
                    value={newTransaction.action}
                    onChange={(e) => setNewTransaction({
                      ...newTransaction,
                      action: e.target.value as 'buy' | 'sell'
                    })}
                  >
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                  </select>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Quantity"
                    className="border rounded p-2"
                    value={newTransaction.quantity}
                    onChange={(e) => setNewTransaction({
                      ...newTransaction,
                      quantity: e.target.value
                    })}
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    className="border rounded p-2"
                    value={newTransaction.price}
                    onChange={(e) => setNewTransaction({
                      ...newTransaction,
                      price: e.target.value
                    })}
                  />
                  <input
                    type="date"
                    className="border rounded p-2"
                    value={newTransaction.date}
                    onChange={(e) => setNewTransaction({
                      ...newTransaction,
                      date: e.target.value
                    })}
                  />
                </div>
                <Button type="submit" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Transaction
                </Button>
              </form>

              {error && (
                <Alert>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unified Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis 
                  label={{ 
                    value: 'Price ($)', 
                    angle: -90, 
                    position: 'insideLeft' 
                  }} 
                />
                <Tooltip content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background p-2 border rounded shadow">
                        <p className="text-sm">{data.date}</p>
                        {payload.map((entry, index) => (
                          <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name.split('-')[0]}: ${entry.value?.toFixed(2)}
                          </p>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}/>
                <Legend />
                {holdingPeriods.map((period, index) => {
                  const isActive = !period.isComplete;
                  return (
                    <Line
                      key={`${period.symbol}-${period.startDate}-${period.endDate || 'present'}`}
                      type="monotone"
                      dataKey={`${period.symbol}-price`}
                      stroke={isActive ? '#0088FE' : '#FF4444'}
                      strokeWidth={2}
                      dot={false}
                      connectNulls={true}
                      name={`${period.symbol} (${period.quantity} @ $${period.buyPrice}${
                        period.sellPrice ? ` → $${period.sellPrice}` : ''
                      })`}
                      data={chartData.filter(point => {
                        const pointDate = new Date(point.date);
                        const startDate = new Date(period.startDate);
                        const endDate = period.endDate ? new Date(period.endDate) : new Date();
                        return pointDate >= startDate && pointDate <= endDate;
                      })}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <TransactionTable 
        transactions={transactions}
        onUpdateTransaction={(id, updates) => {
          setTransactions(prev => prev.map(t => 
            t.id === id ? { ...t, ...updates } : t
          ));
        }}
        onDeleteTransaction={(id) => {
          setTransactions(prev => prev.filter(t => t.id !== id));
        }}
      />
    </div>
  );
};

export default StockTracker;