import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Layout, LineChart, CheckSquare, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';
import { Skeleton } from "@/components/ui/skeleton";
import { AuthDialog } from '@/components/auth/AuthDialog';
import { SupabaseClient, User } from '@supabase/supabase-js';

type ViewType = 'overview' | 'open-positions' | 'closed-positions' | 'transactions' | 'financials';

interface SideNavProps {
  selectedView: ViewType;
  setSelectedView: React.Dispatch<React.SetStateAction<ViewType>>;
  setIsAddDialogOpen: (value: boolean) => void;
  setIsMobileOpen?: (value: boolean) => void;
}

const navigation = [
  { id: 'overview' as ViewType, name: 'Dashboard', icon: Layout },
  { id: 'open-positions' as ViewType, name: 'Open Positions', icon: LineChart },
  { id: 'closed-positions' as ViewType, name: 'Closed Positions', icon: CheckSquare },
  { id: 'transactions' as ViewType, name: 'Transactions', icon: History },
  { id: 'financials' as ViewType, name: 'Financial Data', icon: LineChart }
] as const;

const SideNav: React.FC<SideNavProps> = ({
  selectedView,
  setSelectedView,
  setIsAddDialogOpen,
  setIsMobileOpen
}) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [supabase] = useState(() => createClient());

  const fetchUser = useCallback(async (client: SupabaseClient) => {
    try {
      const { data: { user } } = await client.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser(supabase);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchUser]);

  if (loading) {
    return (
      <div className="flex h-full w-52 flex-col bg-card border-r">
        <div className="flex flex-col h-20 px-3 border-b">
          <Skeleton className="h-6 w-24 mt-3" />
          <Skeleton className="h-4 w-32 mt-2" />
        </div>
        <div className="py-2">
          <Skeleton className="h-9 mx-2 w-[calc(100%-16px)]" />
        </div>
        <div className="flex-1 py-2 space-y-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 mx-2 w-[calc(100%-16px)]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-52 flex-col bg-card border-r shadow-sm">
      <div className="flex flex-col h-20 px-3 border-b">
        <h1 className="text-lg font-medium mt-3">Portfolio</h1>
        {user && (
          <span className="text-sm text-muted-foreground mt-1 truncate">
            {user.email?.split('@')[0]}
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