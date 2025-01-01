import React, { useState } from 'react';
import { format } from 'date-fns';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { cn } from '@/lib/utils';
import { OpenPositionsTableProps, Position } from '@/lib/types';

type SortField = 'ticker' | 'industry' | 'buyDate' | 'shares' | 'avgCost' | 'currentValue' | 'peRatio' | 'dollarChange' | 'percentChange' | 'spyReturn' | 'vsSpy';
type SortDirection = 'asc' | 'desc';
type SortValue = string | number | Date | undefined;

const OpenPositionsTable: React.FC<OpenPositionsTableProps> = ({ positions }) => {
  const [sortField, setSortField] = useState<SortField>('ticker');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const getValueColor = (value: number | undefined, neutral = false) => {
    if (value === undefined) return '';
    if (neutral && value === 0) return 'text-yellow-600';
    return value > 0 ? 'text-green-600' : 'text-red-600';
  };

  const getPeRatioColor = (peRatio: number | undefined, industryPE: number | undefined) => {
    if (!peRatio || !industryPE) return '';
    const deviation = ((peRatio - industryPE) / industryPE) * 100;
    if (deviation < -20) return 'text-green-600';
    if (deviation > 20) return 'text-red-600';
    return 'text-yellow-600';
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortValue = (position: Position, field: SortField): SortValue => {
    switch (field) {
      case 'buyDate':
        return new Date(position.buyDate).getTime();
      case 'vsSpy':
        return position.percentChange - (position.spyReturn || 0);
      case 'ticker':
      case 'industry':
      case 'shares':
      case 'avgCost':
      case 'currentValue':
      case 'peRatio':
      case 'dollarChange':
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
        <h3 className="text-2xl font-semibold leading-none tracking-tight">Open Positions</h3>
      </div>
      <div className="p-6 pt-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortHeader field="ticker" label="Ticker" />
                <SortHeader field="industry" label="Industry" />
                <SortHeader field="buyDate" label="Date" />
                <SortHeader field="shares" label="Shares" />
                <SortHeader field="avgCost" label="Avg Cost" />
                <SortHeader field="currentValue" label="Value" />
                <SortHeader field="peRatio" label="P/E" />
                <SortHeader field="dollarChange" label="$ Chg" />
                <SortHeader field="percentChange" label="% Chg" />
                <SortHeader field="spyReturn" label="SPY" />
                <SortHeader field="vsSpy" label="vs SPY" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {getSortedPositions().map(position => {
                const alpha = position.spyReturn !== undefined ? position.percentChange - position.spyReturn : undefined;
                return (
                  <TableRow key={position.ticker} style={getGradientStyle(position.percentChange)}>
                    <TableCell className="font-medium">
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <div className="cursor-help">
                            {position.ticker}
                            <span className={cn("ml-2 text-xs", getValueColor(position.dayChangePercent, true))}>
                              {position.dayChangePercent > 0 ? '+' : ''}{position.dayChangePercent?.toFixed(2)}%
                            </span>
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80">
                          <div className="space-y-2">
                            <h4 className="font-medium">{position.ticker} Daily Statistics</h4>
                            <div className="grid grid-cols-2 gap-1 text-sm">
                              <div>Day Range:</div>
                              <div>${position.dayLow?.toFixed(2)} - ${position.dayHigh?.toFixed(2)}</div>
                              <div>Volume:</div>
                              <div>{position.volume?.toLocaleString()}</div>
                              <div>Current Price:</div>
                              <div>${position.currentPrice?.toFixed(2)}</div>
                              <div>Sector:</div>
                              <div>{position.sector}</div>
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    </TableCell>
                    <TableCell>{position.industry}</TableCell>
                    <TableCell>{format(new Date(position.buyDate), "MM/dd/yy")}</TableCell>
                    <TableCell>{position.shares.toFixed(2)}</TableCell>
                    <TableCell>${position.avgCost.toFixed(2)}</TableCell>
                    <TableCell>${position.currentValue.toFixed(2)}</TableCell>
                    <TableCell className={getPeRatioColor(position.peRatio, position.industryPE)}>
                      {position.peRatio?.toFixed(2) ?? 'N/A'}
                    </TableCell>
                    <TableCell className={getValueColor(position.dollarChange, true)}>
                      ${position.dollarChange.toFixed(2)}
                    </TableCell>
                    <TableCell className={getValueColor(position.percentChange, true)}>
                      {position.percentChange > 0 ? '+' : ''}{position.percentChange.toFixed(2)}%
                    </TableCell>
                    <TableCell className={getValueColor(position.spyReturn)}>
                      {position.spyReturn?.toFixed(2) ?? 'N/A'}%
                    </TableCell>
                    <TableCell className={getValueColor(alpha)}>
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

export default OpenPositionsTable;
