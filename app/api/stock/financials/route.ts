// app/api/stock/financials/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

interface PythonScriptResponse {
  status: 'success' | 'error';
  error?: string;
  company_info?: {
    name: string;
    sector: string | null;
    industry: string | null;
    website: string | null;
    description: string | null;
    country: string | null;
    employees: number | null;
    exchange: string | null;
  };
  financial_statements?: {
    quarterly: FinancialStatements;
    annual: FinancialStatements;
  };
  metrics?: Record<string, Record<string, number | null>>;
}

interface FinancialStatements {
  income_statement: Record<string, Record<string, number | null>>;
  balance_sheet: Record<string, Record<string, number | null>>;
  cash_flow: Record<string, Record<string, number | null>>;
}

export async function GET(request: NextRequest) {
  try {
    const symbol = request.nextUrl.searchParams.get('symbol');
    
    // Validate input
    if (!symbol) {
      return NextResponse.json(
        { error: 'Stock symbol is required' },
        { status: 400 }
      );
    }

    // Validate symbol format
    const symbolRegex = /^[A-Za-z]{1,5}$/;
    if (!symbolRegex.test(symbol)) {
      return NextResponse.json(
        { error: 'Invalid stock symbol format' },
        { status: 400 }
      );
    }

    const scriptPath = path.join(process.cwd(), 'scripts', 'get_financial_statements.py');
    
    const result = await new Promise<PythonScriptResponse>((resolve, reject) => {
      const pythonProcess = spawn('python3', [scriptPath, symbol.toUpperCase()], {
        env: {
          ...process.env,
          PYTHONPATH: process.env.PYTHONPATH || process.cwd(),
        },
        timeout: 30000 // 30 second timeout
      });

      let dataString = '';
      let errorString = '';

      pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorString += data.toString();
        console.error(`Python stderr: ${data}`);
      });

      pythonProcess.on('error', (err) => {
        console.error('Failed to start Python process:', err);
        reject(new Error(`Process error: ${err.message}`));
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error(`Python process exited with code ${code}`);
          return reject(new Error(`Process exited with code ${code}: ${errorString}`));
        }

        try {
          const result = JSON.parse(dataString);
          if (result.status === 'success' && result.company_info) {
            resolve(result);
          } else {
            reject(new Error(result.error || 'Invalid data structure'));
          }
        } catch (err) {
          console.error('Failed to parse Python output:', err);
          reject(new Error(`Parse error: ${err instanceof Error ? err.message : 'Unknown'}`));
        }
      });
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API Error]:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Operation timed out')) {
        return NextResponse.json(
          { error: 'Request timed out', details: error.message },
          { status: 504 }
        );
      }
      if (error.message.includes('Python process failed')) {
        return NextResponse.json(
          { error: 'Internal processing error', details: error.message },
          { status: 500 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      {
        error: 'Failed to fetch stock data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}