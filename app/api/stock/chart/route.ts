import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface QueryOptions {
  interval: '1d' | '1wk' | '1mo';
  period1: Date;
  period2?: Date;
  events?: 'history' | 'dividends' | 'split';
  includeAdjustedClose?: boolean;
}

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

// Enhanced error handling with retries
const withRetry = async <T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = INITIAL_RETRY_DELAY
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying operation. Attempts remaining: ${retries-1}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(operation, retries - 1, delay * 2);
    }
    throw error;
  }
};

// Enhanced Yahoo Finance client with timeout
const getYahooFinanceData = async (symbol: string, options: QueryOptions) => {
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Yahoo Finance request timeout')), 15000)
  );
  
  const request = yahooFinance.historical(symbol, {
    ...options,
    events: 'history',
    includeAdjustedClose: true
  });

  return Promise.race([request, timeoutPromise]);
};

function getStartDate(range: string): Date {
  const today = new Date();
  const dates = {
    '1M': new Date(today.setMonth(today.getMonth() - 1)),
    '3M': new Date(today.setMonth(today.getMonth() - 3)),
    '6M': new Date(today.setMonth(today.getMonth() - 6)),
    '1Y': new Date(today.setFullYear(today.getFullYear() - 1)),
    '2Y': new Date(today.setFullYear(today.getFullYear() - 2)),
    '5Y': new Date(today.setFullYear(today.getFullYear() - 5)),
    'YTD': new Date(today.getFullYear(), 0, 1)
  };
  return dates[range as keyof typeof dates] || dates['1M'];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const range = searchParams.get('range');
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    if (!symbol) {
      return NextResponse.json(
        { error: 'Stock symbol is required' },
        { status: 400 }
      );
    }

    // Configure query options
    const queryOptions: QueryOptions = {
      interval: '1d',
      period1: startDate ? new Date(startDate) : 
               range ? getStartDate(range) : 
               getStartDate('1M')
    };

    if (endDate) {
      queryOptions.period2 = new Date(endDate);
    }

    // Fetch data with retry logic
    const historicalData = await withRetry(
      () => getYahooFinanceData(symbol, queryOptions)
    );

    // Process and validate the data
    if (!Array.isArray(historicalData) || historicalData.length === 0) {
      throw new Error('Invalid or empty response from Yahoo Finance');
    }

    const chartData = historicalData.map(item => ({
      date: item.date.toISOString().split('T')[0],
      open: Number(item.open?.toFixed(2)) || null,
      high: Number(item.high?.toFixed(2)) || null,
      low: Number(item.low?.toFixed(2)) || null,
      close: Number(item.close?.toFixed(2)) || null,
      volume: item.volume || 0
    }));

    return NextResponse.json(chartData);

  } catch (error) {
    console.error('Chart API Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = errorMessage.includes('timeout') ? 504 : 500;
    
    return NextResponse.json(
      {
        error: 'Failed to fetch chart data',
        details: errorMessage
      },
      { status: statusCode }
    );
  }
}