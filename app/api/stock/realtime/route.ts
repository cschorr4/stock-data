// app/api/stock/realtime/route.ts
import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbols = searchParams.get('symbols')?.split(',');
    
    if (!symbols) {
      return NextResponse.json({ error: 'Symbols required' }, { status: 400 });
    }

    const quotes = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const quote = await yahooFinance.quote(symbol, {
            fields: ['regularMarketPrice', 'regularMarketChange', 'regularMarketChangePercent', 
                    'regularMarketVolume', 'regularMarketDayHigh', 'regularMarketDayLow']
          });
          
          return {
            symbol,
            currentPrice: quote.regularMarketPrice,
            change: quote.regularMarketChange,
            changePercent: quote.regularMarketChangePercent,
            volume: quote.regularMarketVolume,
            dayHigh: quote.regularMarketDayHigh,
            dayLow: quote.regularMarketDayLow
          };
        } catch (error) {
          console.error(`Error fetching quote for ${symbol}:`, error);
          return null;
        }
      })
    );

    const validQuotes = quotes.filter(quote => quote !== null);
    return NextResponse.json({ quotes: validQuotes });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 });
  }
}