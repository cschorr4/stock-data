'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PortfolioTracker from '@/components/PortfolioTracker';

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-2">
      <Card className="max-w-7xl mx-auto">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl text-center">Portfolio Tracker</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <PortfolioTracker />
        </CardContent>
      </Card>
    </main>
  );
}