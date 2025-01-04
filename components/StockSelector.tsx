import React, { useState, useMemo } from 'react';
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
  stockSectors?: Record<string, SectorKey>;
}

type SectorKey = 'Healthcare' | 'Technology' | 'Energy' | 'Finance' | 
  'Consumer Cyclical' | 'Consumer Defensive' | 'Industrials' | 
  'Materials' | 'Real Estate' | 'Utilities' | 'Communication Services';

const sectorETFMap: Record<SectorKey, string[]> = {
  'Healthcare': ['XLV', 'VHT', 'IYH'],
  'Technology': ['XLK', 'VGT', 'IYW'],
  'Energy': ['XLE', 'VDE', 'IYE'],
  'Finance': ['XLF', 'VFH', 'IYF'],
  'Consumer Cyclical': ['XLY', 'VCR', 'IYC'],
  'Consumer Defensive': ['XLP', 'VDC', 'IYK'],
  'Industrials': ['XLI', 'VIS', 'IYJ'],
  'Materials': ['XLB', 'VAW', 'IYM'],
  'Real Estate': ['XLRE', 'VNQ', 'IYR'],
  'Utilities': ['XLU', 'VPU', 'IDU'],
  'Communication Services': ['XLC', 'VOX', 'IYZ']
};

const StockSelector: React.FC<StockSelectorProps> = ({ 
  tickers, 
  selectedTickers, 
  onSelectTicker,
  stockSectors = {}
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "recommended">("all");

  // Get selected sectors
  const selectedSectors = useMemo(() => 
    Array.from(new Set(
      selectedTickers
        .map(ticker => stockSectors[ticker])
        .filter((sector): sector is SectorKey => sector !== undefined)
    )),
    [selectedTickers, stockSectors]
  );

  // Get recommended ETFs based on selected sectors
  const recommendations = useMemo(() => {
    const recs = new Set<string>();
    selectedSectors.forEach(sector => {
      sectorETFMap[sector]?.forEach(etf => {
        if (!selectedTickers.includes(etf)) {
          recs.add(etf);
        }
      });
    });
    return Array.from(recs);
  }, [selectedSectors, selectedTickers]);

  const filteredTickers = useMemo(() => {
    const searchLower = search.toLowerCase();
    const tickersToFilter = activeTab === "all" ? tickers : recommendations;
    return tickersToFilter.filter(ticker =>
      ticker.toLowerCase().includes(searchLower)
    );
  }, [tickers, recommendations, search, activeTab]);

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
    const tickersToSelect = activeTab === "all" ? tickers : recommendations;
    tickersToSelect.forEach(ticker => {
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
          <Tabs defaultValue="all" value={activeTab} onValueChange={(v) => setActiveTab(v as "all" | "recommended")}>
            <div className="flex flex-col gap-2 p-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="all">All Stocks</TabsTrigger>
                <TabsTrigger 
                  value="recommended" 
                  disabled={recommendations.length === 0}
                  className="flex items-center gap-1"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Recommended</span>
                  {recommendations.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {recommendations.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

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
                    <div className="flex items-center gap-2">
                      <span>{ticker}</span>
                      {activeTab === "recommended" && (
                        <Badge variant="outline" className="text-xs">
                          {selectedSectors.find(sector => 
                            sectorETFMap[sector]?.includes(ticker)
                          )}
                        </Badge>
                      )}
                    </div>
                    {selectedTickers.includes(ticker) && (
                      <Check className="h-4 w-4" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Tabs>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default StockSelector;