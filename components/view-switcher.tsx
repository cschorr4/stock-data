import React from 'react';
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ViewSwitcherProps {
  children: React.ReactNode;
  selectedView: string;
  setSelectedView: (view: string) => void;
}

export default function ViewSwitcher({ children, selectedView }: ViewSwitcherProps) {
  return (
    <div className={cn(
      "h-screen",
      selectedView === "menu" ? "block" : "hidden lg:block"
    )}>
      <ScrollArea className="h-full">
        <div className="h-full px-4 py-6 lg:px-8">
          {children}
        </div>
      </ScrollArea>
    </div>
  );
}