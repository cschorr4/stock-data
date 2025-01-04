import React from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { DollarSign, PercentIcon, Calendar } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import StockSelector from '@/components/StockSelector';
import { cn } from "@/lib/utils";
import { format, subMonths } from "date-fns";

interface ChartControlsProps {
  allTickers: string[];
  selectedTickers: string[];
  showPercentage: boolean;
  timeRange: string;
  onTickerSelect: (ticker: string) => void;
  onShowPercentageChange: (checked: boolean) => void;
  onTimeRangeChange: (value: string) => void;
  onCustomDateChange: (from: Date, to: Date) => void;
}

const presetRanges = [
  { label: '1M', icon: '📅', description: 'Last 30 days' },
  { label: '3M', icon: '📊', description: 'Last 90 days' },
  { label: '6M', icon: '📈', description: 'Last 180 days' },
  { label: '1Y', icon: '📆', description: 'Last 12 months' },
  { label: '2Y', icon: '📉', description: 'Last 24 months' },
  { label: '5Y', icon: '📋', description: 'Last 5 years' },
  { label: 'Custom', icon: '📌', description: 'Select custom date range' }
] as const;

export const ChartControls: React.FC<ChartControlsProps> = ({
  allTickers,
  selectedTickers,
  showPercentage,
  timeRange,
  onTickerSelect,
  onShowPercentageChange,
  onTimeRangeChange,
  onCustomDateChange
}) => {
  const [date, setDate] = React.useState<Date>();
  const [calendarOpen, setCalendarOpen] = React.useState(false);

  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      const today = new Date();
      const defaultRange = subMonths(today, 6); // Default to 6 months back if no end date
      const startDate = selectedDate < defaultRange ? selectedDate : defaultRange;
      onCustomDateChange(startDate, today);
      onTimeRangeChange('Custom');
    }
    setCalendarOpen(false);
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between w-full">
        <div className="flex flex-wrap items-center gap-3">
          {/* Stock Selector */}
          <div className="flex-1 min-w-[200px]">
            <StockSelector
              tickers={allTickers}
              selectedTickers={selectedTickers}
              onSelectTicker={onTickerSelect}
            />
          </div>

          {/* Percentage/Dollar Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center space-x-2 bg-background rounded-md p-2">
                <Switch
                  id="chart-view-toggle"
                  checked={showPercentage}
                  onCheckedChange={onShowPercentageChange}
                />
                <Label htmlFor="chart-view-toggle" className="flex items-center space-x-1 cursor-pointer">
                  {showPercentage ? 
                    <PercentIcon className="h-4 w-4" /> : 
                    <DollarSign className="h-4 w-4" />
                  }
                </Label>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              Toggle between percentage and dollar values
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Time Range Controls */}
        <div className="flex items-center gap-2">
          {/* Preset Time Ranges */}
          <div className="flex flex-wrap gap-2">
            {presetRanges.slice(0, -1).map(({ label, icon, description }) => (
              <Tooltip key={label}>
                <TooltipTrigger asChild>
                  <Button
                    variant={timeRange === label ? "default" : "outline"}
                    className={cn(
                      "h-9 px-3",
                      timeRange === label && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => onTimeRangeChange(label)}
                  >
                    <span className="mr-1">{icon}</span>
                    {label}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {description}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Custom Date Picker */}
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={timeRange === 'Custom' ? "default" : "outline"}
                className={cn(
                  "h-9 px-3",
                  timeRange === 'Custom' && "bg-primary text-primary-foreground"
                )}
              >
                <Calendar className="h-4 w-4 mr-2" />
                {date ? format(date, "LLL dd, yyyy") : "Custom"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                selected={date}
                onSelect={handleSelect}
                fromDate={new Date('1900-01-01')}
                toDate={new Date()}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ChartControls;