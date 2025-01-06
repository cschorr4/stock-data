#!/usr/bin/env python3
import yfinance as yf
import pandas as pd
import json
import sys
from time import sleep
from datetime import datetime
from typing import Dict, Any, Optional

def safe_float(value) -> Optional[float]:
    """Safely convert value to float, handling None and inf values."""
    if pd.isna(value):
        return None
    try:
        float_val = float(value)
        return float_val if float_val != float('inf') and float_val != float('-inf') else None
    except (ValueError, TypeError):
        return None

def process_financial_statement(df: pd.DataFrame) -> Dict[str, Dict[str, Optional[float]]]:
    """Process financial statement to match TypeScript StatementCollection interface."""
    if df is None or df.empty:
        return {}
    
    statement = {}
    for date, values in df.to_dict().items():
        try:
            date_str = date.strftime('%Y-%m-%d') if hasattr(date, 'strftime') else str(date)
            statement[date_str] = {
                str(metric): safe_float(value)
                for metric, value in values.items()
            }
        except Exception as e:
            print(f"Warning: Error processing data for date {date}: {str(e)}", file=sys.stderr)
            continue
            
    return statement

def get_financial_data(symbol: str) -> Dict[str, Any]:
    """Fetch and process financial data to match TypeScript FinancialData interface."""
    try:
        # Initialize ticker
        ticker = yf.Ticker(symbol)
        
        # Get financial statements with retries
        max_retries = 3
        retry_delay = 1
        statements = {
            'quarterly_financials': None,
            'quarterly_balance_sheet': None,
            'quarterly_cashflow': None,
            'financials': None,
            'balance_sheet': None,
            'cashflow': None
        }
        
        for attempt in range(max_retries):
            try:
                statements = {
                    'quarterly_financials': ticker.quarterly_financials,
                    'quarterly_balance_sheet': ticker.quarterly_balance_sheet,
                    'quarterly_cashflow': ticker.quarterly_cashflow,
                    'financials': ticker.financials,
                    'balance_sheet': ticker.balance_sheet,
                    'cashflow': ticker.cashflow
                }
                break
            except Exception as e:
                if attempt == max_retries - 1:
                    print(f"Warning: Failed to fetch statements: {str(e)}", file=sys.stderr)
                sleep(retry_delay)

        # Get company info first to validate data availability
        info = ticker.info or {}
        if not info.get('longName'):
            raise ValueError(f"Could not fetch data for symbol: {symbol}")

        # Process company info to match CompanyInfo interface
        company_info = {
            "name": info.get('longName', ''),
            "sector": info.get('sector'),
            "industry": info.get('industry'),
            "employees": info.get('fullTimeEmployees'),
            "exchange": info.get('exchange'),
            "description": info.get('longBusinessSummary'),
            "website": info.get('website'),
            "country": info.get('country')
        }

        # Process financial statements to match FinancialStatements interface
        financial_data = {
            'quarterly': {
                'income_statement': process_financial_statement(statements['quarterly_financials']),
                'balance_sheet': process_financial_statement(statements['quarterly_balance_sheet']),
                'cash_flow': process_financial_statement(statements['quarterly_cashflow'])
            },
            'annual': {
                'income_statement': process_financial_statement(statements['financials']),
                'balance_sheet': process_financial_statement(statements['balance_sheet']),
                'cash_flow': process_financial_statement(statements['cashflow'])
            }
        }

        # Process metrics to match metrics structure in FinancialData
        metrics = {
            'key_metrics': {
                'market_cap': safe_float(info.get('marketCap')),
                'enterprise_value': safe_float(info.get('enterpriseValue')),
                'pe_ratio': safe_float(info.get('trailingPE')),
                'forward_pe': safe_float(info.get('forwardPE')),
                'peg_ratio': safe_float(info.get('pegRatio')),
                'price_to_book': safe_float(info.get('priceToBook')),
                'beta': safe_float(info.get('beta')),
                'dividend_yield': safe_float(info.get('dividendYield'))
            },
            'efficiency_metrics': {
                'return_on_equity': safe_float(info.get('returnOnEquity')),
                'return_on_assets': safe_float(info.get('returnOnAssets')),
                'profit_margin': safe_float(info.get('profitMargins')),
                'operating_margin': safe_float(info.get('operatingMargins'))
            }
        }

        return {
            "status": "success",
            "company_info": company_info,
            "financial_statements": financial_data,
            "metrics": metrics
        }

    except Exception as e:
        error_msg = str(e)
        print(f"Error in get_financial_data: {error_msg}", file=sys.stderr)
        return {
            "status": "error",
            "error": error_msg
        }

def main():
    if len(sys.argv) != 2:
        print(json.dumps({
            "status": "error",
            "error": "Symbol argument required"
        }))
        sys.exit(1)
    
    try:
        symbol = sys.argv[1].upper()
        result = get_financial_data(symbol)
        print(json.dumps(result, default=str))
        sys.exit(0 if result["status"] == "success" else 1)
    except Exception as e:
        print(json.dumps({
            "status": "error",
            "error": str(e)
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()