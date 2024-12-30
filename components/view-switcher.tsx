import React from 'react';
import { cn } from "@/lib/utils";

interface ViewSwitcherProps {
  children: React.ReactNode;
  selectedView: string;
  setSelectedView: (view: string) => void;
}

export default function ViewSwitcher({ 
  children,
  selectedView, 
  setSelectedView 
}: ViewSwitcherProps) {
  return (
    <div className={cn(
      "flex h-full flex-col",
      selectedView === "menu" ? "block" : "hidden lg:block"
    )}>
      {children}
    </div>
  );
}