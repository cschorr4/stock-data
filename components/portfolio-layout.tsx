import React from 'react';
import { Sidebar } from './nav';
import ViewSwitcher from './view-switcher';

interface PortfolioLayoutProps {
  children: React.ReactNode;
  selectedView: string;
  setSelectedView: (view: string) => void;
  setIsAddDialogOpen: (isOpen: boolean) => void;
}

export default function PortfolioLayout({ 
  children,
  selectedView, 
  setSelectedView,
  setIsAddDialogOpen 
}: PortfolioLayoutProps) {
  return (
    <div className="grid lg:grid-cols-5">
      <Sidebar 
        selectedView={selectedView}
        setSelectedView={setSelectedView}
        setIsAddDialogOpen={setIsAddDialogOpen}
        playlists={[]} // Add your playlists here if needed
      />
      <div className="col-span-3 lg:col-span-4 lg:border-l">
        <ViewSwitcher selectedView={selectedView} setSelectedView={setSelectedView}>
          {children}
        </ViewSwitcher>
      </div>
    </div>
  );
}