import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';
import { spawn } from 'child_process';
import path from 'path';

async function runPythonScript(symbol: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), 'scripts', 'get_financial_statements.py');
    console.log('Script path:', scriptPath);
    
    const pythonProcess = spawn('/usr/local/bin/python3', [scriptPath, symbol], {
      env: { 
        ...process.env, 
        PYTHONPATH: process.env.PYTHONPATH || process.cwd(),
        PATH: process.env.PATH
      },
      cwd: process.cwd()
    });
    
    let dataString = '';
    let errorString = '';

    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
      console.log('Python stdout:', data.toString());
    });

    pythonProcess.stderr.on('data', (data) => {
      errorString += data.toString();
      console.error('Python stderr:', data.toString());
    });

    pythonProcess.on('close', (code) => {
      console.log(`Python process exited with code ${code}`);
      
      if (code !== 0) {
        return reject(new Error(`Python process failed with code ${code}: ${errorString}`));
      }

      try {
        const result = JSON.parse(dataString);
        console.log('Parsed Python result:', result);
        if (result.status === 'error') {
          return reject(new Error(`Python script error: ${JSON.stringify(result.error)}`));
        }
        return resolve(result);
      } catch (err) {
        return reject(new Error(`Failed to parse Python output: ${err.message}\nOutput: ${dataString}`));
      }
    });

    pythonProcess.on('error', (err) => {
      console.error('Failed to start Python process:', err);
      reject(new Error(`Failed to start Python process: ${err.message}`));
    });
  });
}

const withErrorHandling = async <T>(
  promise: Promise<T>,
  errorMessage: string,
  context: string = ''
): Promise<T> => {
  try {
    console.log(`Starting operation: ${context}`);
    const result = await promise;
    console.log(`Successfully completed: ${context}`);
    return result;
  } catch (error) {
    console.error(`${errorMessage} (${context}):`, error);
    throw new Error(`${errorMessage}: ${error.message}`);
  }
};

export async function GET(request: Request) {
  try {
    console.log('Starting stock data fetch request');
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json(
        { error: 'Stock symbol is required' },
        { status: 400 }
      );
    }

    console.log(`Fetching data for symbol: ${symbol}`);

    const promises = {
      financial: withErrorHandling(
        runPythonScript(symbol),
        'Failed to fetch financial statements',
        'Python script'
      ),
      quote: withErrorHandling(
        yahooFinance.quote(symbol),
        'Failed to fetch quote data',
        'Yahoo Quote'
      ),
      summary: withErrorHandling(
        yahooFinance.quoteSummary(symbol, {
          modules: ['price', 'financialData', 'defaultKeyStatistics', 'summaryDetail']
        }),
        'Failed to fetch quote summary',
        'Yahoo Summary'
      )
    };

    const results = await Promise.allSettled([
      promises.financial,
      promises.quote,
      promises.summary
    ]);

    const [financialResult, quoteResult, summaryResult] = results;
    
    console.log('API call results:', {
      financial: financialResult.status,
      quote: quoteResult.status,
      summary: summaryResult.status
    });

    const transformedData = {
      quote: quoteResult.status === 'fulfilled' ? {
        price: quoteResult.value.regularMarketPrice,
        changePercent: quoteResult.value.regularMarketChangePercent,
        volume: quoteResult.value.regularMarketVolume,
        previousClose: quoteResult.value.regularMarketPreviousClose,
        open: quoteResult.value.regularMarketOpen,
        dayHigh: quoteResult.value.regularMarketDayHigh,
        dayLow: quoteResult.value.regularMarketDayLow
      } : null,
      fundamentals: quoteResult.status === 'fulfilled' && summaryResult.status === 'fulfilled' ? {
        marketCap: quoteResult.value.marketCap,
        peRatio: summaryResult.value.summaryDetail?.trailingPE,
        eps: summaryResult.value.defaultKeyStatistics?.trailingEps,
        pegRatio: summaryResult.value.defaultKeyStatistics?.pegRatio,
        bookValue: summaryResult.value.defaultKeyStatistics?.bookValue,
        dividendYield: summaryResult.value.summaryDetail?.dividendYield 
          ? (summaryResult.value.summaryDetail.dividendYield * 100) 
          : null,
        profitMargin: summaryResult.value.financialData?.profitMargins 
          ? (summaryResult.value.financialData.profitMargins * 100) 
          : null,
        revenue: summaryResult.value.financialData?.totalRevenue,
        revenueGrowth: summaryResult.value.financialData?.revenueGrowth 
          ? (summaryResult.value.financialData.revenueGrowth * 100) 
          : null,
        debtToEquity: summaryResult.value.financialData?.debtToEquity,
        currentRatio: summaryResult.value.financialData?.currentRatio,
        returnOnEquity: summaryResult.value.financialData?.returnOnEquity 
          ? (summaryResult.value.financialData.returnOnEquity * 100) 
          : null,
        beta: summaryResult.value.financialData?.beta,
        fiftyTwoWeekLow: summaryResult.value.summaryDetail?.fiftyTwoWeekLow,
        fiftyTwoWeekHigh: summaryResult.value.summaryDetail?.fiftyTwoWeekHigh,
        averageVolume: quoteResult.value.averageDailyVolume3Month,
        companyName: quoteResult.value.longName,
        sector: quoteResult.value.sector,
        industry: quoteResult.value.industry
      } : null,
      financials: financialResult.status === 'fulfilled' ? {
        financial_statements: financialResult.value.financial_statements,
        statement_date: financialResult.value.statement_date
      } : null
    };

    console.log('Financial Result:', JSON.stringify(financialResult, null, 2));
    console.log('Transformed Data:', JSON.stringify(transformedData, null, 2));

    if (!transformedData.quote && !transformedData.fundamentals && !transformedData.financials) {
      throw new Error('Failed to fetch any stock data');
    }

    console.log('Successfully transformed data');
    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Stock API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch stock data', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}