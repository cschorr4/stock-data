// lib/database.types.ts
export interface Database {
    public: {
      Tables: {
        transactions: {
          Row: {
            id: string;
            user_id: string;
            type: 'buy' | 'sell' | 'dividend';
            ticker: string;
            shares: number;
            price: number;
            date: string;
            notes?: string;
            created_at?: string;
            updated_at?: string;
          };
        };
        positions: {
          Row: {
            id: string;
            user_id: string;
            ticker: string;
            shares: number;
            avg_cost: number;
            buy_date: string;
            last_updated?: string;
            sector?: string;
            industry?: string;
            beta?: number;
            market_cap?: number;
            dividend_yield?: number;
          };
        };
        closed_positions: {
          Row: {
            id: string;
            user_id: string;
            ticker: string;
            buy_date: string;
            sell_date: string;
            shares: number;
            buy_price: number;
            sell_price: number;
            profit?: number;
            percent_change?: number;
            spy_return?: number;
            holding_period?: number;
          };
        };
      };
    };
  }