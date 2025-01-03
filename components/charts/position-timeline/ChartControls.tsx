import React from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { DollarSign, PercentIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import StockSelector from '@/components/StockSelector';

interface ChartControlsProps {
  allTickers: string[];
  selectedTickers: string[];
  showPercentage: boolean;
  timeRange: string;
  onTickerSelect: (ticker: string) => void;
  onShowPercentageChange: (checked: boolean) => void;
  onTimeRangeChange: (value: string) => void;
}

const presetRanges = [
  { label: '1M', icon: '📅', description: 'Last 30 days' },
  { label: '3M', icon: '📊', description: 'Last 90 days' },
  { label: '6M', icon: '📈', description: 'Last 180 days' },
  { label: '1Y', icon: '📆', description: 'Last 12 months' },
  { label: '2Y', icon: '📉', description: 'Last 24 months' },
  { label: '5Y', icon: '📋', description: 'Last 5 years' },
];

export const ChartControls: React.FC<ChartControlsProps> = ({
  allTickers,
  selectedTickers,
  showPercentage,
  timeRange,
  onTickerSelect,
  onShowPercentageChange,
  onTimeRangeChange,
}) => {
  return (
    <TooltipProvider>
      <div className="flex flex-col space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <StockSelector
              tickers={allTickers}
              selectedTickers={selectedTickers}
              onSelectTicker={onTickerSelect}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="chart-view-toggle"
                    checked={showPercentage}
                    onCheckedChange={onShowPercentageChange}
                  />
                  <Label htmlFor="chart-view-toggle" className="flex items-center space-x-1">
                    {showPercentage ? <PercentIcon className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />}
                  </Label>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                Toggle between percentage and dollar values
              </TooltipContent>
            </Tooltip>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                {timeRange}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-4" align="end">
              <div className="grid grid-cols-3 gap-2" role="group" aria-label="Time range selection">
                {presetRanges.map(({ label, icon, description }) => (
                  <Tooltip key={label}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={timeRange === label ? "default" : "outline"}
                        className="h-12"
                        onClick={() => onTimeRangeChange(label)}
                      >
                        <span className="mr-2">{icon}</span>
                        {label}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {description}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </TooltipProvider>
  );
};