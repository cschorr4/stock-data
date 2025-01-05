'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {  Menu } from 'lucide-react';
// import {Layout, LineChart, CheckSquare, History, Settings} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import PortfolioSummary from './portfolio/PortfolioSummary';
import PositionTimelineChart from './charts/position-timeline/PositionTimeLineChart';
import { storageService } from '@/lib/supabase-storage';
import TransactionTable from './tables/TransactionTable';
import TransactionForm from './tables/TransactionForm';
import { setLocalStorage } from '@/lib/storage';
import { fetchWithRetry } from '@/lib/fetch-helpers';
import OpenPositionsTable from './tables/OpenPositionsTable'
import ClosedPositionsTable from './tables/ClosedPositionsTable'
import { motion, AnimatePresence } from 'framer-motion';
import SideNav from './layout/SideNav';
import { calculateMetricsFromPositions } from './portfolio/utils/portfolio-utils';
// import { fr } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { FinancialData } from '@/lib/types';
import FinancialViewer from './tables/FinancialViewer';
import LoadingScreen from '@/components/LoadingScreen';
import { toast } from './ui/use-toast';
import { useAuth } from '@/components/hooks/useAuth';
import { LOCAL_STORAGE_KEY } from '@/lib/storage';
import { 
  Transaction, 
  TransactionFormData,
  Position, 
  ClosedPosition,
  PortfolioMetrics, 
  PortfolioTotals, 
  MarketData, 
  StockQuote, 
  SectorKey 
} from '@/lib/types';

type ViewType = 'overview' | 'open-positions' | 'closed-positions' | 'transactions' | 'financials';

