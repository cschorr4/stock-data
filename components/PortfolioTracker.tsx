'use client';

import React, { useState, useEffect } from 'react';
import { format } from "date-fns";
import {
  Transaction,
  Position,
  ClosedPosition,
  PortfolioMetrics,
  PortfolioTotals,
  MarketData
} from '@/lib/types';

// Component imports
import PortfolioSummary from './PortfolioSummary';
import PositionTimelineChart from './charts/position-timeline/PositionTimelineChart';
import OpenPositionsTable from './OpenPositionsTable';
import ClosedPositionsTable from './ClosedPositionsTable';
import TransactionTable from './TransactionTable';

// Storage helpers
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

const PortfolioTracker = () => {
  // State management
  const [transactions, setTransactions] = useState<Transaction[]>(() => 
    getLocalStorage('stockTransactions', [])
  );
  const [realtimePrices, setRealtimePrices] = useState<MarketData>({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch realtime prices
  // Replace the existing price fetching useEffect with this:
useEffect(() => {
    const fetchPrices = async () => {
      const uniqueTransactions = [...new Set(transactions.map(t => t.ticker))];
      if (uniqueTransactions.length === 0) {
        setIsLoading(false);
        return;
      }
      
      try {
        // Get the earliest buy date for each symbol
        const symbolBuyDates = uniqueTransactions.map(ticker => {
          const firstBuy = transactions
            .filter(t => t.ticker === ticker && t.type === 'buy')
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
          return firstBuy?.date || new Date().toISOString();
        });
  
        const symbols = uniqueTransactions.join(',');
        const buyDates = symbolBuyDates.join(',');
        
        const response = await fetch(`/api/stock/realtime?symbols=${symbols}&buyDates=${buyDates}`);
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
              dayLow: quote.dayLow,
              peRatio: quote.peRatio,
              forwardPE: quote.forwardPE,
              industryPE: quote.industryPE
            }
          }), {});
          
          setRealtimePrices(priceMap);
  
          // Update SPY comparison data
          const spyComparisons = data.quotes.reduce((acc, quote) => ({
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

  // Calculate positions with improved handling
  const calculatePositions = () => {
    const positions = new Map();
    const closedPositions: ClosedPosition[] = [];
    
    // Sort transactions by date for accurate FIFO processing
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
          positions.get(ticker).push({ 
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

    // Convert position map to array with calculated metrics
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
          spyReturn: realtimeData?.spyReturn,
          buyDate: firstLot.date,
          lastUpdated: new Date().toISOString()
        };
    });

    return { openPositions, closedPositions };
  };

  // Calculate performance metrics
  const calculateMetrics = () => {
    const { openPositions, closedPositions } = calculatePositions();
    
    const realizedProfits = closedPositions.reduce((sum, pos) => sum + pos.profit, 0);
    const unrealizedProfits = openPositions.reduce((sum, pos) => sum + pos.dollarChange, 0);
    const totalInvestment = openPositions.reduce((sum, pos) => sum + (pos.avgCost * pos.shares), 0);
    const currentValue = openPositions.reduce((sum, pos) => sum + pos.currentValue, 0);
    const cashBalance = 0; // TODO: Implement cash balance tracking
    
    const totals: PortfolioTotals = {
      realizedProfits,
      unrealizedProfits,
      totalInvestment,
      currentValue,
      totalReturn: ((currentValue + realizedProfits) / totalInvestment - 1) * 100
    };

    // Calculate win/loss metrics
    const winningPositions = closedPositions.filter(pos => pos.profit > 0);
    const losingPositions = closedPositions.filter(pos => pos.profit < 0);
    
    const metrics: PortfolioMetrics = {
      totalValue: currentValue,
      totalCost: totalInvestment,
      cashBalance,
      winRate: (winningPositions.length / (winningPositions.length + losingPositions.length)) * 100 || 0,
      avgWinPercent: winningPositions.length > 0 
        ? winningPositions.reduce((sum, pos) => sum + pos.percentChange, 0) / winningPositions.length 
        : 0,
      avgLossPercent: losingPositions.length > 0
        ? losingPositions.reduce((sum, pos) => sum + pos.percentChange, 0) / losingPositions.length
        : 0,
      bestPerformer: openPositions.reduce((best, pos) => 
        pos.percentChange > (best?.percentChange || -Infinity) ? pos : best, null),
      worstPerformer: openPositions.reduce((worst, pos) => 
        pos.percentChange < (worst?.percentChange || Infinity) ? pos : worst, null),
      avgHoldingPeriodWinners: winningPositions.length > 0
        ? Math.floor(winningPositions.reduce((sum, pos) => sum + pos.holdingPeriod, 0) / winningPositions.length)
        : 0
    };

    return { metrics, totals, openPositions, closedPositions };
  };

  // SPY comparison data with improved error handling and caching
  useEffect(() => {
    const { openPositions, closedPositions } = calculatePositions();
    
    const updateSpyComparisons = async () => {
      const newSpyData: Record<string, number> = {};
      const cache = new Map<string, number>();
      
      const calculateReturn = async (startDate: string, endDate: string): Promise<number> => {
        console.log(`Calculating SPY return for start: ${startDate}, end: ${endDate}`);
        const cacheKey = `${startDate}-${endDate}`;
        if (cache.has(cacheKey)) {
          return cache.get(cacheKey)!;
        }
      
        try {
          const response = await fetch(
            `/api/stock/chart?symbol=SPY&range=custom&start=${startDate}&end=${endDate}`
          );
      
          if (!response.ok) {
            console.error(`SPY data fetch failed: ${response.statusText}`);
            return 0;
          }
      
          const data = await response.json();
          if (data && data.length >= 2) {
            const spyStartPrice = data[0].close;
            const spyEndPrice = data[data.length - 1].close;
            console.log(`SPY data fetched successfully: startPrice=${spyStartPrice}, endPrice=${spyEndPrice}`);
            const returnValue = ((spyEndPrice - spyStartPrice) / spyStartPrice) * 100;
            cache.set(cacheKey, returnValue);
            return returnValue;
          } else {
            console.error('SPY data insufficient:', data);
            return 0;
          }
        } catch (error) {
          console.error('Error calculating SPY return:', error);
          return 0;
        }
      };
      
      
      // Process all positions in parallel for better performance
      const positions = [...openPositions, ...closedPositions];
      const calculations = positions.map(async position => {
        const startDate = position.buyDate;
        const endDate = 'sellDate' in position ? position.sellDate : new Date().toISOString();
        const spyReturn = await calculateReturn(startDate, endDate);
        return { ticker: position.ticker, spyReturn };
      });

      try {
        const results = await Promise.all(calculations);
        results.forEach(({ ticker, spyReturn }) => {
          newSpyData[ticker] = spyReturn;
        });
        setSpyData(newSpyData);
      } catch (error) {
        console.error('Error updating SPY comparisons:', error);
      }
    };
    
    if (openPositions.length > 0 || closedPositions.length > 0) {
      updateSpyComparisons();
    }
  }, [transactions]);

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
    <div className="space-y-6">
      <PortfolioSummary
        metrics={metrics}
        totals={totals}
        openPositions={openPositions}
        closedPositions={closedPositions}
      />
      
      <PositionTimelineChart 
        transactions={transactions}
        openPositions={openPositions}
        closedPositions={closedPositions}
      />

      <OpenPositionsTable
        positions={openPositions}
      />

      <ClosedPositionsTable
        positions={closedPositions}
      />

      <TransactionTable
        transactions={transactions}
        onTransactionAdd={handleTransactionAdd}
        onTransactionEdit={handleTransactionEdit}
        onTransactionDelete={handleTransactionDelete}
        onTransactionsDeleteAll={handleTransactionsDeleteAll}
      />
    </div>
  );
};

export default PortfolioTracker;