'use client';
import React from 'react';
import { Plus, Layout, LineChart, CheckSquare, History, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
// import { UserProfileForm } from '@/components/settings/UserProfileForm';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Skeleton } from "@/components/ui/skeleton";
import { AuthDialog } from '@/components/auth/AuthDialog';

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
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full w-52 flex-col bg-card border-r">
        <div className="flex h-14 items-center px-3 border-b">
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="py-2">
          <Skeleton className="h-9 mx-2 w-[calc(100%-16px)]" />
        </div>
        <div className="flex-1 py-2 space-y-1">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-9 mx-2 w-[calc(100%-16px)]" />
          ))}
        </div>
      </div>
    );
  }

  const navigation = [
    { id: 'overview' as ViewType, name: 'Dashboard', icon: Layout },
    { id: 'open-positions' as ViewType, name: 'Open Positions', icon: LineChart },
    { id: 'closed-positions' as ViewType, name: 'Closed Positions', icon: CheckSquare },
    { id: 'transactions' as ViewType, name: 'Transactions', icon: History }
  ];

  return (
    <div className="flex h-full w-52 flex-col bg-card border-r shadow-sm">
      <div className="flex h-14 items-center justify-between px-3 border-b">
        <h1 className="text-lg font-medium">Portfolio</h1>
        {user && (
          <span className="text-sm text-muted-foreground">
            Hello, {user.email?.split('@')[0]}
          </span>
        )}
      </div>

      {user && (
        <div className="py-2">
          <Button
            variant="default"
            size="sm"
            className="w-[calc(100%-16px)] mx-2 justify-start gap-2 rounded-md px-3 bg-foreground text-background hover:bg-foreground/90"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span className="overflow-hidden whitespace-nowrap">Add Transaction</span>
          </Button>
        </div>
      )}

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
              <span className="ml-3 overflow-hidden whitespace-nowrap">{item.name}</span>
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

{/* {user ? (
  selectedView === 'settings' ? (
    <div className="space-y-2">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "w-full justify-start relative group rounded-none",
          "bg-muted font-medium px-3"
        )}
      >
        <Settings className="h-4 w-4" />
        <span className="ml-3">Settings</span>
        <motion.div
          className="absolute inset-y-0 left-0 w-1 bg-foreground rounded-full"
          layoutId="activeNav"
        />
      </Button>
      <div className="px-2">
        <UserProfileForm />
      </div>
    </div>
  ) : (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start relative group rounded-none text-muted-foreground hover:text-foreground px-3"
      onClick={() => setSelectedView('settings')}
    >
      <Settings className="h-4 w-4" />
      <span className="ml-3">Settings</span>
    </Button>
  )
  
) : null} */}
</nav>

      <div className="border-t p-2 space-y-2">
        <AuthDialog />
        <div className="text-xs text-muted-foreground">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default SideNav;