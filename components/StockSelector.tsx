import React from 'react';
import { Check, X, ChevronsUpDown, Sparkles } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface StockSelectorProps {
  tickers: string[];
  selectedTickers: string[];
  onSelectTicker: (ticker: string) => void;
}

const StockSelector: React.FC<StockSelectorProps> = ({ 
  tickers, 
  selectedTickers, 
  onSelectTicker 
}) => {
  const [open, setOpen] = React.useState<boolean>(false);
  const [search, setSearch] = React.useState<string>("");
  const [activeTab, setActiveTab] = React.useState<"all" | "recommended">("all");

  const filteredTickers = React.useMemo(() => {
    const searchLower = search.toLowerCase();
    return tickers.filter((ticker: string) => 
      ticker.toLowerCase().includes(searchLower)
    );
  }, [tickers, search]);

  const toggleTicker = (ticker: string): void => {
    onSelectTicker(ticker);
  };

  const clearAll = (): void => {
    selectedTickers.forEach((ticker: string) => {
      if (ticker !== 'SPY') {
        onSelectTicker(ticker);
      }
    });
  };

  const selectAll = (): void => {
    filteredTickers.forEach((ticker: string) => {
      if (!selectedTickers.includes(ticker)) {
        onSelectTicker(ticker);
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5 min-h-[32px]">
        {selectedTickers.length > 0 ? (
          selectedTickers.map((ticker: string) => (
            <Badge
              key={ticker}
              variant="secondary"
              className={cn(
                "transition-all hover:bg-accent",
                ticker === 'SPY' ? 'cursor-default' : 'cursor-pointer hover:shadow-sm'
              )}
              onClick={() => ticker !== 'SPY' && toggleTicker(ticker)}
            >
              {ticker}
              {ticker !== 'SPY' && (
                <X className="ml-1 h-3 w-3 opacity-60 hover:opacity-100" />
              )}
            </Badge>
          ))
        ) : (
          <div className="text-sm text-muted-foreground px-1">
            No stocks selected
          </div>
        )}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="text-muted-foreground">
              Select stocks...
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-2" align="start">
          <Tabs 
            defaultValue="all" 
            value={activeTab} 
            onValueChange={(value: string) => setActiveTab(value as "all" | "recommended")}
            className="w-full"
          >
            <div className="flex flex-col gap-3">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="all" className="text-sm">
                  All Stocks
                </TabsTrigger>
                <TabsTrigger value="recommended" className="flex items-center gap-1">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm">Recommended</span>
                </TabsTrigger>
              </TabsList>

              <div className="space-y-2">
                <Input
                  placeholder="Search stocks..."
                  value={search}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                  className="h-8"
                />
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-full"
                    onClick={clearAll}
                  >
                    Clear
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-full"
                    onClick={selectAll}
                  >
                    Select All
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[200px] rounded-md border">
                <div className="flex flex-col py-1">
                  {filteredTickers.map((ticker: string) => (
                    <div
                      key={ticker}
                      className={cn(
                        "flex cursor-pointer items-center justify-between px-2 py-1.5 hover:bg-accent/50 transition-colors",
                        selectedTickers.includes(ticker) && "bg-accent"
                      )}
                      onClick={() => toggleTicker(ticker)}
                    >
                      <span className="text-sm font-medium">{ticker}</span>
                      {selectedTickers.includes(ticker) && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </Tabs>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default StockSelector;