import { Transaction, ChartDataPoint, TickerData } from '@/lib/types';

interface SharesData {
  [date: string]: {
    [ticker: string]: {
      shares: number;
    };
  };
}

/**
 * Processes raw ticker and transaction data into formatted chart data
 * @param tickerData Array of ticker price data
 * @param tickers Array of ticker symbols
 * @param transactions Array of buy/sell transactions
 * @returns Object containing timeline data, shares data, and raw data
 */
export const processChartData = async (
  tickerData: TickerData[],
  tickers: string[],
  transactions: Transaction[]
): Promise<{
  timelineData: ChartDataPoint[];
  sharesData: SharesData;
  rawData: ChartDataPoint[];
}> => {
  // Input validation
  if (!Array.isArray(tickerData) || !Array.isArray(tickers) || !Array.isArray(transactions)) {
    return {
      timelineData: [],
      sharesData: {},
      rawData: []
    };
  }

  const sharesData: SharesData = {};
  const timelineData: ChartDataPoint[] = [];
  const rawData: ChartDataPoint[] = [];

  // Get all unique dates from ticker data using Array.from for better compatibility
  const allDates = Array.from(
    new Set(
      tickerData.flatMap(({ data }) => data?.map(d => d.date) || [])
    )
  ).sort();

  // Process data for each date
  allDates.forEach(date => {
    const dataPoint: ChartDataPoint = { date };
    const rawPoint: ChartDataPoint = { date };
    sharesData[date] = {};

    // Process each ticker
    tickers.forEach(ticker => {
      // Special handling for SPY benchmark
      if (ticker === 'SPY') {
        const tickerPrices = tickerData.find(t => t.ticker === ticker)?.data;
        const priceOnDate = tickerPrices?.find(d => d.date === date)?.close;
        
        if (typeof priceOnDate === 'number') {
          dataPoint[ticker] = priceOnDate;
          rawPoint[ticker] = priceOnDate;
        }
        return;
      }

      // Calculate cumulative shares from transactions
      const relevantTransactions = transactions
        .filter(t => (
          t.ticker === ticker && 
          new Date(t.date) <= new Date(date)
        ))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      let shares = 0;
      relevantTransactions.forEach(t => {
        shares += t.type === 'buy' ? t.shares : -t.shares;
      });

      // Store shares data if position exists
      if (shares > 0) {
        sharesData[date][ticker] = { shares };
      }

      // Get price data for the ticker
      const tickerPrices = tickerData.find(t => t.ticker === ticker)?.data;
      const priceOnDate = tickerPrices?.find(d => d.date === date)?.close;

      // Store price data with appropriate formatting
      if (typeof priceOnDate === 'number') {
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

/**
 * Processes raw chart data into display format with optional percentage calculation
 * @param rawData Raw chart data points
 * @param showPercentage Whether to convert values to percentage changes
 * @returns Processed chart data ready for display
 */
export const processDataForDisplay = (
  rawData: ChartDataPoint[], 
  showPercentage: boolean
): ChartDataPoint[] => {
  if (!Array.isArray(rawData) || rawData.length === 0) return [];

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

          const baselineValue = baselineValues[ticker];
          const percentChange = ((value - baselineValue) / baselineValue) * 100;
          point[key] = percentChange;
        }
      });
    });
  }

  return processedData;
};