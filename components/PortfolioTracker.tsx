'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Transaction,
  Position,
  ClosedPosition,
  PortfolioMetrics,
  PortfolioTotals,
  ApiResponse,
  MarketData, 
  StockQuote
} from '@/lib/types';

// Component imports
import PortfolioSummary from './PortfolioSummary';
import PositionTimelineChart from './charts/position-timeline/PositionTimeLineChart';
import OpenPositionsTable from './OpenPositionsTable';
import ClosedPositionsTable from './ClosedPositionsTable';
import TransactionTable from './TransactionTable';

// Storage helpers with proper typing
const getLocalStorage = <T,>(key: string, defaultValue: T): T => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  }
  return defaultValue;
};

const setLocalStorage = <T,>(key: string, value: T): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

const PortfolioTracker = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => 
    getLocalStorage<Transaction[]>('stockTransactions', [])
  );
  const [realtimePrices, setRealtimePrices] = useState<MarketData>({});
  const [spyData, setSpyData] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  
    // Wrap calculatePositions in useCallback
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
                holdingPeriod
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
          lastUpdated: new Date().toISOString()
        };
      });
  
      return { openPositions, closedPositions };
    }, [transactions, realtimePrices, spyData]);

    // Wrap calculateMetrics in useCallback
    const calculateSectorMetrics = (positions: Position[]): SectorMetric[] => {
      const totalValue = positions.reduce((sum, pos) => sum + pos.currentValue, 0);
      
      const sectorMap = positions.reduce((map, pos) => {
        const existing = map.get(pos.sector) || { value: 0, return: 0, count: 0 };
        map.set(pos.sector, {
          value: existing.value + pos.currentValue,
          return: existing.return + pos.percentChange,
          count: existing.count + 1
        });
        return map;
      }, new Map<string, { value: number; return: number; count: number }>());
    
      return Array.from(sectorMap.entries()).map(([name, data]) => ({
        name,
        allocation: (data.value / totalValue) * 100,
        return: data.return / data.count,
        positions: data.count
      }));
    };
    
    const calculateIndustryMetrics = (positions: Position[]): IndustryMetric[] => {
      const totalValue = positions.reduce((sum, pos) => sum + pos.currentValue, 0);
      
      const industryMap = positions.reduce((map, pos) => {
        const existing = map.get(pos.industry) || { value: 0, return: 0, count: 0, sector: pos.sector };
        map.set(pos.industry, {
          value: existing.value + pos.currentValue,
          return: existing.return + pos.percentChange,
          count: existing.count + 1,
          sector: pos.sector
        });
        return map;
      }, new Map<string, { value: number; return: number; count: number; sector: string }>());
    
      return Array.from(industryMap.entries()).map(([name, data]) => ({
        name,
        allocation: (data.value / totalValue) * 100,
        return: data.return / data.count,
        positions: data.count,
        sector: data.sector
      }));
    };
    
    const calculateMetrics = useCallback(() => {
      const { openPositions, closedPositions } = calculatePositions();
      
      const realizedProfits = closedPositions.reduce((sum, pos) => sum + pos.profit, 0);
      const unrealizedProfits = openPositions.reduce((sum, pos) => sum + pos.dollarChange, 0);
      const totalInvestment = openPositions.reduce((sum, pos) => sum + (pos.avgCost * pos.shares), 0);
      const currentValue = openPositions.reduce((sum, pos) => sum + pos.currentValue, 0);
      
      const totals: PortfolioTotals = {
        realizedProfits,
        unrealizedProfits,
        totalInvestment,
        currentValue,
        totalReturn: totalInvestment > 0 ? ((currentValue + realizedProfits) / totalInvestment - 1) * 100 : 0
      };
    
      const winningPositions = closedPositions.filter(pos => pos.profit > 0);
      const losingPositions = closedPositions.filter(pos => pos.profit < 0);
      
      // Calculate max drawdown using peak to trough
      const values = openPositions.map(pos => pos.currentValue / (pos.avgCost * pos.shares));
      let maxDrawdown = 0;
      let peak = values[0] || 1;
      
      values.forEach(value => {
        if (value > peak) peak = value;
        const drawdown = (peak - value) / peak * 100;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
      });
    
      const metrics: PortfolioMetrics = {
        totalValue: currentValue,
        totalCost: totalInvestment,
        winRate: (winningPositions.length / (winningPositions.length + losingPositions.length)) * 100 || 0,
        avgWinPercent: winningPositions.length > 0 
          ? winningPositions.reduce((sum, pos) => sum + pos.percentChange, 0) / winningPositions.length 
          : 0,
        avgLossPercent: losingPositions.length > 0
          ? losingPositions.reduce((sum, pos) => sum + pos.percentChange, 0) / losingPositions.length
          : 0,
        bestPerformer: openPositions.length > 0 
          ? openPositions.reduce((best, pos) => 
              pos.percentChange > best.percentChange ? pos : best
            , openPositions[0])
          : null,
        worstPerformer: openPositions.length > 0
          ? openPositions.reduce((worst, pos) => 
              pos.percentChange < worst.percentChange ? pos : worst
            , openPositions[0])
          : null,
        avgHoldingPeriodWinners: winningPositions.length > 0
          ? Math.floor(winningPositions.reduce((sum, pos) => sum + pos.holdingPeriod, 0) / winningPositions.length)
          : 0,
        maxDrawdown,
        portfolioBeta: 1,
        sharpeRatio: 0,
        cashBalance: 0,
        buyingPower: 0,
        sectorMetrics: [],
        industryMetrics: []
      };
    
      return { metrics, totals, openPositions, closedPositions };
    }, [calculatePositions]);
  // Fetch realtime prices with calculatePositions in dependencies
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
  
        const symbols = uniqueTransactions.join(',');
        const buyDates = symbolBuyDates.join(',');
        
        const response = await fetch(`/api/stock/realtime?symbols=${symbols}&buyDates=${buyDates}`);
        const data = await response.json() as ApiResponse;
        
        if (data.quotes) {
          const priceMap = data.quotes.reduce((acc: MarketData, quote: StockQuote) => ({
            ...acc,
            [quote.symbol]: {
              currentPrice: quote.currentPrice,
              change: quote.change,
              changePercent: quote.changePercent,
              volume: quote.volume,
              dayHigh: quote.dayHigh,
              dayLow: quote.dayLow,
              peRatio: quote.peRatio,
              forwardPE: quote.forwardPE,
              industryPE: quote.industryPE
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
        console.error('Error fetching prices:', error);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchPrices();
    const interval = setInterval(fetchPrices, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, [transactions]);

  // SPY comparison effect with calculatePositions in dependencies
  useEffect(() => {
    const { openPositions, closedPositions } = calculatePositions();
    
    const updateSpyComparisons = async () => {
      // ... rest of SPY comparison code
    };
    
    if (openPositions.length > 0 || closedPositions.length > 0) {
      updateSpyComparisons();
    }
  }, [transactions, calculatePositions]); // Added calculatePositions to dependencies

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
    return <div>Loading portfolio data...</div>;
  }

  return (
    <div className="space-y-1">
      <h1 className="text-xl font-bold px-2 py-0.5">Portfolio Tracker</h1>
      <PortfolioSummary
        metrics={metrics}
        totals={totals}
        openPositions={openPositions}
        closedPositions={closedPositions}
      />
      <div className="mt-1">
        <PositionTimelineChart 
          transactions={transactions}
          openPositions={openPositions}
          closedPositions={closedPositions}
        />
      </div>
      <div className="space-y-1">
        <OpenPositionsTable positions={openPositions} />
        <ClosedPositionsTable positions={closedPositions} />
        <TransactionTable
          transactions={transactions}
          onTransactionAdd={handleTransactionAdd}
          onTransactionEdit={handleTransactionEdit}
          onTransactionDelete={handleTransactionDelete}
          onTransactionsDeleteAll={handleTransactionsDeleteAll}
        />
      </div>
    </div>
  );
};
//test
export default PortfolioTracker;