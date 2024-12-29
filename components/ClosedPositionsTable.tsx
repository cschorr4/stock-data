import React, { useState } from 'react';
import { format } from 'date-fns';
import { ChevronRight } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ClosedPositionsTableProps } from '@/lib/types';

const ClosedPositionsTable: React.FC<ClosedPositionsTableProps> = ({ positions }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex items-center justify-between p-6">
        <h3 className="text-2xl font-semibold leading-none tracking-tight">Closed Positions</h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0"
          onClick={() => setIsOpen(!isOpen)}
        >
          <ChevronRight className={cn(
            "h-4 w-4 transition-transform duration-200",
            isOpen ? "rotate-90" : ""
          )} />
        </Button>
      </div>

      {isOpen && (
        <div className="p-6 pt-0">
          {/* Mobile View */}
          <div className="md:hidden px-4 pb-4">
            {positions.map((position, index) => {
              const buyDate = new Date(position.buyDate);
              const sellDate = new Date(position.sellDate);
              const holdingPeriod = Math.round((sellDate.getTime() - buyDate.getTime()) / (1000 * 60 * 60 * 24));
              const holdingPeriodText = holdingPeriod >= 365
                ? `${Math.floor(holdingPeriod / 365)}y ${Math.floor((holdingPeriod % 365) / 30)}m`
                : `${Math.floor(holdingPeriod / 30)}m ${holdingPeriod % 30}d`;

              return (
                <div key={`${position.ticker}-${index}-mobile`} className="mb-4 rounded-lg border bg-card p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">{position.ticker}</span>
                    <span className={position.percentChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {position.percentChange.toFixed(2)}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Buy Date:</div>
                    <div>{format(buyDate, "PPP")}</div>
                    <div>Sell Date:</div>
                    <div>{format(sellDate, "PPP")}</div>
                    <div>Holding Period:</div>
                    <div>{holdingPeriodText}</div>
                    <div>Shares:</div>
                    <div>{position.shares.toFixed(2)}</div>
                    <div>Buy Price:</div>
                    <div>${position.buyPrice.toFixed(2)}</div>
                    <div>Sell Price:</div>
                    <div>${position.sellPrice.toFixed(2)}</div>
                    <div>P/L:</div>
                    <div className={position.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ${position.profit.toFixed(2)}
                    </div>
                    <div>vs SPY:</div>
                    <div className={((position.percentChange - (position.spyReturn || 0)) > 0) ? 'text-green-600' : 'text-red-600'}>
                      {((position.percentChange - (position.spyReturn || 0))).toFixed(2)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop View */}
          <div className="hidden md:block">
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
                  <TableHead>SPY Return</TableHead>
                  <TableHead>vs SPY</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((position, index) => {
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
                      <TableCell className={position.spyReturn && position.spyReturn > 0 ? 'text-green-600' : 'text-red-600'}>
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
      )}
    </div>
  );
};

export default ClosedPositionsTable;