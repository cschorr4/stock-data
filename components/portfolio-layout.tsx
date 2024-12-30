// components/portfolio-layout.tsx
import React from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "@/components/nav"

export function PortfolioLayout({ children, selectedView, setSelectedView, setIsAddDialogOpen }) {
    return (
        <div className="min-h-screen">
          {/* Desktop nav */}
          <div className="fixed top-0 left-0 z-30 hidden md:block h-screen">
            <div className="w-56 h-full bg-background border-r">
              <Sidebar
                selectedView={selectedView}
                setSelectedView={setSelectedView}
                setIsAddDialogOpen={setIsAddDialogOpen}
              />
            </div>
          </div>
      
          {/* Mobile nav */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="fixed md:hidden left-4 top-4 z-50"
                size="icon"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-56 p-0">
              <Sidebar
                selectedView={selectedView}
                setSelectedView={setSelectedView}
                setIsAddDialogOpen={setIsAddDialogOpen}
              />
            </SheetContent>
          </Sheet>
      
          {/* Main content */}
          <main className="md:pl-56">
            <div className="p-4 xl:p-6">
              {children}
            </div>
          </main>
        </div>
      )
    }
    