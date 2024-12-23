import React from 'react';
import { subYears, format } from 'date-fns';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { DollarSign, PercentIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StockSelector from '@/components/StockSelector';

interface ChartControlsProps {
  allTickers: string[];
  selectedTickers: string[];
  showPercentage: boolean;
  timeRange: string;
  onTickerSelect: (ticker: string) => void;
  onShowPercentageChange: (checked: boolean) => void;
  onTimeRangeChange: (value: string, dateRange?: { start: Date; end: Date }) => void;
}

const presetRanges = [
  { label: '1M', days: 30, icon: '📅' },
  { label: '3M', days: 90, icon: '📊' },
  { label: '6M', days: 180, icon: '📈' },
  { label: '1Y', days: 365, icon: '📆' },
  { label: '2Y', days: 730, icon: '📉' },
  { label: '5Y', days: 1825, icon: '📋' },
];

export const ChartControls = ({ 
  allTickers,
  selectedTickers,
  showPercentage,
  timeRange,
  onTickerSelect,
  onShowPercentageChange,
  onTimeRangeChange,
}: ChartControlsProps) => {
  const today = new Date();
  const [startDate, setStartDate] = React.useState(format(subYears(today, 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = React.useState(format(today, 'yyyy-MM-dd'));

  const handlePresetClick = (days: number, label: string) => {
    onTimeRangeChange(label);
  };

  const handleCustomRangeSubmit = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start && end && start <= end) {
      onTimeRangeChange('custom', { start, end });
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
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

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="ml-4">
              {timeRange === 'custom' 
                ? `${format(new Date(startDate), 'MMM d, yyyy')} - ${format(new Date(endDate), 'MMM d, yyyy')}`
                : timeRange}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="end">
            <div className="grid gap-2 p-4">
              <div className="grid grid-cols-3 gap-2">
                {presetRanges.map(({ label, days, icon }) => (
                  <Button
                    key={label}
                    variant={timeRange === label ? "default" : "outline"}
                    className="h-12"
                    onClick={() => handlePresetClick(days, label)}
                  >
                    <span className="mr-2">{icon}</span>
                    {label}
                  </Button>
                ))}
              </div>
              
              <div className="relative pt-4">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-muted" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-2 text-xs text-muted-foreground">
                    or select custom range
                  </span>
                </div>
              </div>

              <div className="grid gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={startDate}
                    max={endDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full"
                  />
                  <Input
                    type="date"
                    value={endDate}
                    min={startDate}
                    max={format(today, 'yyyy-MM-dd')}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Button
                  onClick={handleCustomRangeSubmit}
                  className="w-full"
                >
                  Apply Custom Range
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default ChartControls;