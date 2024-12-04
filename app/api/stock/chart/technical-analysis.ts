// app/api/stock/chart/technical-analysis.ts

export interface ChartDataItem {
    date: string;
    time?: string;
    open: number;
    high: number;
    low: number;  
    close: number;
    volume: number;
    sma20?: number;
    sma50?: number;
    rsi?: number;
    macd?: number;
    signal?: number;
    histogram?: number;
    bollinger?: {
      upper: number;
      middle: number;
      lower: number;
    };
  }
  
  export interface MarketData {
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    dayHigh: number;
    dayLow: number;
    open: number;
    previousClose: number;
    marketCap: number;
    fiftyDayAverage: number;
    twoHundredDayAverage: number;
  }
  
  function calculateSMA(data: number[], period: number): number {
    return data.reduce((sum, value) => sum + value, 0) / period;
  }
  
  function calculateEMA(data: number[], period: number): number[] {
    const multiplier = 2 / (period + 1);
    const emaData = [data[0]];
    
    for (let i = 1; i < data.length; i++) {
      const ema = (data[i] - emaData[i-1]) * multiplier + emaData[i-1];
      emaData.push(ema);
    }
    
    return emaData;
  }
  
  function calculateRSI(data: number[], period: number = 14): number | null {
    if (data.length < period + 1) return null;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i <= period; i++) {
      const difference = data[i] - data[i - 1];
      if (difference >= 0) {
        gains += difference;
      } else {
        losses -= difference;
      }
    }
    
    let avgGain = gains / period;
    let avgLoss = losses / period;
    
    for (let i = period + 1; i < data.length; i++) {
      const difference = data[i] - data[i - 1];
      
      if (difference >= 0) {
        avgGain = (avgGain * (period - 1) + difference) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = (avgLoss * (period - 1) - difference) / period;
      }
    }
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }
  
  function calculateMACD(data: number[]): { macd: number[], signal: number[], histogram: number[] } {
    const ema12 = calculateEMA(data, 12);
    const ema26 = calculateEMA(data, 26);
    
    const macd = ema12.map((value, index) => value - ema26[index]);
    const signal = calculateEMA(macd, 9);
    const histogram = macd.map((value, index) => value - signal[index]);
    
    return { macd, signal, histogram };
  }
  
  function calculateBollingerBands(data: number[], period: number = 20, stdDev: number = 2): {
    upper: number[],
    middle: number[],
    lower: number[]
  } {
    const middle = [];
    const upper = [];
    const lower = [];
    
    for (let i = period - 1; i < data.length; i++) {
      const slice = data.slice(i - period + 1, i + 1);
      const sma = calculateSMA(slice, period);
      
      const variance = slice.reduce((sum, value) => {
        const diff = value - sma;
        return sum + diff * diff;
      }, 0) / period;
      
      const std = Math.sqrt(variance);
      
      middle.push(sma);
      upper.push(sma + stdDev * std);
      lower.push(sma - stdDev * std);
    }
    
    return { upper, middle, lower };
  }
  
  export function processChartData(chartData: any[]): ChartDataItem[] {
    const closePrices = chartData.map(item => item.close);
    const bollingerBands = calculateBollingerBands(closePrices);
    const { macd, signal, histogram } = calculateMACD(closePrices);
    
    return chartData.map((item, index) => {
      const dataPoint: ChartDataItem = {
        date: new Date(item.timestamp * 1000).toISOString().split('T')[0],
        time: new Date(item.timestamp * 1000).toLocaleTimeString(),
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume
      };
  
      if (index >= 19) {
        dataPoint.sma20 = calculateSMA(closePrices.slice(index - 19, index + 1), 20);
      }
      
      if (index >= 49) {
        dataPoint.sma50 = calculateSMA(closePrices.slice(index - 49, index + 1), 50);
      }
  
      if (index >= 13) {
        dataPoint.rsi = calculateRSI(closePrices.slice(index - 13, index + 1));
      }
  
      if (index >= 25) {
        dataPoint.macd = macd[index];
        dataPoint.signal = signal[index];
        dataPoint.histogram = histogram[index];
      }
  
      if (index >= 19) {
        dataPoint.bollinger = {
          upper: bollingerBands.upper[index - 19],
          middle: bollingerBands.middle[index - 19],
          lower: bollingerBands.lower[index - 19]
        };
      }
  
      return dataPoint;
    });
  }
  
  export function processMarketData(quote: any): MarketData {
    return {
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent,
      volume: quote.regularMarketVolume,
      dayHigh: quote.regularMarketDayHigh,
      dayLow: quote.regularMarketDayLow,
      open: quote.regularMarketOpen,
      previousClose: quote.regularMarketPreviousClose,
      marketCap: quote.marketCap,
      fiftyDayAverage: quote.fiftyDayAverage,
      twoHundredDayAverage: quote.twoHundredDayAverage
    };
  }