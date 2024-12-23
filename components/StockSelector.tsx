import React, { useState } from 'react';
import { Check, X, ChevronsUpDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface StockSelectorProps {
  tickers: string[];
  selectedTickers: string[];
  onSelectTicker: (ticker: string) => void;
}

const StockSelector: React.FC<StockSelectorProps> = ({ tickers, selectedTickers, onSelectTicker }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredTickers = tickers.filter(ticker =>
    ticker.toLowerCase().includes(search.toLowerCase())
  );

  const toggleTicker = (ticker: string) => {
    onSelectTicker(ticker);
  };

  const clearAll = () => {
    selectedTickers.forEach(ticker => {
      if (ticker !== 'SPY') {
        onSelectTicker(ticker);
      }
    });
  };

  const selectAll = () => {
    tickers.forEach(ticker => {
      if (!selectedTickers.includes(ticker)) {
        onSelectTicker(ticker);
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {selectedTickers.length > 0 ? (
          selectedTickers.map((ticker) => (
            <Badge
              key={ticker}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => ticker !== 'SPY' && toggleTicker(ticker)}
            >
              {ticker}
              {ticker !== 'SPY' && <X className="ml-1 h-3 w-3" />}
            </Badge>
          ))
        ) : (
          <div className="text-sm text-muted-foreground">No stocks selected</div>
        )}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between md:w-[200px]"
          >
            Select stocks...
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 md:w-[200px]">
          <div className="flex flex-col gap-2 p-2">
            <Input
              placeholder="Search stocks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
          <ScrollArea className="h-[200px]">
            <div className="flex flex-col">
              {filteredTickers.map((ticker) => (
                <div
                  key={ticker}
                  className={cn(
                    "flex cursor-pointer items-center justify-between px-2 py-1.5 hover:bg-accent",
                    selectedTickers.includes(ticker) && "bg-accent"
                  )}
                  onClick={() => toggleTicker(ticker)}
                >
                  <span>{ticker}</span>
                  {selectedTickers.includes(ticker) && (
                    <Check className="h-4 w-4" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default StockSelector;