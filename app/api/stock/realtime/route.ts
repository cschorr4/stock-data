import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface FormattedQuote {
  symbol: string;
  currentPrice: number | null;
  change: number | null;
  changePercent: number | null;
  volume: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  peRatio?: number | null;
  forwardPE?: number | null;
  spyReturn: number | null;
}

interface QuoteCache {
  data: FormattedQuote;
  timestamp: number;
}

const quoteCache: Record<string, QuoteCache> = {};
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

async function getHistoricalSPYReturn(buyDate: string): Promise<number | null> {
  try {
    const historicalData = await yahooFinance.historical('SPY', {
      period1: new Date(buyDate),
      period2: new Date(),
      interval: '1d'
    });

    if (historicalData.length < 2) return null;

    const startPrice = historicalData[0].close;
    const endPrice = historicalData[historicalData.length - 1].close;
    return ((endPrice - startPrice) / startPrice) * 100;
  } catch (error) {
    console.error('Error fetching SPY historical data:', error);
    return null;
  }
}

async function getQuoteWithCache(symbol: string, buyDate: string): Promise<FormattedQuote | null> {
  const now = Date.now();
  const cachedData = quoteCache[symbol];

  if (cachedData && (now - cachedData.timestamp) < CACHE_DURATION) {
    return cachedData.data;
  }

  try {
    // First get the basic quote data
    const quote = await yahooFinance.quote(symbol);
    console.log(`Basic quote data for ${symbol}:`, quote);

    // Then get the detailed summary with fundamentals
    const quoteSummary = await yahooFinance.quoteSummary(symbol, {
      modules: ['price', 'summaryDetail', 'defaultKeyStatistics']
    });
    console.log(`Quote summary data for ${symbol}:`, JSON.stringify(quoteSummary, null, 2));

    // Get SPY comparison data
    const spyReturn = await getHistoricalSPYReturn(buyDate);

    // Extract PE ratios correctly from summaryDetail
    const trailingPE = quoteSummary.summaryDetail?.trailingPE ?? null;
    const forwardPE = quoteSummary.summaryDetail?.forwardPE ?? null;

    const formattedQuote: FormattedQuote = {
      symbol,
      currentPrice: quote.regularMarketPrice ?? null,
      change: quote.regularMarketChange ?? null,
      changePercent: quote.regularMarketChangePercent ?? null,
      volume: quote.regularMarketVolume ?? null,
      dayHigh: quote.regularMarketDayHigh ?? null,
      dayLow: quote.regularMarketDayLow ?? null,
      peRatio: trailingPE,
      forwardPE: forwardPE,
      spyReturn
    };

    console.log(`Formatted quote for ${symbol}:`, formattedQuote);

    quoteCache[symbol] = {
      data: formattedQuote,
      timestamp: now
    };

    return formattedQuote;
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    return null;
  }
}

interface QuoteResponse {
  quotes: FormattedQuote[];
  cached: boolean;
  lastUpdated: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbols = searchParams.get('symbols')?.split(',');
    const buyDates = searchParams.get('buyDates')?.split(',');

    if (!symbols) {
      return NextResponse.json(
        { error: 'Symbols required' },
        { status: 400 }
      );
    }

    const quotes = await Promise.all(
      symbols.map((symbol, index) =>
        getQuoteWithCache(symbol, buyDates?.[index] || new Date().toISOString())
      )
    );

    const validQuotes = quotes.filter((quote): quote is FormattedQuote => quote !== null);

    const response: QuoteResponse = {
      quotes: validQuotes,
      cached: true,
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotes' },
      { status: 500 }
    );
  }
}