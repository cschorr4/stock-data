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

  const [isMobileView, setIsMobileView] = React.useState(false);

  React.useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobileView();
    
    // Add event listener
    window.addEventListener('resize', checkMobileView);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobileView);
  }, []);

  if (isMobileView) {
    return (
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
        <h3 className="text-2xl font-semibold leading-none tracking-tight mb-4">
          Closed Positions
        </h3>
        
        <div className="space-y-4">
          {positions.map((position, index) => {
            const buyDate = new Date(position.buyDate);
            const sellDate = new Date(position.sellDate);
            const holdingPeriodText = calculateHoldingPeriod(buyDate, sellDate);
            const alpha = position.spyReturn !== undefined
              ? position.percentChange - position.spyReturn
              : null;

            return (
              <Card key={`${position.ticker}-${index}-mobile`} className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-bold">{position.ticker}</h4>
                  <span className={`font-semibold ${getColorClass(position.profit)}`}>
                    ${position.profit.toFixed(2)}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Buy Date</p>
                    <p className="font-medium">{format(buyDate, "PP")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Sell Date</p>
                    <p className="font-medium">{format(sellDate, "PP")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Period</p>
                    <p className="font-medium">{holdingPeriodText}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Shares</p>
                    <p className="font-medium">{position.shares.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Buy Price</p>
                    <p className="font-medium">${position.buyPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Sell Price</p>
                    <p className="font-medium">${position.sellPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">% Change</p>
                    <p className={`font-medium ${getColorClass(position.percentChange)}`}>
                      {position.percentChange.toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">vs SPY</p>
                    <p className={`font-medium ${getColorClass(position.spyReturn)}`}>
                      {position.spyReturn?.toFixed(2) ?? 'N/A'}%
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6">
        <h3 className="text-2xl font-semibold leading-none tracking-tight">
          Closed Positions
        </h3>
      </div>
      <div className="p-6 pt-0 overflow-x-auto">
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
                  <TableCell className="font-medium whitespace-nowrap">{position.ticker}</TableCell>
                  <TableCell className="whitespace-nowrap">{format(buyDate, "PPP")}</TableCell>
                  <TableCell className="whitespace-nowrap">{format(sellDate, "PPP")}</TableCell>
                  <TableCell className="whitespace-nowrap">{holdingPeriodText}</TableCell>
                  <TableCell className="whitespace-nowrap">{position.shares.toFixed(2)}</TableCell>
                  <TableCell className="whitespace-nowrap">${position.buyPrice.toFixed(2)}</TableCell>
                  <TableCell className="whitespace-nowrap">${position.sellPrice.toFixed(2)}</TableCell>
                  <TableCell className={`whitespace-nowrap ${getColorClass(position.profit)}`}>
                    ${position.profit.toFixed(2)}
                  </TableCell>
                  <TableCell className={`whitespace-nowrap ${getColorClass(position.percentChange)}`}>
                    {position.percentChange.toFixed(2)}%
                  </TableCell>
                  <TableCell className={`whitespace-nowrap ${getColorClass(position.spyReturn)}`}>
                    {position.spyReturn?.toFixed(2) ?? 'N/A'}%
                  </TableCell>
                  <TableCell className={`whitespace-nowrap ${getColorClass(alpha)}`}>
                    {alpha?.toFixed(2) ?? 'N/A'}%
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