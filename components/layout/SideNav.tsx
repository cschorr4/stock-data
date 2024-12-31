import React from 'react';
import { Plus, Layout, LineChart, CheckSquare, History, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import LoginButton from '@/components/auth/LoginButton';
import UserInfo from '@/components/auth/UserInfo';

type ViewType = 'overview' | 'open-positions' | 'closed-positions' | 'transactions' | 'settings';

interface SideNavProps {
  selectedView: ViewType;
  setSelectedView: (view: ViewType) => void;
  setIsAddDialogOpen: (value: boolean) => void;
  setIsMobileOpen?: (value: boolean) => void;
}

const SideNav: React.FC<SideNavProps> = ({ 
  selectedView, 
  setSelectedView, 
  setIsAddDialogOpen,
  setIsMobileOpen
}) => {
  const navigation = [
    { id: 'overview' as ViewType, name: 'Dashboard', icon: Layout },
    { id: 'open-positions' as ViewType, name: 'Open Positions', icon: LineChart },
    { id: 'closed-positions' as ViewType, name: 'Closed Positions', icon: CheckSquare },
    { id: 'transactions' as ViewType, name: 'Transactions', icon: History },
    { id: 'settings' as ViewType, name: 'Settings', icon: Settings }
  ];

  return (
    <div className="flex h-full w-52 flex-col bg-card border-r shadow-sm">
      {/* Header */}
      <div className="flex h-14 items-center px-3 border-b">
        <h1 className="text-lg font-medium">Portfolio</h1>
      </div>

      {/* Add Transaction Button */}
      <div className="py-2">
        <Button 
          variant="default"
          size="sm"
          className="w-[calc(100%-16px)] mx-2 justify-start gap-2 rounded-md px-3 bg-foreground text-background hover:bg-foreground/90"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          <span className="overflow-hidden whitespace-nowrap">
            Add Transaction
          </span>
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 space-y-1">
        {navigation.map((item) => {
          const isActive = selectedView === item.id;
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-start relative group rounded-none",
                isActive ? "bg-muted font-medium" : "text-muted-foreground hover:text-foreground",
                "px-3"
              )}
              onClick={() => {
                setSelectedView(item.id);
                setIsMobileOpen?.(false);
              }}
            >
              <item.icon className="h-4 w-4" />
              <span className="ml-3 overflow-hidden whitespace-nowrap">
                {item.name}
              </span>
              {isActive && (
                <motion.div
                  className="absolute inset-y-0 left-0 w-1 bg-foreground rounded-full"
                  layoutId="activeNav"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-2 space-y-2">
        <UserInfo />
        <LoginButton />
        <div className="text-xs text-muted-foreground">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default SideNav;