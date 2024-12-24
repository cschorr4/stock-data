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
  onTimeRangeChange: (value: string, dateRange?: { start: string; end: string }) => void;
}

interface DateRange {
  start: string;
  end: string;
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
  const defaultStartDate = format(subYears(today, 1), 'yyyy-MM-dd');
  const defaultEndDate = format(today, 'yyyy-MM-dd');
  
  const [dateRange, setDateRange] = React.useState<DateRange>({
    start: defaultStartDate,
    end: defaultEndDate
  });
  const [isValidRange, setIsValidRange] = React.useState(true);
  const [isCustom, setIsCustom] = React.useState(timeRange === 'custom');

  React.useEffect(() => {
    setIsCustom(timeRange === 'custom');
  }, [timeRange]);

  const handlePresetClick = (label: string) => {
    setIsCustom(false);
    onTimeRangeChange(label);
  };

  const validateAndFormatDate = (dateStr: string): Date | null => {
    const date = new Date(dateStr);
    return !isNaN(date.getTime()) ? date : null;
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange(prev => ({ ...prev, start: e.target.value }));
    setIsValidRange(true);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange(prev => ({ ...prev, end: e.target.value }));
    setIsValidRange(true);
  };

  const handleCustomRangeSubmit = () => {
    const start = validateAndFormatDate(dateRange.start);
    const end = validateAndFormatDate(dateRange.end);
    
    if (start && end && start <= end) {
      setIsValidRange(true);
      setIsCustom(true);
      onTimeRangeChange('custom', dateRange);
    } else {
      setIsValidRange(false);
    }
  };

  const getDisplayText = () => {
    if (isCustom) {
      try {
        return `${format(new Date(dateRange.start), 'MMM d, yyyy')} - ${format(new Date(dateRange.end), 'MMM d, yyyy')}`;
      } catch (e) {
        return 'Custom Range';
      }
    }
    const preset = presetRanges.find(r => r.label === timeRange);
    return preset ? preset.label : timeRange;
  };

  return (
    <div className="flex flex-col space-y-4 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="w-full sm:w-auto">
          <StockSelector
            tickers={allTickers}
            selectedTickers={selectedTickers}
            onSelectTicker={onTickerSelect}
          />
        </div>

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

        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full sm:w-auto"
            >
              <span className="hidden sm:inline">{getDisplayText()}</span>
              <span className="sm:hidden">
                {isCustom ? '📅' : presetRanges.find(r => r.label === timeRange)?.icon || '📅'}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-4" align="end">
            <div className="grid gap-4">
              <div className="grid grid-cols-3 gap-2">
                {presetRanges.map(({ label, icon }) => (
                  <Button
                    key={label}
                    variant={timeRange === label ? "default" : "outline"}
                    className="h-10"
                    onClick={() => handlePresetClick(label)}
                  >
                    <span className="sm:hidden">{icon}</span>
                    <span className="hidden sm:inline">{label}</span>
                  </Button>
                ))}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-muted" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-2 text-xs text-muted-foreground">
                    Custom
                  </span>
                </div>
              </div>

              <div className="grid gap-2">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={dateRange.start}
                    max={dateRange.end}
                    onChange={handleStartDateChange}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">End</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={dateRange.end}
                    min={dateRange.start}
                    max={format(today, 'yyyy-MM-dd')}
                    onChange={handleEndDateChange}
                    className="w-full"
                  />
                </div>
                {!isValidRange && (
                  <p className="text-sm text-red-500">
                    Please select a valid date range
                  </p>
                )}
                <Button
                  onClick={handleCustomRangeSubmit}
                  className="w-full mt-2"
                >
                  Apply
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};