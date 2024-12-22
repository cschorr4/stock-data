// components/ClosedPositionsTable.tsx
import React from 'react';
import { format } from 'date-fns';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { ClosedPositionsTableProps } from '@/lib/types';

const ClosedPositionsTable: React.FC<ClosedPositionsTableProps> = ({ 
  positions
}) => {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6">
        <h3 className="text-2xl font-semibold leading-none tracking-tight">Closed Positions</h3>
      </div>
      <div className="p-6 pt-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticker</TableHead>
              <TableHead>Buy Date</TableHead>
              <TableHead>Sell Date</TableHead>
              <TableHead>Holding Period</TableHead>
              <TableHead>Shares</TableHead>
              <TableHead>Buy Price</TableHead>
              <TableHead>Sell Price</TableHead>
              <TableHead>P/L</TableHead>
              <TableHead>% Change</TableHead>
              <TableHead>vs SPY</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {positions.map((position, index) => {
              // Calculate holding period
              const buyDate = new Date(position.buyDate);
              const sellDate = new Date(position.sellDate);
              const holdingPeriod = Math.round((sellDate.getTime() - buyDate.getTime()) / (1000 * 60 * 60 * 24));
              const holdingPeriodText = holdingPeriod >= 365 
                ? `${Math.floor(holdingPeriod / 365)}y ${Math.floor((holdingPeriod % 365) / 30)}m`
                : `${Math.floor(holdingPeriod / 30)}m ${holdingPeriod % 30}d`;

              return (
                <TableRow key={`${position.ticker}-${index}`}>
                  <TableCell className="font-medium">{position.ticker}</TableCell>
                  <TableCell>{format(buyDate, "PPP")}</TableCell>
                  <TableCell>{format(sellDate, "PPP")}</TableCell>
                  <TableCell>{holdingPeriodText}</TableCell>
                  <TableCell>{position.shares.toFixed(2)}</TableCell>
                  <TableCell>${position.buyPrice.toFixed(2)}</TableCell>
                  <TableCell>${position.sellPrice.toFixed(2)}</TableCell>
                  <TableCell className={position.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                    ${position.profit.toFixed(2)}
                  </TableCell>
                  <TableCell className={position.percentChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {position.percentChange.toFixed(2)}%
                  </TableCell>
                  <TableCell className={position.spyReturn > 0 ? 'text-green-600' : 'text-red-600'}>
                                      {position.spyReturn?.toFixed(2)}%
                                    </TableCell>
                                    <TableCell className={
                                      ((position.percentChange - (position.spyReturn || 0)) > 0) ? 'text-green-600' : 'text-red-600'
                                    }>
                                      {((position.percentChange - (position.spyReturn || 0))).toFixed(2)}%
                                    </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ClosedPositionsTable;