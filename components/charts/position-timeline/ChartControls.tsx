import React from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { DollarSign, PercentIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
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
  { label: '1M', icon: '📅' },
  { label: '3M', icon: '📊' },
  { label: '6M', icon: '📈' },
  { label: '1Y', icon: '📆' },
  { label: '2Y', icon: '📉' },
  { label: '5Y', icon: '📋' },
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
    <div className="flex flex-col space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {/* Left group: Stock selector and percentage toggle */}
        <div className="flex items-center gap-2">
          <StockSelector
            tickers={allTickers}
            selectedTickers={selectedTickers}
            onSelectTicker={onTickerSelect}
          />
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
        </div>

        {/* Right group: Time range selector */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              {timeRange}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-4" align="end">
            <div className="grid grid-cols-3 gap-2">
              {presetRanges.map(({ label, icon }) => (
                <Button
                  key={label}
                  variant={timeRange === label ? "default" : "outline"}
                  className="h-12"
                  onClick={() => onTimeRangeChange(label)}
                >
                  <span className="mr-2">{icon}</span>
                  {label}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};