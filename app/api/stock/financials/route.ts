import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

// Type definitions
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

async function runPythonScript(symbol: string): Promise<PythonScriptResponse> {
  return new Promise((resolve, reject) => {
    // Get the absolute path to the Python script
    const scriptPath = path.join(process.cwd(), 'scripts', 'get_financial_statements.py');

    // Spawn Python process with improved environment setup
    const pythonProcess = spawn('python3', [scriptPath, symbol], {
      env: {
        ...process.env,
        PYTHONPATH: `${process.env.PYTHONPATH || ''}:${process.cwd()}`,
        PATH: process.env.PATH
      },
      cwd: process.cwd()
    });

    let dataString = '';
    let errorString = '';

    // Handle stdout data
    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    // Handle stderr data
    pythonProcess.stderr.on('data', (data) => {
      errorString += data.toString();
      console.error('[Python Error]:', data.toString());
    });

    // Handle process completion
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Python process failed with code ${code}\nError: ${errorString}`));
      }

      try {
        const result = JSON.parse(dataString) as PythonScriptResponse;
        
        if (result.status === 'error') {
          return reject(new Error(result.error || 'Unknown error occurred'));
        }

        // Validate required fields
        if (!result.company_info) {
          return reject(new Error('Invalid data structure: missing company_info'));
        }

        return resolve(result);
      } catch (err) {
        return reject(new Error(`Failed to parse Python output: ${err instanceof Error ? err.message : 'Unknown error'}`));
      }
    });

    // Handle process errors
    pythonProcess.on('error', (err) => {
      reject(new Error(`Failed to start Python process: ${err.message}`));
    });

    // Set timeout for the entire operation
    setTimeout(() => {
      pythonProcess.kill();
      reject(new Error('Operation timed out after 30 seconds'));
    }, 30000);
  });
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

    // Get financial data
    const data = await runPythonScript(symbol.toUpperCase());

    return NextResponse.json(data);
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