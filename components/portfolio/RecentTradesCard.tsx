import React from 'react';
import { History } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Transaction } from '@/lib/types';

interface RecentTradesCardProps {
  transactions?: Transaction[];
}

const RecentTradesCard: React.FC<RecentTradesCardProps> = ({ transactions = [] }) => {
  const recentTrades = transactions
    .slice(0, 4)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Card className="w-72 p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <h3 className="font-medium">Recent Trades</h3>
        </div>

        <div className="space-y-2">
          {recentTrades.length > 0 ? (
            recentTrades.map((trade) => (
              <div 
                key={trade.id}
                className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-md p-2 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{trade.ticker}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(trade.date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
                  </span>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-medium ${
                    trade.type === 'buy' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {trade.type.toUpperCase()}
                  </span>
                  <div className="text-xs text-gray-500">
                    {trade.shares} × ${trade.price.toFixed(2)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500 text-center py-4">
              No recent trades
            </div>
          )}
        </div>

        <div className="text-sm text-gray-500 flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          <span>Total Trades</span>
          <span className="font-medium">{transactions.length}</span>
        </div>
      </div>
    </Card>
  );
};

export default RecentTradesCard;