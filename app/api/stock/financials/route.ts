import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

// Type Definitions
interface CompanyInfo {
  name: string;
  sector: string | null;
  industry: string | null;
  website: string | null;
  description: string | null;
  country: string | null;
  employees: number | null;
  exchange: string | null;
}

interface FinancialMetrics {
  [period: string]: {
    [metric: string]: number | null;
  };
}

interface StatementData {
  [period: string]: {
    [item: string]: number | null;
  };
}

interface FinancialStatements {
  income_statement: StatementData;
  balance_sheet: StatementData;
  cash_flow: StatementData;
}

interface FinancialData {
  quarterly: FinancialStatements;
  annual: FinancialStatements;
}

interface PythonScriptResponse {
  status: 'success' | 'error';
  error?: string;
  company_info?: CompanyInfo;
  financial_statements?: FinancialData;
  metrics?: FinancialMetrics;
}

// Helper Functions
const validateSymbol = (symbol: string | null): symbol is string => {
  if (!symbol) return false;
  const symbolRegex = /^[A-Za-z]{1,5}$/;
  return symbolRegex.test(symbol);
};

const executePythonScript = async (scriptPath: string, symbol: string): Promise<PythonScriptResponse> => {
  return new Promise((resolve, reject) => {
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
        reject(new Error(`Parse error: ${err instanceof Error ? err.message : 'Unknown error'}`));
      }
    });
  });
};

// Main Route Handler
export async function GET(request: NextRequest) {
  try {
    const symbol = request.nextUrl.searchParams.get('symbol');

    if (!validateSymbol(symbol)) {
      return NextResponse.json(
        { 
          status: 'error',
          error: 'Invalid stock symbol. Must be 1-5 letters.' 
        },
        { status: 400 }
      );
    }

    const scriptPath = path.join(process.cwd(), 'scripts', 'get_financial_statements.py');
    
    // Add basic file existence check
    try {
      await Bun.file(scriptPath).exists();
    } catch (error) {
      console.error('Python script not found:', error);
      return NextResponse.json(
        { 
          status: 'error',
          error: 'Internal configuration error' 
        },
        { status: 500 }
      );
    }

    const result = await executePythonScript(scriptPath, symbol);

    return NextResponse.json({
      status: 'success',
      ...result
    });

  } catch (error) {
    console.error('[API Error]:', error);

    // Type guard for Error objects
    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('Operation timed out')) {
        return NextResponse.json(
          { 
            status: 'error',
            error: 'Request timed out',
            details: error.message 
          },
          { status: 504 }
        );
      }

      if (error.message.includes('Python process failed')) {
        return NextResponse.json(
          { 
            status: 'error',
            error: 'Internal processing error',
            details: error.message 
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { 
          status: 'error',
          error: 'Failed to fetch stock data',
          details: error.message 
        },
        { status: 500 }
      );
    }

    // Generic error response
    return NextResponse.json(
      { 
        status: 'error',
        error: 'An unexpected error occurred',
        details: 'Unknown error type' 
      },
      { status: 500 }
    );
  }
}