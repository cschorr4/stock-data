// components/charts/position-timeline/hooks/useChartData.ts
import { useState, useEffect } from 'react';
import { ChartDataPoint, Transaction, TickerData } from '@/lib/types';
import { processChartData, processDataForDisplay } from '../utils/dataProcessing';

interface SharesData {
  [date: string]: {
    [ticker: string]: {
      shares: number;
    };
  };
}

export const useChartData = (
  tickerData: TickerData[],
  transactions: Transaction[],
  tickers: string[],
  showPercentage: boolean
) => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [positionData, setPositionData] = useState<SharesData>({});
  const [rawData, setRawData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    if (!tickers || tickers.length === 0 || !transactions) {
      return;
    }

    const processData = async () => {
      try {
        const { timelineData, sharesData, rawData: newRawData } = 
          await processChartData(tickerData, tickers, transactions);
        
        setRawData(newRawData);
        setChartData(processDataForDisplay(newRawData, showPercentage));
        setPositionData(sharesData);
      } catch (error) {
        console.error('Error processing chart data:', error);
      }
    };

    processData();
  }, [tickerData, transactions, tickers, showPercentage]);

  return { chartData, positionData, rawData };
};