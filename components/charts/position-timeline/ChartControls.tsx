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
import { format } from "date-fns";

interface ChartControlsProps {
  allTickers: string[];
  selectedTickers: string[];
  showPercentage: boolean;
  timeRange: string;
  onTickerSelect: (ticker: string) => void;
  onShowPercentageChange: (checked: boolean) => void;
  onTimeRangeChange: (value: string) => void;
  onCustomDateChange?: (from: Date, to: Date) => void;
}

const presetRanges = [
  { label: '1M', description: 'Last 30 days' },
  { label: '3M', description: 'Last 90 days' },
  { label: '6M', description: 'Last 180 days' },
  { label: '1Y', description: 'Last 12 months' },
  { label: '2Y', description: 'Last 24 months' },
  { label: '5Y', description: 'Last 5 years' }
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
  const [date, setDate] = React.useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = React.useState(false);

  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate && onCustomDateChange) {
      const endDate = new Date();
      onCustomDateChange(selectedDate, endDate);
      onTimeRangeChange('Custom');
    }
    setCalendarOpen(false);
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col space-y-4 w-full bg-card rounded-lg p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Stock Selection and View Toggle */}
          <div className="flex flex-wrap items-center gap-4 flex-1">
            <div className="flex-1 min-w-[200px] max-w-md">
              <StockSelector
                tickers={allTickers}
                selectedTickers={selectedTickers}
                onSelectTicker={onTickerSelect}
              />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 bg-accent/20 rounded-lg p-2 transition-colors hover:bg-accent/30">
                  <Switch
                    id="chart-view-toggle"
                    checked={showPercentage}
                    onCheckedChange={onShowPercentageChange}
                    className="data-[state=checked]:bg-primary"
                  />
                  <span className="flex items-center gap-1">
                    {showPercentage ? 
                      <PercentIcon className="h-4 w-4 text-primary" /> : 
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    }
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                Toggle between percentage and dollar values
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Time Range Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1.5">
              {presetRanges.map(({ label, description }) => (
                <Tooltip key={label}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={timeRange === label ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "px-3 transition-all",
                        timeRange === label && "bg-primary text-primary-foreground shadow-md"
                      )}
                      onClick={() => onTimeRangeChange(label)}
                    >
                      {label}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{description}</TooltipContent>
                </Tooltip>
              ))}
              
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={timeRange === 'Custom' ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "transition-all",
                      timeRange === 'Custom' && "bg-primary text-primary-foreground shadow-md"
                    )}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {date ? format(date, "MMM dd, yyyy") : "Custom"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent
                    selected={date}
                    onSelect={handleSelect}
                    className="rounded-md border"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ChartControls;