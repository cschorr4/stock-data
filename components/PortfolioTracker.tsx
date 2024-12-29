'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Transaction, Position, ClosedPosition, PortfolioMetrics, PortfolioTotals, MarketData, StockQuote } from '@/lib/types';
import PortfolioSummary from './portfolio/PortfolioSummary';
import PositionTimelineChart from './charts/position-timeline/PositionTimeLineChart';
import TransactionTable from './TransactionTable';
import TransactionForm from './TransactionForm';
import { getLocalStorage, setLocalStorage } from '@/lib/storage';
import { fetchWithRetry } from '@/lib/fetch-helpers';
import PositionTables from './portfolio/PositionTables';
import { calculateMetricsFromPositions } from './portfolio/utils/portfolio-utils';

const PortfolioTracker = () => {
  // States
  const [transactions, setTransactions] = useState<Transaction[]>(() => 
    getLocalStorage<Transaction[]>('stockTransactions', [])
  );
  const [realtimePrices, setRealtimePrices] = useState<MarketData>({});
  const [spyData, setSpyData] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

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
              spyReturn: spyData[ticker] || 0
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
        sector: realtimeData?.sector || 'Unknown',   
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

  // Transaction handlers
  const handleTransactionAdd = (transaction: Transaction) => {
    const updatedTransactions = [...transactions, { ...transaction, id: Date.now() }];
    setTransactions(updatedTransactions);
    setLocalStorage('stockTransactions', updatedTransactions);
  };

  const handleTransactionEdit = (transaction: Transaction) => {
    const updatedTransactions = transactions.map(t => 
      t.id === transaction.id ? transaction : t
    );
    setTransactions(updatedTransactions);
    setLocalStorage('stockTransactions', updatedTransactions);
  };

  const handleTransactionDelete = (id: number) => {
    const updatedTransactions = transactions.filter(t => t.id !== id);
    setTransactions(updatedTransactions);
    setLocalStorage('stockTransactions', updatedTransactions);
  };

  const handleTransactionsDeleteAll = () => {
    setTransactions([]);
    setLocalStorage('stockTransactions', []);
  };

  const { metrics, totals, openPositions, closedPositions } = calculateMetrics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:space-y-12">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Portfolio Tracker</h1>
          <Button 
            size="sm"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </header>
    
      <section className="bg-card rounded-lg shadow-sm">
        <PortfolioSummary
          metrics={metrics}
          totals={totals}
          openPositions={openPositions}
          closedPositions={closedPositions}
        />
      </section>
      
      <section className="bg-card rounded-lg shadow-sm">
        <div className="h-[460px] md:h-[525px] p-4">
          <PositionTimelineChart 
            transactions={transactions}
            openPositions={openPositions}
            closedPositions={closedPositions}
          />
        </div>
      </section>
      
      <section className="bg-card rounded-lg shadow-sm">
        <PositionTables 
          openPositions={openPositions}
          closedPositions={closedPositions}
        />
      </section>
      
      <section className="bg-card rounded-lg shadow-sm">
      <TransactionTable
          transactions={transactions}
          onTransactionAdd={handleTransactionAdd}
          onTransactionEdit={handleTransactionEdit}
          onTransactionDelete={handleTransactionDelete}
          onTransactionsDeleteAll={handleTransactionsDeleteAll}
        />
      </section>

      {/* Add Transaction Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Transaction</DialogTitle>
          </DialogHeader>
          <TransactionForm
            onSubmit={(transaction: Transaction) => {
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

// Helper functions
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