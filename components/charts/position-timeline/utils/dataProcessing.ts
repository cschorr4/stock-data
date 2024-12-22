// components/charts/position-timeline/utils/dataProcessing.ts
import { Transaction, ChartDataPoint, TickerData } from '@/lib/types';

interface SharesData {
  [date: string]: {
    [ticker: string]: {
      shares: number;
    };
  };
}

export const processChartData = async (
  tickerData: TickerData[],
  tickers: string[],
  transactions: Transaction[]
): Promise<{
  timelineData: ChartDataPoint[];
  sharesData: SharesData;
  rawData: ChartDataPoint[];
}> => {
  if (!tickerData || !tickers || !transactions) {
    return {
      timelineData: [],
      sharesData: {},
      rawData: []
    };
  }

  const sharesData: SharesData = {};
  const timelineData: ChartDataPoint[] = [];
  const rawData: ChartDataPoint[] = [];

  // Get all unique dates from ticker data
  const allDates = [...new Set(
    tickerData.flatMap(({ data }) => data?.map(d => d.date) || [])
  )].sort();

  allDates.forEach(date => {
    const dataPoint: ChartDataPoint = { date };
    const rawPoint: ChartDataPoint = { date };
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
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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

export const processDataForDisplay = (rawData: ChartDataPoint[], showPercentage: boolean): ChartDataPoint[] => {
  if (!rawData || rawData.length === 0) return [];
  
  const processedData = rawData.map(point => ({...point}));
  
  if (showPercentage) {
    const baselineValues: { [key: string]: number } = {};
    processedData.forEach(point => {
      Object.entries(point).forEach(([key, value]) => {
        if (key !== 'date' && value !== null && typeof value === 'number') {
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