const PortfolioTracker = () => {
  // States
  const { getCurrentUser } = useAuth();
  const [realtimePrices, setRealtimePrices] = useState<MarketData>({});
  const [spyData, setSpyData] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedView, setSelectedView] = useState<ViewType>('overview');  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [financialLoading, setFinancialLoading] = useState(false);
  const [financialError, setFinancialError] = useState('');
  const [symbolInput, setSymbolInput] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const fetchStockData = useCallback(async (symbols: string[], buyDates: string[]) => {
    try {
      const response = await fetchWithRetry(
        `/api/stock/realtime?symbols=${symbols.join(',')}&buyDates=${buyDates.join(',')}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching stock data:', error);
      return {
        quotes: symbols.map(symbol => ({
          symbol,
          currentPrice: 0,
          change: 0,
          changePercent: 0,
          volume: 0,
          dayHigh: 0,
          dayLow: 0
        }))
      };
    }
  }, []);

  const fetchFinancialData = useCallback(async (symbol: string) => {
    try {
      setFinancialLoading(true);
      setFinancialError('');
      const response = await fetchWithRetry(`/api/stock/financials?symbol=${symbol.toUpperCase()}`);
      const data = await response.json();
      
      if (data.status === 'error') throw new Error(data.error);
      setFinancialData(data);
    } catch (error) {
      setFinancialError(error instanceof Error ? error.message : 'Failed to fetch data');
    } finally {
      setFinancialLoading(false);
    }
  }, []);

  const calculatePositions = useCallback(() => {
    const positions = new Map<string, Array<{
      price: number;
      shares: number;
      date: string;
      holdingPeriod: number;
    }>>();
    const closedPositions: ClosedPosition[] = [];
    
    transactions
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach(transaction => {
        const { ticker, type, price, shares, date } = transaction;
        const numericPrice = parseFloat(price.toString());
        const numericShares = parseFloat(shares.toString());
        
        if (type === 'buy') {
          if (!positions.has(ticker)) {
            positions.set(ticker, []);
          }
          positions.get(ticker)?.push({ 
            price: numericPrice,
            shares: numericShares,
            date,
            holdingPeriod: Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
          });
        } else if (type === 'sell') {
          let remainingShares = numericShares;
          const position = positions.get(ticker) || [];
          const sellPrice = numericPrice;
          
          while (remainingShares > 0 && position.length > 0) {
            const lot = position[0];
            const sharesSold = Math.min(remainingShares, lot.shares);
            const percentChange = ((sellPrice - lot.price) / lot.price) * 100;
            const holdingPeriod = Math.floor((new Date(date).getTime() - new Date(lot.date).getTime()) / (1000 * 60 * 60 * 24));
            
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
              percentChange,
              holdingPeriod,
              spyReturn: spyData[ticker] || 0,
              sector: realtimePrices[ticker]?.sector as SectorKey || 'Unknown' as SectorKey,
              industry: realtimePrices[ticker]?.industry || 'Unknown'
            });
            
            remainingShares -= sharesSold;
          }
          
          if (position.length === 0) {
            positions.delete(ticker);
          }
        }
      });

    const openPositions: Position[] = Array.from(positions.entries()).map(([ticker, lots]) => {
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
        peRatio: realtimeData?.peRatio,
        forwardPE: realtimeData?.forwardPE,
        industryPE: realtimeData?.industryPE,
        spyReturn: spyData[ticker] || 0,
        buyDate: firstLot.date,
        lastUpdated: new Date().toISOString(),
        sector: realtimeData?.sector as SectorKey || 'Unknown' as SectorKey,   
        industry: realtimeData?.industry || 'Unknown' 
      };
    });

    return { openPositions, closedPositions };
  }, [transactions, realtimePrices, spyData]);

  const calculateMetrics = useCallback(() => {
    const { openPositions, closedPositions } = calculatePositions();
    
    const totalValueOpen = openPositions.reduce((sum, pos) => sum + pos.currentValue, 0);
    const totalCostOpen = openPositions.reduce((sum, pos) => sum + (pos.avgCost * pos.shares), 0);
    const realizedProfits = closedPositions.reduce((sum, pos) => sum + pos.profit, 0);
    const unrealizedProfits = openPositions.reduce((sum, pos) => sum + pos.dollarChange, 0);
        
    const totals: PortfolioTotals = {
      realizedProfits,
      unrealizedProfits,
      totalInvestment: totalCostOpen,
      currentValue: totalValueOpen,
      totalReturn: totalCostOpen > 0 ? ((totalValueOpen + realizedProfits) / totalCostOpen - 1) * 100 : 0
    };
  
    const winningPositions = closedPositions.filter(pos => pos.profit > 0);
    const losingPositions = closedPositions.filter(pos => pos.profit < 0);
    
    const { sectorMetrics, industryMetrics } = calculateDiversificationMetrics(openPositions);
    const { portfolioBeta, maxDrawdown, sharpeRatio } = calculateMetricsFromPositions(openPositions);
  
    const metrics: PortfolioMetrics = {
      totalValue: totalValueOpen,
      totalCost: totalCostOpen,
      winRate: (winningPositions.length / (winningPositions.length + losingPositions.length)) * 100 || 0,
      avgWinPercent: winningPositions.length > 0 
        ? winningPositions.reduce((sum, pos) => sum + pos.percentChange, 0) / winningPositions.length 
        : 0,
      avgLossPercent: losingPositions.length > 0
        ? losingPositions.reduce((sum, pos) => sum + pos.percentChange, 0) / losingPositions.length
        : 0,
      bestPerformer: openPositions.length > 0 
        ? openPositions.reduce((best, pos) => pos.percentChange > best.percentChange ? pos : best, openPositions[0])
        : null,
      worstPerformer: openPositions.length > 0
        ? openPositions.reduce((worst, pos) => pos.percentChange < worst.percentChange ? pos : worst, openPositions[0])
        : null,
      avgHoldingPeriodWinners: winningPositions.length > 0
        ? Math.floor(winningPositions.reduce((sum, pos) => sum + pos.holdingPeriod, 0) / winningPositions.length)
        : 0,
      maxDrawdown,
      portfolioBeta,
      sharpeRatio,
      cashBalance: 0,
      buyingPower: 0,
      sectorMetrics,
      industryMetrics
    };
  
    return { metrics, totals, openPositions, closedPositions };
  }, [calculatePositions]);

  const [transactionsLoading, setTransactionsLoading] = useState(true);

useEffect(() => {
  const loadInitialTransactions = async () => {
    setTransactionsLoading(true);
    try {
      const loadedTransactions = await storageService.loadTransactions();
      setTransactions(loadedTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load transactions",
      });
    } finally {
      setTransactionsLoading(false);
    }
  };

  loadInitialTransactions();
}, []);

  useEffect(() => {
    const fetchPrices = async () => {
      const uniqueTransactions = transactions
        .map(t => t.ticker)
        .filter((ticker, index, array) => array.indexOf(ticker) === index);
        
      if (uniqueTransactions.length === 0) {
        setIsLoading(false);
        return;
      }
      
      try {
        const symbolBuyDates = uniqueTransactions.map(ticker => {
          const firstBuy = transactions
            .filter(t => t.ticker === ticker && t.type === 'buy')
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
          return firstBuy?.date || new Date().toISOString();
        });
  
        const data = await fetchStockData(uniqueTransactions, symbolBuyDates);
        
        if (data.quotes) {
          const priceMap = data.quotes.reduce((acc: MarketData, quote: StockQuote) => ({
            ...acc,
            [quote.symbol]: {
              currentPrice: quote.currentPrice || 0,
              change: quote.change || 0,
              changePercent: quote.changePercent || 0,
              volume: quote.volume || 0,
              dayHigh: quote.dayHigh || 0,
              dayLow: quote.dayLow || 0,
              peRatio: quote.peRatio,
              forwardPE: quote.forwardPE,
              industryPE: quote.industryPE,
              sector: quote.sector || 'Unknown',
              industry: quote.industry || 'Unknown',
            }
          }), {} as MarketData);
          
          setRealtimePrices(priceMap);
  
          const spyComparisons = data.quotes.reduce((acc: Record<string, number>, quote: StockQuote) => ({
            ...acc,
            [quote.symbol]: quote.spyReturn || 0
          }), {});
          
          setSpyData(spyComparisons);
        }
      } catch (error) {
        console.error('Error in price fetching:', error);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchPrices();
    const interval = setInterval(fetchPrices, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, [transactions, fetchStockData]);
  
  const handleTransactionAdd = async (formData: TransactionFormData) => {
    try {
      const user = await getCurrentUser();
      const newTransaction: Transaction = {
        ...formData,  // Spread the base form data
        id: crypto.randomUUID(),  // UUID string
        user_id: user.id,
        total_amount: formData.price * formData.shares
      };
  
      const updatedTransactions = [...transactions, newTransaction];
      setTransactions(updatedTransactions);
      
      try {
        await storageService.saveTransactions(updatedTransactions);
        setLocalStorage(LOCAL_STORAGE_KEY, updatedTransactions);
        toast({
          title: "Success",
          description: "Transaction added successfully",
        });
      } catch (error) {
        console.error('Storage error:', error);
        toast({
          variant: "destructive",
          title: "Warning",
          description: "Transaction saved locally but failed to sync to cloud",
        });
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add transaction. Please try again.",
      });
    }
  };

  const handleSync = async () => {
    try {
      setIsLoading(true);
      
      // First try to get user to check authentication
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('Please login to sync transactions');
      }
  
      await storageService.syncWithSupabase();
      toast({
        title: "Success",
        description: "Transactions synced successfully",
      });
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync transactions",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSymbolChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSymbolInput(value.toUpperCase());
  };

  const handleTransactionEdit = async (transaction: Transaction) => {
    const updatedTransactions = transactions.map(t => 
      t.id === transaction.id ? transaction : t
    );
    setTransactions(updatedTransactions);
    setLocalStorage(LOCAL_STORAGE_KEY, updatedTransactions);
    await storageService.saveTransactions(updatedTransactions);
  };
  

  const handleTransactionDelete = async (id: string) => {
    const updatedTransactions = transactions.filter(t => t.id !== id);
    setTransactions(updatedTransactions);
    setLocalStorage(LOCAL_STORAGE_KEY, updatedTransactions);
    await storageService.saveTransactions(updatedTransactions);
  };

  const handleTransactionsDeleteAll = async () => {
    setTransactions([]);
    setLocalStorage(LOCAL_STORAGE_KEY, []);
    await storageService.saveTransactions([]);
  };

  
  const MainContent = () => {
    const { metrics, totals, openPositions, closedPositions } = calculateMetrics();
  
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedView}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {(() => {
            switch (selectedView) {
              case 'overview':
                return (
                  <motion.div layout>
                    <section className="bg-card rounded-lg shadow-sm mb-6">
                      <PortfolioSummary 
                        metrics={metrics} 
                        totals={totals} 
                        openPositions={openPositions} 
                        closedPositions={closedPositions} 
                      />
                    </section>
                    <section className="bg-card rounded-lg shadow-sm">
                      <div className="grid grid-cols-1 gap-4 p-4">
                        <PositionTimelineChart 
                          transactions={transactions}
                          openPositions={openPositions} 
                          closedPositions={closedPositions} 
                        />
                      </div>
                    </section>
                  </motion.div>
                );
              case 'open-positions':
                return (
                  <motion.section className="bg-card rounded-lg shadow-sm" layout>
                    <OpenPositionsTable positions={openPositions} />
                  </motion.section>
                );
              case 'closed-positions':
                return (
                  <motion.section className="bg-card rounded-lg shadow-sm" layout>
                    <ClosedPositionsTable positions={closedPositions} />
                  </motion.section>
                );
              case 'transactions':
                return (
                  <motion.section className="bg-card rounded-lg shadow-sm" layout>
                    <TransactionTable
        transactions={transactions}
        onTransactionAdd={handleTransactionAdd}
        onTransactionEdit={handleTransactionEdit}
        onTransactionDelete={handleTransactionDelete}
        onTransactionsDeleteAll={handleTransactionsDeleteAll}
        onSync={handleSync}
      />
    </motion.section>
                );
                case 'financials':
  return (
    <motion.section className="bg-card rounded-lg shadow-sm p-4">
      <div className="flex gap-2 mb-4">
      <Input 
  key="symbol-input"
  value={symbolInput}
  onChange={handleSymbolChange}
  placeholder="Enter stock symbol (e.g. AAPL)"
  onKeyDown={(e) => e.key === 'Enter' && fetchFinancialData(symbolInput)}
  className="w-full"
/>
        <Button onClick={() => fetchFinancialData(symbolInput)}>
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>
      {financialLoading && <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>}
      {financialError && <div className="text-red-500">{financialError}</div>}
      {financialData && <FinancialViewer data={financialData} />}
    </motion.section>
  );
            }
          })()}
        </motion.div>
      </AnimatePresence>
    );
  };

  if (isLoading || transactionsLoading) {
    return (
      <LoadingScreen />
    );
  }

  return (
    <div className="flex h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden sm:block">
        <SideNav 
          selectedView={selectedView}
          setSelectedView={setSelectedView}
          setIsAddDialogOpen={setIsAddDialogOpen}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-[1600px] mx-auto p-3">
          <MainContent />
        </div>
      </main>

      {/* Mobile Nav */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="sm:hidden fixed top-4 left-4 z-40"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-52 p-0">
          <SideNav 
            selectedView={selectedView}
            setSelectedView={setSelectedView}
            setIsAddDialogOpen={setIsAddDialogOpen}
            setIsMobileOpen={setIsMobileOpen}
          />
        </SheetContent>
      </Sheet>

      {/* Add Transaction Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Transaction</DialogTitle>
          </DialogHeader>
          <TransactionForm
            onSubmit={(transaction) => {
              handleTransactionAdd(transaction);
              setIsAddDialogOpen(false);
            }}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};


// Helper function for diversification metrics
const calculateDiversificationMetrics = (positions: Position[]) => {
  const totalValue = positions.reduce((sum, pos) => sum + pos.currentValue, 0);
  
  // Sector metrics
  const sectorGroups = positions.reduce((acc, pos) => {
    const sector = pos.sector || 'Unknown';
    if (!acc[sector]) {
      acc[sector] = { value: 0, positions: 0, return: 0 };
    }
    acc[sector].value += pos.currentValue;
    acc[sector].positions += 1;
    acc[sector].return += pos.percentChange;
    return acc;
  }, {} as Record<string, { value: number; positions: number; return: number; }>);

  const sectorMetrics = Object.entries(sectorGroups).map(([name, data]) => ({
    name,
    allocation: (data.value / totalValue) * 100,
    return: data.return / data.positions,
    positions: data.positions
  }));

  // Industry metrics
  const industryGroups = positions.reduce((acc, pos) => {
    const industry = pos.industry || 'Unknown';
    if (!acc[industry]) {
      acc[industry] = { value: 0, positions: 0, return: 0, sector: pos.sector || 'Unknown' };
    }
    acc[industry].value += pos.currentValue;
    acc[industry].positions += 1;
    acc[industry].return += pos.percentChange;
    return acc;
  }, {} as Record<string, { value: number; positions: number; return: number; sector: string; }>);

  const industryMetrics = Object.entries(industryGroups).map(([name, data]) => ({
    name,
    allocation: (data.value / totalValue) * 100,
    return: data.return / data.positions,
    positions: data.positions,
    sector: data.sector
  }));

  return { sectorMetrics, industryMetrics };
};

export default PortfolioTracker;