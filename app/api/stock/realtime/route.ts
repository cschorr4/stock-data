import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

interface QuoteCache {
  data: any;
  timestamp: number;
}

const quoteCache: Record<string, QuoteCache> = {};
const CACHE_DURATION = 60 * 60 * 1000;

async function getHistoricalSPYReturn(buyDate: string) {
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

async function getQuoteWithCache(symbol: string, buyDate: string) {
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

    // Extract PE ratios from both potential locations
    const trailingPE = quoteSummary.summaryDetail?.trailingPE || 
                      quoteSummary.defaultKeyStatistics?.trailingPE ||
                      quote.trailingPE;
                      
    const forwardPE = quoteSummary.summaryDetail?.forwardPE || 
                     quoteSummary.defaultKeyStatistics?.forwardPE ||
                     quote.forwardPE;

    const formattedQuote = {
      symbol,
      currentPrice: quote.regularMarketPrice,
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent,
      volume: quote.regularMarketVolume,
      dayHigh: quote.regularMarketDayHigh,
      dayLow: quote.regularMarketDayLow,
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

    const validQuotes = quotes.filter(quote => quote !== null);

    return NextResponse.json({
      quotes: validQuotes,
      cached: true,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotes' },
      { status: 500 }
    );
  }
}