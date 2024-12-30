import React, { useState } from 'react';
import { format } from 'date-fns';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { cn } from '@/lib/utils';
import { ClosedPositionsTableProps, ClosedPosition } from '@/lib/types';

type SortField = 'ticker' | 'buyDate' | 'sellDate' | 'holdingPeriod' | 'shares' | 'buyPrice' | 'sellPrice' | 'profit' | 'percentChange' | 'spyReturn' | 'vsSpy';
type SortDirection = 'asc' | 'desc';
type SortValue = string | number | Date | undefined;

const ClosedPositionsTable: React.FC<ClosedPositionsTableProps> = ({ positions }) => {
  const [sortField, setSortField] = useState<SortField>('sellDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const getValueColor = (value: number | undefined, neutral = false) => {
    if (value === undefined) return '';
    if (neutral && value === 0) return 'text-yellow-600';
    return value > 0 ? 'text-green-600' : 'text-red-600';
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortValue = (position: ClosedPosition, field: SortField): SortValue => {
    switch (field) {
      case 'buyDate':
      case 'sellDate':
        return new Date(position[field]).getTime();
      case 'vsSpy':
        return position.percentChange - (position.spyReturn || 0);
      case 'ticker':
      case 'holdingPeriod':
      case 'shares':
      case 'buyPrice':
      case 'sellPrice':
      case 'profit':
      case 'percentChange':
      case 'spyReturn':
        return position[field];
      default:
        return undefined;
    }
  };

  const getSortedPositions = () => {
    return [...positions].sort((a, b) => {
      const aValue = getSortValue(a, sortField);
      const bValue = getSortValue(b, sortField);
      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  const SortHeader: React.FC<{ field: SortField; label: string }> = ({ field, label }) => (
    <TableHead onClick={() => handleSort(field)} className="cursor-pointer hover:bg-gray-100">
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        {sortField === field && (
          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
        )}
      </div>
    </TableHead>
  );

  const getGradientStyle = (percentChange: number) => {
    const normalizedPercent = Math.max(-100, Math.min(100, percentChange)) / 100;
    const red = normalizedPercent < 0 ? 255 : Math.round(255 * (1 - normalizedPercent));
    const green = normalizedPercent > 0 ? 255 : Math.round(255 * (1 + normalizedPercent));
    return {
      background: `linear-gradient(90deg, rgba(${red},${green},0,0.1) 0%, rgba(${red},${green},0,0.2) 100%)`,
    };
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6">
        <h3 className="text-2xl font-semibold leading-none tracking-tight">Closed Positions</h3>
      </div>
      <div className="p-6 pt-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortHeader field="ticker" label="Ticker" />
                <SortHeader field="buyDate" label="Buy Date" />
                <SortHeader field="sellDate" label="Sell Date" />
                <SortHeader field="holdingPeriod" label="Holding Period" />
                <SortHeader field="shares" label="Shares" />
                <SortHeader field="buyPrice" label="Buy Price" />
                <SortHeader field="sellPrice" label="Sell Price" />
                <SortHeader field="profit" label="P/L" />
                <SortHeader field="percentChange" label="% Change" />
                <SortHeader field="spyReturn" label="SPY" />
                <SortHeader field="vsSpy" label="vs SPY" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {getSortedPositions().map((position, index) => {
                const buyDate = new Date(position.buyDate);
                const sellDate = new Date(position.sellDate);
                const holdingPeriodText = position.holdingPeriod >= 365
                  ? `${Math.floor(position.holdingPeriod / 365)}y ${Math.floor((position.holdingPeriod % 365) / 30)}m`
                  : `${Math.floor(position.holdingPeriod / 30)}m ${position.holdingPeriod % 30}d`;
                const alpha = position.percentChange - (position.spyReturn || 0);

                return (
                  <TableRow key={`${position.ticker}-${index}`} style={getGradientStyle(position.percentChange)}>
                    <TableCell className="font-medium">{position.ticker}</TableCell>
                    <TableCell>{format(buyDate, "MM/dd/yy")}</TableCell>
                    <TableCell>{format(sellDate, "MM/dd/yy")}</TableCell>
                    <TableCell>{holdingPeriodText}</TableCell>
                    <TableCell>{position.shares.toFixed(2)}</TableCell>
                    <TableCell>${position.buyPrice.toFixed(2)}</TableCell>
                    <TableCell>${position.sellPrice.toFixed(2)}</TableCell>
                    <TableCell className={getValueColor(position.profit, true)}>
                      ${position.profit.toFixed(2)}
                    </TableCell>
                    <TableCell className={getValueColor(position.percentChange, true)}>
                      {position.percentChange.toFixed(2)}%
                    </TableCell>
                    <TableCell className={getValueColor(position.spyReturn)}>
                      {position.spyReturn?.toFixed(2) ?? 'N/A'}%
                    </TableCell>
                    <TableCell className={getValueColor(alpha)}>
                      {alpha.toFixed(2)}%
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
