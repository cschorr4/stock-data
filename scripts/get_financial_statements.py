#!/usr/bin/env python3
import yfinance as yf
import pandas as pd
import json
import sys
from time import sleep
from datetime import datetime, timedelta

def get_financial_data(symbol, years=10):
    try:
        # Initialize ticker
        ticker = yf.Ticker(symbol)
        
        # Get financial statements
        income_stmt = ticker.financials
        balance_sheet = ticker.balance_sheet
        cash_flow = ticker.cashflow
        
        # Get quarterly statements
        income_stmt_q = ticker.quarterly_financials
        balance_sheet_q = ticker.quarterly_balance_sheet
        cash_flow_q = ticker.quarterly_cashflow

        financial_data = {
            'quarterly': {
                'income_statement': income_stmt_q.to_dict() if not income_stmt_q.empty else {},
                'balance_sheet': balance_sheet_q.to_dict() if not balance_sheet_q.empty else {},
                'cash_flow': cash_flow_q.to_dict() if not cash_flow_q.empty else {}
            },
            'annual': {
                'income_statement': income_stmt.to_dict() if not income_stmt.empty else {},
                'balance_sheet': balance_sheet.to_dict() if not balance_sheet.empty else {},
                'cash_flow': cash_flow.to_dict() if not cash_flow.empty else {}
            }
        }

        # Convert datetime index to string
        for period_type in financial_data:
            for statement_type in financial_data[period_type]:
                if financial_data[period_type][statement_type]:
                    financial_data[period_type][statement_type] = {
                        k.strftime('%Y-%m-%d'): {
                            metric: float(v) if not pd.isna(v) else None
                            for metric, v in values.items()
                        }
                        for k, values in financial_data[period_type][statement_type].items()
                    }

        # Get additional company info
        info = ticker.info
        
        return {
            "status": "success",
            "symbol": symbol,
            "company_info": info,
            "financial_statements": financial_data
        }

    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }

def main():
    if len(sys.argv) != 2:
        print(json.dumps({"status": "error", "error": "Symbol argument required"}))
        sys.exit(1)

    try:
        symbol = sys.argv[1].upper()
        result = get_financial_data(symbol)
        print(json.dumps(result))
        sys.exit(0)
    except Exception as e:
        print(json.dumps({"status": "error", "error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()