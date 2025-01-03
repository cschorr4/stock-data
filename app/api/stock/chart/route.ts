import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface QueryOptions {
  interval: '1d' | '1wk' | '1mo';
  period1: Date;  // Made required
  period2?: Date | string | number;
}

const withErrorHandling = async <T>(
  promise: Promise<T>,
  errorMessage: string
): Promise<T> => {
  try {
    return await promise;
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    throw new Error(`${errorMessage}: ${(error as Error).message}`);
  }
};

function getStartDate(range: string): Date {
  const today = new Date();
  switch (range) {
    case '1M':
      return new Date(today.setMonth(today.getMonth() - 1));
    case '3M':
      return new Date(today.setMonth(today.getMonth() - 3));
    case '6M':
      return new Date(today.setMonth(today.getMonth() - 6));
    case '1Y':
      return new Date(today.setFullYear(today.getFullYear() - 1));
    case '2Y':
      return new Date(today.setFullYear(today.getFullYear() - 2));
    case '5Y':
      return new Date(today.setFullYear(today.getFullYear() - 5));
    default:
      return new Date(today.setMonth(today.getMonth() - 1));
  }
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

    // Always set a default period1 to ensure it's not undefined
    const defaultStartDate = getStartDate('1M');
    
    const queryOptions: QueryOptions = {
      interval: '1d' as const,
      period1: defaultStartDate
    };

    if (startDate && endDate) {
      queryOptions.period1 = new Date(startDate);
      queryOptions.period2 = new Date(endDate);
    } else if (range) {
      queryOptions.period1 = getStartDate(range);
    }

    const historicalData = await withErrorHandling(
      yahooFinance.historical(symbol, queryOptions),
      'Failed to fetch historical data'
    );

    const chartData = historicalData.map(item => ({
      date: item.date.toISOString().split('T')[0],
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume
    }));

    return NextResponse.json(chartData);
  } catch (error) {
    console.error('Chart API Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch chart data',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}