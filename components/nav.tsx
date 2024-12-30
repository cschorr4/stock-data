// components/nav.tsx
import React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Plus, Layout, LineChart, History, Settings } from 'lucide-react'

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  selectedView: string
  setSelectedView: (view: string) => void
  setIsAddDialogOpen: (open: boolean) => void
  playlists: string[]
}

export function Sidebar({ className, selectedView, setSelectedView, setIsAddDialogOpen }: SidebarProps) {
  const navigation = [
    { id: 'overview', name: 'Dashboard', icon: Layout },
    { id: 'positions', name: 'Positions', icon: LineChart },
    { id: 'transactions', name: 'History', icon: History },
    { id: 'settings', name: 'Settings', icon: Settings }
  ]

  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
            Portfolio
          </h2>
          <div className="space-y-1">
            <Button 
              variant="secondary" 
              className="w-full justify-start"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Transaction
            </Button>
          </div>
        </div>
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
            Overview
          </h2>
          <div className="space-y-1">
            {navigation.map((item) => (
              <Button
                key={item.id}
                variant={selectedView === item.id ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setSelectedView(item.id)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}