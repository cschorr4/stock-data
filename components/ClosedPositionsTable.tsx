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
import { Card } from '@/components/ui/card';
import { ClosedPositionsTableProps } from '@/lib/types';

const ClosedPositionsTable: React.FC<ClosedPositionsTableProps> = ({
  positions
}) => {
  const getColorClass = (value: number | undefined | null) => {
    if (value === undefined || value === null) return '';
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const calculateHoldingPeriod = (buyDate: Date, sellDate: Date) => {
    const holdingPeriod = Math.round(
      (sellDate.getTime() - buyDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return holdingPeriod >= 365
      ? `${Math.floor(holdingPeriod / 365)}y ${Math.floor((holdingPeriod % 365) / 30)}m`
      : `${Math.floor(holdingPeriod / 30)}m ${holdingPeriod % 30}d`;
  };

  // Mobile card view component
  const MobilePositionCard = ({ position, index }: { position: any, index: number }) => {
    const buyDate = new Date(position.buyDate);
    const sellDate = new Date(position.sellDate);
    const holdingPeriodText = calculateHoldingPeriod(buyDate, sellDate);
    const alpha = position.spyReturn !== undefined
      ? position.percentChange - position.spyReturn
      : null;

    return (
      <Card className="mb-4 p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-bold">{position.ticker}</h3>
          <span className={`font-semibold ${getColorClass(position.profit)}`}>
            ${position.profit.toFixed(2)}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Buy Date</p>
            <p>{format(buyDate, "PP")}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Sell Date</p>
            <p>{format(sellDate, "PP")}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Period</p>
            <p>{holdingPeriodText}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Shares</p>
            <p>{position.shares.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Buy Price</p>
            <p>${position.buyPrice.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Sell Price</p>
            <p>${position.sellPrice.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">% Change</p>
            <p className={getColorClass(position.percentChange)}>
              {position.percentChange.toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">vs SPY</p>
            <p className={getColorClass(position.spyReturn)}>
              {position.spyReturn?.toFixed(2) ?? 'N/A'}%
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Alpha</p>
            <p className={getColorClass(alpha)}>
              {alpha?.toFixed(2) ?? 'N/A'}%
            </p>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6">
        <h3 className="text-2xl font-semibold leading-none tracking-tight">
          Closed Positions
        </h3>
      </div>
      
      {/* Mobile View */}
      <div className="md:hidden p-4">
        {positions.map((position, index) => (
          <MobilePositionCard 
            key={`${position.ticker}-${index}-mobile`}
            position={position}
            index={index}
          />
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block p-6 pt-0">
        <div className="overflow-x-auto">
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
                <TableHead>Alpha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.map((position, index) => {
                const buyDate = new Date(position.buyDate);
                const sellDate = new Date(position.sellDate);
                const holdingPeriodText = calculateHoldingPeriod(buyDate, sellDate);
                const alpha = position.spyReturn !== undefined
                  ? position.percentChange - position.spyReturn
                  : null;

                return (
                  <TableRow key={`${position.ticker}-${index}-desktop`}>
                    <TableCell className="font-medium">{position.ticker}</TableCell>
                    <TableCell>{format(buyDate, "PPP")}</TableCell>
                    <TableCell>{format(sellDate, "PPP")}</TableCell>
                    <TableCell>{holdingPeriodText}</TableCell>
                    <TableCell>{position.shares.toFixed(2)}</TableCell>
                    <TableCell>${position.buyPrice.toFixed(2)}</TableCell>
                    <TableCell>${position.sellPrice.toFixed(2)}</TableCell>
                    <TableCell className={getColorClass(position.profit)}>
                      ${position.profit.toFixed(2)}
                    </TableCell>
                    <TableCell className={getColorClass(position.percentChange)}>
                      {position.percentChange.toFixed(2)}%
                    </TableCell>
                    <TableCell className={getColorClass(position.spyReturn)}>
                      {position.spyReturn?.toFixed(2) ?? 'N/A'}%
                    </TableCell>
                    <TableCell className={getColorClass(alpha)}>
                      {alpha?.toFixed(2) ?? 'N/A'}%
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default ClosedPositionsTable;