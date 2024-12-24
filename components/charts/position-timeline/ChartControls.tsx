import React from 'react';
import { subYears, format } from 'date-fns';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { DollarSign, PercentIcon, Settings2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

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

export const ChartControls: React.FC<ChartControlsProps> = ({
  allTickers,
  selectedTickers,
  showPercentage,
  timeRange,
  onTickerSelect,
  onShowPercentageChange,
  onTimeRangeChange,
}) => {
  const today = new Date();
  const [startDate, setStartDate] = React.useState(format(subYears(today, 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = React.useState(format(today, 'yyyy-MM-dd'));
  const [isOpen, setIsOpen] = React.useState(false);

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

  const handleClearAll = () => {
    allTickers.forEach(ticker => {
      if (selectedTickers.includes(ticker) && ticker !== 'SPY') {
        onTickerSelect(ticker);
      }
    });
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="flex flex-wrap gap-1">
        {selectedTickers.map(ticker => (
          ticker !== 'SPY' && (
            <Badge
              key={ticker}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => onTickerSelect(ticker)}
            >
              {ticker}
              <span className="ml-1">×</span>
            </Badge>
          )
        ))}
      </div>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Settings2 className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="end">
          <div className="grid gap-2 p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Stocks</Label>
                <Command className="rounded-lg border shadow-md">
                  <CommandInput placeholder="Search stocks..." />
                  <CommandEmpty>No stocks found.</CommandEmpty>
                  <CommandGroup>
                    <ScrollArea className="h-[200px]">
                      {allTickers.map(ticker => (
                        ticker !== 'SPY' && (
                          <CommandItem
                            key={ticker}
                            onSelect={() => onTickerSelect(ticker)}
                            className="cursor-pointer"
                          >
                            <span className={selectedTickers.includes(ticker) ? 'font-bold' : ''}>
                              {ticker}
                            </span>
                          </CommandItem>
                        )
                      ))}
                    </ScrollArea>
                  </CommandGroup>
                </Command>
                {selectedTickers.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                    className="w-full mt-2"
                  >
                    Clear All
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label>Chart Display</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="chart-view-toggle"
                    checked={showPercentage}
                    onCheckedChange={onShowPercentageChange}
                  />
                  <Label htmlFor="chart-view-toggle" className="flex items-center space-x-1">
                    {showPercentage ? <PercentIcon className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />}
                    <span>{showPercentage ? 'Percentage' : 'Price'}</span>
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Time Range</Label>
                <div className="grid grid-cols-3 gap-2">
                  {presetRanges.map(({ label, days, icon }) => (
                    <Button
                      key={label}
                      variant={timeRange === label ? "default" : "outline"}
                      size="sm"
                      className="h-9"
                      onClick={() => handlePresetClick(days, label)}
                    >
                      <span className="mr-1">{icon}</span>
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="relative pt-2">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-muted" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-2 text-xs text-muted-foreground">
                    Custom Range
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
                    className="h-9"
                  />
                  <Input
                    type="date"
                    value={endDate}
                    min={startDate}
                    max={format(today, 'yyyy-MM-dd')}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-9"
                  /></div>
                  <Button
                    onClick={handleCustomRangeSubmit}
                    size="sm"
                    className="w-full"
                  >
                    Apply Custom Range
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
  
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsOpen(true)}
          className="ml-auto"
        >
          {timeRange === 'custom' 
            ? `${format(new Date(startDate), 'MMM d, yyyy')} - ${format(new Date(endDate), 'MMM d, yyyy')}`
            : timeRange}
        </Button>
      </div>
    );
  };
  
  export default ChartControls;