'use client';

import React, { useState, useEffect } from 'react';
import { format } from "date-fns";
import { Download, Upload } from 'lucide-react';
import { toast } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";

import { Calendar as CalendarIcon, Pencil, Trash2, Plus, RefreshCcw, Info } from 'lucide-react';

// shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import PositionTimelineChart from './PositionTimeLineChart';
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Helper functions for localStorage
const getLocalStorage = (key: string, defaultValue: any) => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  }
  return defaultValue;
};

const setLocalStorage = (key: string, value: any) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

// Type definitions
interface Transaction {
  id: number;
  date: string;
  ticker: string;
  type: 'buy' | 'sell' | 'dividend';
  price: number;
  shares: number;
}

interface Position {
  ticker: string;
  shares: number;
  avgCost: number;
  currentValue: number;
  unrealizedProfit: number;
  percentChange: number;
  lastUpdated?: string;
}

interface ClosedPosition {
  ticker: string;
  buyDate: string;
  sellDate: string;
  shares: number;
  buyPrice: number;
  sellPrice: number;
  profit: number;
  percentChange: number;
}

const StockLog = () => {
  // State management
  const [transactions, setTransactions] = useState<Transaction[]>(() => 
    getLocalStorage('stockTransactions', [])
  );
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [spyData, setSpyData] = useState<Record<string, any>>({});
  const [formState, setFormState] = useState({
    date: new Date().toISOString().split('T')[0],
    ticker: '',
    type: 'buy' as const,
    price: '',
    shares: '',
  });
  const [filter, setFilter] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: 'date',
    direction: 'desc' as 'asc' | 'desc'
  });
  const [realtimePrices, setRealtimePrices] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchPrices = async () => {
      const symbols = [...new Set(transactions.map(t => t.ticker))].join(',');
      if (!symbols) return;
      
      try {
        const response = await fetch(`/api/stock/realtime?symbols=${symbols}`);
        const data = await response.json();
        
        if (data.quotes) {
          const priceMap = data.quotes.reduce((acc, quote) => ({
            ...acc,
            [quote.symbol]: {
              currentPrice: quote.currentPrice,
              change: quote.change,
              changePercent: quote.changePercent,
              volume: quote.volume,
              dayHigh: quote.dayHigh,
              dayLow: quote.dayLow
            }
          }), {});
          
          setRealtimePrices(priceMap);
        }
      } catch (error) {
        console.error('Error fetching prices:', error);
      }
    };
  
    fetchPrices();
    const interval = setInterval(fetchPrices, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, [transactions]);
  

  // Date handling
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setFormState(prev => ({
        ...prev,
        date: format(date, 'yyyy-MM-dd')
      }));
    }
  };

  const ImportButton = () => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    
    return (
      <>
        <input
          type="file"
          ref={inputRef}
          onChange={(e) => handleImportTransactions(e, toast)}
          accept=".json"
          className="hidden"
        />
        <Button
          variant="outline"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="mr-2 h-4 w-4" />
          Import
        </Button>
      </>
    );
  };

  const handleExportTransactions = () => {
    const dataStr = JSON.stringify(transactions, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stock_transactions_${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportTransactions = async (
    e: React.ChangeEvent<HTMLInputElement>,
    toast: (props: { title: string; description: string; variant?: "default" | "destructive" }) => void
  ) => {
    if (!e.target.files?.length) return;
    
    const file = e.target.files[0];
    try {
      const text = await file.text();
      const importedData = JSON.parse(text);
      
      // Convert different JSON formats to our transaction format
      let validatedData = [];
      
      if (Array.isArray(importedData)) {
        validatedData = importedData.map(transaction => {
          // Handle the format with symbol/action/quantity
          if (transaction.symbol && transaction.action && transaction.quantity !== undefined) {
            return {
              id: transaction.id || Date.now(),
              date: transaction.date,
              ticker: transaction.symbol.toUpperCase(),
              type: transaction.action.toLowerCase(),
              price: parseFloat(transaction.price),
              shares: parseFloat(transaction.quantity)
            };
          }
          // Handle our standard format
          else if (transaction.ticker && transaction.type && transaction.shares !== undefined) {
            return {
              id: transaction.id || Date.now(),
              date: transaction.date,
              ticker: transaction.ticker.toUpperCase(),
              type: transaction.type.toLowerCase(),
              price: parseFloat(transaction.price),
              shares: parseFloat(transaction.shares)
            };
          }
          throw new Error('Invalid transaction format');
        });
      } else {
        throw new Error('Invalid file format: Expected an array of transactions');
      }
  
      // Validate required fields
      validatedData.forEach(transaction => {
        if (!transaction.date || !transaction.ticker || !transaction.type || 
            transaction.price === undefined || transaction.shares === undefined) {
          throw new Error('Missing required fields in transaction');
        }
      });
  
      setTransactions(validatedData);
      e.target.value = ''; // Reset file input
      toast({
        title: "Success",
        description: `Imported ${validatedData.length} transactions successfully.`,
      });
    } catch (error) {
      console.error('Error importing transactions:', error);
      toast({
        variant: "destructive",
        title: "Import Error",
        description: error.message || 'Error importing transactions. Please check the file format.',
      });
    }
  };

  // Handler functions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'ticker') {
      setFormState(prev => ({
        ...prev,
        [name]: value.toUpperCase()
      }));
    } else {
      setFormState(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSelectChange = (value: string) => {
    setFormState(prev => ({
      ...prev,
      type: value as 'buy' | 'sell' | 'dividend'
    }));
  };

  const resetForm = () => {
    setFormState({
      date: new Date().toISOString().split('T')[0],
      ticker: '',
      type: 'buy',
      price: '',
      shares: '',
    });
    setSelectedDate(new Date());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formState.ticker || !formState.price || !formState.shares) {
      return;
    }

    const newTransaction = {
      ...formState,
      id: Date.now(),
      ticker: formState.ticker.toUpperCase(),
      price: parseFloat(formState.price),
      shares: parseFloat(formState.shares)
    };
    
    setTransactions(prev => [...prev, newTransaction]);
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setFormState({
      date: transaction.date,
      ticker: transaction.ticker,
      type: transaction.type,
      price: transaction.price.toString(),
      shares: transaction.shares.toString(),
    });
    setSelectedDate(new Date(transaction.date));
    setIsEditDialogOpen(true);
  };

  const handleDelete = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedTransaction) {
      setTransactions(prev => prev.filter(t => t.id !== selectedTransaction.id));
    }
    setIsDeleteDialogOpen(false);
  };

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTransaction) {
      setTransactions(prev => prev.map(t => 
        t.id === selectedTransaction.id 
          ? {
              ...formState,
              id: t.id,
              ticker: formState.ticker.toUpperCase(),
              price: parseFloat(formState.price),
              shares: parseFloat(formState.shares)
            }
          : t
      ));
    }
    setIsEditDialogOpen(false);
  };

  const handleSort = (key: keyof Transaction) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getFilteredTransactions = () => {
    return transactions.filter(transaction => {
      if (!transaction || !transaction.ticker) return false;
      return transaction.ticker.toLowerCase().includes(filter.toLowerCase());
    });
  };

  const calculatePositions = () => {
    const positions = new Map();
    const closedPositions: ClosedPosition[] = [];
    
    transactions
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach(transaction => {
        const { ticker, type, price, shares, date } = transaction;
        
        if (type === 'buy') {
          if (!positions.has(ticker)) {
            positions.set(ticker, []);
          }
          positions.get(ticker).push({ 
            price: parseFloat(price.toString()), 
            shares: parseFloat(shares.toString()), 
            date
          });
        } else if (type === 'sell') {
          let remainingShares = parseFloat(shares.toString());
          const position = positions.get(ticker) || [];
          const sellPrice = parseFloat(price.toString());
          
          while (remainingShares > 0 && position.length > 0) {
            const lot = position[0];
            const sharesSold = Math.min(remainingShares, lot.shares);
            const percentChange = ((sellPrice - lot.price) / lot.price) * 100;
            
            if (sharesSold === lot.shares) {
              position.shift();
            } else {
              lot.shares -= sharesSold;
            }
            
            closedPositions.push({
              ticker,
              buyDate: lot.date,
              sellDate: date,
              buyPrice: lot.price,
              sellPrice,
              shares: sharesSold,
              profit: (sellPrice - lot.price) * sharesSold,
              percentChange
            });
            
            remainingShares -= sharesSold;
          }
          
          if (position.length === 0) {
            positions.delete(ticker);
          }
        }
      });
  
    const openPositions = Array.from(positions.entries()).map(([ticker, lots]) => {
      const totalShares = lots.reduce((sum, lot) => sum + lot.shares, 0);
      const avgCost = lots.reduce((sum, lot) => sum + lot.price * lot.shares, 0) / totalShares;
      const firstLot = lots[0];
      
      const realtimeData = realtimePrices[ticker];
      const currentPrice = realtimeData?.currentPrice || avgCost;
      const currentValue = currentPrice * totalShares;
      const originalValue = avgCost * totalShares;
      
      const dollarChange = currentValue - originalValue;
      const percentChange = ((currentValue / originalValue) - 1) * 100;
  
      return {
        ticker,
        shares: totalShares,
        avgCost,
        currentPrice,
        currentValue,
        dollarChange,
        percentChange,
        dayChange: realtimeData?.change || 0,
        dayChangePercent: realtimeData?.changePercent || 0,
        volume: realtimeData?.volume,
        dayHigh: realtimeData?.dayHigh,
        dayLow: realtimeData?.dayLow,
        buyDate: firstLot.date,
        lastUpdated: new Date().toISOString()
      };
    });
  
    return { openPositions, closedPositions };
  };
  
  const { openPositions, closedPositions } = calculatePositions();

  const TransactionForm = ({ onSubmit, submitText }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label>Ticker</Label>
        <Input
          name="ticker"
          value={formState.ticker}
          onChange={handleInputChange}
          placeholder="AAPL"
          className="uppercase"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Type</Label>
        <Select onValueChange={handleSelectChange} value={formState.type}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="buy">Buy</SelectItem>
            <SelectItem value="sell">Sell</SelectItem>
            <SelectItem value="dividend">Dividend</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Price</Label>
        <Input
          type="number"
          step="0.01"
          name="price"
          value={formState.price}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Shares</Label>
        <Input
          type="number"
          step="0.01"
          name="shares"
          value={formState.shares}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => {
            resetForm();
            if (isAddDialogOpen) setIsAddDialogOpen(false);
            if (isEditDialogOpen) setIsEditDialogOpen(false);
          }}
        >
          Cancel
        </Button>
        <Button type="submit">{submitText}</Button>
      </div>
    </form>
  ); 
  const calculateSpyReturn = async (position) => {
    try {
      const startDate = position.buyDate;
      const endDate = position.sellDate || new Date().toISOString();
      
      const response = await fetch(
        `/api/stock/chart?symbol=SPY&range=custom&start=${startDate}&end=${endDate}`
      );
      const data = await response.json();
      
      if (data && data.length >= 2) {
        const spyStartPrice = data[0].close;
        const spyEndPrice = data[data.length - 1].close;
        return ((spyEndPrice - spyStartPrice) / spyStartPrice) * 100;
      }
      return 0;
    } catch (error) {
      console.error('Error calculating SPY return:', error);
      return 0;
    }
  };
  
  useEffect(() => {
    const updateSpyComparisons = async () => {
      const newSpyData = {};
      
      // Calculate for open positions
      for (const position of openPositions) {
        newSpyData[position.ticker] = await calculateSpyReturn(position);
      }
      
      // Calculate for closed positions
      for (const position of closedPositions) {
        newSpyData[position.ticker] = await calculateSpyReturn(position);
      }
      
      setSpyData(newSpyData);
    };
    
    updateSpyComparisons();
  }, [openPositions, closedPositions]);

  const calculateTotals = () => {
    const realizedProfits = closedPositions.reduce((sum, pos) => sum + pos.profit, 0);
    const unrealizedProfits = openPositions.reduce((sum, pos) => sum + pos.unrealizedProfit, 0);
    const totalInvestment = openPositions.reduce((sum, pos) => sum + (pos.avgCost * pos.shares), 0);
    const currentValue = openPositions.reduce((sum, pos) => sum + pos.currentValue, 0);
    
    const totalReturn = ((currentValue + realizedProfits) / totalInvestment - 1) * 100;

    return {
      realizedProfits,
      unrealizedProfits,
      totalInvestment,
      currentValue,
      totalReturn,
    };
  };
  const calculatePerformanceMetrics = () => {
    const winningPositions = openPositions.filter(pos => pos.unrealizedProfit > 0);
    const losingPositions = openPositions.filter(pos => pos.unrealizedProfit < 0);
    const avgWinPercent = winningPositions.length > 0 
      ? winningPositions.reduce((sum, pos) => sum + pos.percentChange, 0) / winningPositions.length 
      : 0;
    const avgLossPercent = losingPositions.length > 0
      ? losingPositions.reduce((sum, pos) => sum + pos.percentChange, 0) / losingPositions.length
      : 0;

    return {
      totalValue: totals.currentValue,
      totalCost: totals.totalInvestment,
      winRate: (winningPositions.length / openPositions.length) * 100,
      avgWinPercent,
      avgLossPercent,
      bestPerformer: openPositions.reduce((best, pos) => 
        pos.percentChange > (best?.percentChange || -Infinity) ? pos : best, null),
      worstPerformer: openPositions.reduce((worst, pos) => 
        pos.percentChange < (worst?.percentChange || Infinity) ? pos : worst, null)
    };
    };
    const calculateDiversification = () => {
        const totalValue = openPositions.reduce((sum, pos) => sum + pos.currentValue, 0);
        return openPositions.map(pos => ({
            ticker: pos.ticker,
            percentage: (pos.currentValue / totalValue) * 100,
            value: pos.currentValue
        })).sort((a, b) => b.percentage - a.percentage);
        };
  const totals = calculateTotals();
  const metrics = calculatePerformanceMetrics();
  const diversification = calculateDiversification();

  const PortfolioSummary = () => (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <HoverCard>
            <HoverCardTrigger asChild>
              <Card className="cursor-help">
                <CardContent className="pt-6">
                  <div className="text-sm font-medium">Total P/L</div>
                  <div className={cn(
                    "text-2xl font-bold",
                    (totals.realizedProfits + totals.unrealizedProfits) >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    ${(totals.realizedProfits + totals.unrealizedProfits).toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-2">
                <div className="text-sm font-medium">Profit/Loss Breakdown:</div>
                <div className="grid grid-cols-2 gap-1 text-sm">
                  <div>Realized P/L:</div>
                  <div className={totals.realizedProfits >= 0 ? 'text-green-600' : 'text-red-600'}>
                    ${totals.realizedProfits.toFixed(2)}
                  </div>
                  <div>Unrealized P/L:</div>
                  <div className={totals.unrealizedProfits >= 0 ? 'text-green-600' : 'text-red-600'}>
                    ${totals.unrealizedProfits.toFixed(2)}
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>

          <HoverCard>
            <HoverCardTrigger asChild>
              <Card className="cursor-help">
                <CardContent className="pt-6">
                  <div className="flex justify-between">
                    <div className="text-sm font-medium">Portfolio Value</div>
                  </div>
                  <div className={cn(
                    "text-2xl font-bold",
                    totals.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    ${metrics.totalValue.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Invested: ${metrics.totalCost.toFixed(2)}
                  </div>
                  <div className={cn(
                    "text-sm mt-2",
                    totals.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {totals.totalReturn.toFixed(2)}% total return
                  </div>
                </CardContent>
              </Card>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-2">
                <h4 className="font-medium">Portfolio Details</h4>
                <div className="grid grid-cols-2 gap-1 text-sm">
                  <div>Total Invested:</div>
                  <div>${metrics.totalCost.toFixed(2)}</div>
                  <div>Current Value:</div>
                  <div>${metrics.totalValue.toFixed(2)}</div>
                  <div>Realized P/L:</div>
                  <div className={totals.realizedProfits >= 0 ? 'text-green-600' : 'text-red-600'}>
                    ${totals.realizedProfits.toFixed(2)}
                  </div>
                  <div>Unrealized P/L:</div>
                  <div className={totals.unrealizedProfits >= 0 ? 'text-green-600' : 'text-red-600'}>
                    ${totals.unrealizedProfits.toFixed(2)}
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium mb-4">Statistics</div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Win Rate</span>
                  <span className="font-medium">{metrics.winRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Avg Winner</span>
                  <span className="font-medium text-green-600">
                    +{metrics.avgWinPercent.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Avg Loser</span>
                  <span className="font-medium text-red-600">
                    {metrics.avgLossPercent.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Active Positions</span>
                  <span className="font-medium">{openPositions.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Closed Positions</span>
                  <span className="font-medium">{closedPositions.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between">
                <div className="text-sm font-medium mb-4">Top Holdings</div>
              </div>
              <div className="space-y-3">
                {diversification.slice(0, 5).map((holding) => (
                  <div key={holding.ticker} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{holding.ticker}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">{holding.percentage.toFixed(1)}%</span>
                      <span className="text-muted-foreground ml-2">
                        ${holding.value.toFixed(0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium mb-4">Best & Worst Performers</div>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Best Performer</div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{metrics.bestPerformer?.ticker}</span>
                    <span className="text-sm font-medium text-green-600">
                      +{metrics.bestPerformer?.percentChange.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Worst Performer</div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{metrics.worstPerformer?.ticker}</span>
                    <span className="text-sm font-medium text-red-600">
                      {metrics.worstPerformer?.percentChange.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium">Active Positions</div>
              <div className="text-2xl font-bold">
                {openPositions.length}
              </div>
              <div className="text-sm text-muted-foreground">
                {closedPositions.length} closed positions
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );

return (
    <div className="space-y-6">
      <PortfolioSummary />
      
      <PositionTimelineChart 
        transactions={transactions}
        openPositions={openPositions}
        closedPositions={closedPositions}
      />
  
      {/* Open Positions Section */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="text-2xl font-semibold leading-none tracking-tight">Open Positions</h3>
        </div>
        <div className="p-6 pt-0">
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Ticker</TableHead>
      <TableHead>Date Opened</TableHead>
      <TableHead>Term</TableHead>
      <TableHead>Shares</TableHead>
      <TableHead>Avg. Cost</TableHead>
      <TableHead>Current Value</TableHead>
      <TableHead>$ Change</TableHead>
      <TableHead>% Change</TableHead>
      <TableHead>SPY Return</TableHead>
      <TableHead>vs SPY</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {openPositions.map(position => {
      const isLongTerm = new Date().getTime() - new Date(position.buyDate).getTime() > 365 * 24 * 60 * 60 * 1000;
      const dollarChange = position.currentValue - (position.avgCost * position.shares);
      const percentChange = ((position.currentValue / (position.avgCost * position.shares)) - 1) * 100;
      
      return (
        <TableRow key={position.ticker}>
          <TableCell className="font-medium">
            <HoverCard>
              <HoverCardTrigger asChild>
                <div className="cursor-help">
                  {position.ticker}
                  <span className={cn(
                    "ml-2 text-xs",
                    position.dayChangePercent > 0 ? 'text-green-600' : 
                    position.dayChangePercent < 0 ? 'text-red-600' : 
                    'text-yellow-600'
                  )}>
                    {position.dayChangePercent > 0 ? '+' : ''}{position.dayChangePercent?.toFixed(2)}%
                  </span>
                </div>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-2">
                  <h4 className="font-medium">{position.ticker} Daily Statistics</h4>
                  <div className="grid grid-cols-2 gap-1 text-sm">
                    <div>Day Range:</div>
                    <div>${position.dayLow?.toFixed(2)} - ${position.dayHigh?.toFixed(2)}</div>
                    <div>Volume:</div>
                    <div>{position.volume?.toLocaleString()}</div>
                    <div>Current Price:</div>
                    <div>${position.currentPrice?.toFixed(2)}</div>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          </TableCell>
          <TableCell>{format(new Date(position.buyDate), "PPP")}</TableCell>
          <TableCell>{isLongTerm ? 'Long Term' : 'Short Term'}</TableCell>
          <TableCell>{position.shares.toFixed(2)}</TableCell>
          <TableCell>${position.avgCost.toFixed(2)}</TableCell>
          <TableCell>${position.currentValue.toFixed(2)}</TableCell>
          <TableCell className={cn(
            dollarChange > 0 ? 'text-green-600' : 
            dollarChange < 0 ? 'text-red-600' : 
            'text-yellow-600'
          )}>
            ${dollarChange.toFixed(2)}
          </TableCell>
          <TableCell className={cn(
            percentChange > 0 ? 'text-green-600' : 
            percentChange < 0 ? 'text-red-600' : 
            'text-yellow-600'
          )}>
            {percentChange > 0 ? '+' : ''}{percentChange.toFixed(2)}%
          </TableCell>
          <TableCell className={spyData[position.ticker]?.spyReturn > 0 ? 'text-green-600' : 'text-red-600'}>
            {spyData[position.ticker]?.spyReturn?.toFixed(2)}%
          </TableCell>
          <TableCell className={
            (position.percentChange - spyData[position.ticker]?.spyReturn) > 0 ? 'text-green-600' : 'text-red-600'
          }>
            {((position.percentChange - spyData[position.ticker]?.spyReturn) || 0).toFixed(2)}%
          </TableCell>

        </TableRow>
      );
    })}
  </TableBody>
</Table>
        </div>
      </div>
  
      {/* Closed Positions Section */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="text-2xl font-semibold leading-none tracking-tight">Closed Positions</h3>
        </div>
        <div className="p-6 pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticker</TableHead>
                <TableHead>Buy Date</TableHead>
                <TableHead>Sell Date</TableHead>
                <TableHead>Shares</TableHead>
                <TableHead>Buy Price</TableHead>
                <TableHead>Sell Price</TableHead>
                <TableHead>P/L</TableHead>
                <TableHead>% Change</TableHead>
                <TableHead>SPY Return</TableHead>
                <TableHead>vs SPY</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {closedPositions.map((position, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{position.ticker}</TableCell>
                  <TableCell>{format(new Date(position.buyDate), "PPP")}</TableCell>
                  <TableCell>{format(new Date(position.sellDate), "PPP")}</TableCell>
                  <TableCell>{position.shares}</TableCell>
                  <TableCell>${position.buyPrice.toFixed(2)}</TableCell>
                  <TableCell>${position.sellPrice.toFixed(2)}</TableCell>
                  <TableCell 
                    className={position.profit >= 0 ? 'text-green-600' : 'text-red-600'}
                  >
                    ${position.profit.toFixed(2)}
                  </TableCell>
                  <TableCell 
                    className={position.percentChange >= 0 ? 'text-green-600' : 'text-red-600'}
                  >
                    {position.percentChange.toFixed(2)}%
                  </TableCell>
                  <TableCell className={spyData[position.ticker]?.spyReturn > 0 ? 'text-green-600' : 'text-red-600'}>
                    {spyData[position.ticker]?.spyReturn?.toFixed(2)}%
                  </TableCell>
                  <TableCell className={
                    (position.percentChange - spyData[position.ticker]?.spyReturn) > 0 ? 'text-green-600' : 'text-red-600'
                  }>
                    {((position.percentChange - spyData[position.ticker]?.spyReturn) || 0).toFixed(2)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

            {/* Transaction Log Section */}
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col space-y-1.5 p-6">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-semibold leading-none tracking-tight">Transaction Log</h3>
            <div className="flex items-center space-x-2">
                                <div className="w-64">
                        <Input
                        placeholder="Filter by ticker..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-full"
                        />
                    </div>
                    <TooltipProvider>
                        <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" onClick={handleExportTransactions}>
                            <Download className="mr-2 h-4 w-4" />
                            Export
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Export transactions as JSON</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                        <Tooltip>
                        <TooltipTrigger asChild>
                            <ImportButton />
                        </TooltipTrigger>
                        <TooltipContent>Import transactions from JSON</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Transaction
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Transaction</DialogTitle>
                  </DialogHeader>
                  <TransactionForm onSubmit={handleSubmit} submitText="Add Transaction" />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
        <div className="p-6 pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('date')}
                    className="w-full text-left font-medium"
                  >
                    Date {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('ticker')}
                    className="w-full text-left font-medium"
                  >
                    Ticker {sortConfig.key === 'ticker' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </Button>
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Shares</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getFilteredTransactions().map(transaction => (
                <TableRow key={transaction.id}>
                  <TableCell>{format(new Date(transaction.date), "PPP")}</TableCell>
                  <TableCell>{transaction.ticker}</TableCell>
                  <TableCell className="capitalize">{transaction.type}</TableCell>
                  <TableCell>${transaction.price.toFixed(2)}</TableCell>
                  <TableCell>{transaction.shares}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEdit(transaction)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit transaction</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleDelete(transaction)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete transaction</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
  
      {/* Dialogs */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          <TransactionForm onSubmit={saveEdit} submitText="Save Changes" />
        </DialogContent>
      </Dialog>
  
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )

} 
export default StockLog;
