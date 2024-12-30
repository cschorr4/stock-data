// components/portfolio-layout.tsx
import React from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "@/components/nav"
import { ScrollArea } from "@/components/ui/scroll-area"

interface PortfolioLayoutProps {
  children: React.ReactNode
  selectedView: string
  setSelectedView: (view: string) => void
  setIsAddDialogOpen: (open: boolean) => void
}

export function PortfolioLayout({ 
  children, 
  selectedView, 
  setSelectedView,
  setIsAddDialogOpen 
}: PortfolioLayoutProps) {
  return (
    <div className="h-screen flex dark:bg-background">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="md:hidden fixed left-4 top-4 z-40"
            size="icon"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72">
          <ScrollArea className="h-full">
            <Sidebar 
              selectedView={selectedView}
              setSelectedView={setSelectedView}
              setIsAddDialogOpen={setIsAddDialogOpen}
              playlists={[]}
              className="w-full"
            />
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <div className="hidden md:flex">
        <ScrollArea className="w-72 flex-shrink-0 border-r">
          <Sidebar
            selectedView={selectedView}
            setSelectedView={setSelectedView}
            setIsAddDialogOpen={setIsAddDialogOpen}
            playlists={[]}
          />
        </ScrollArea>
      </div>

      <main className="flex-1 overflow-auto">
        <div className="container max-w-7xl py-6">
          {children}
        </div>
      </main>
    </div>
  )
}