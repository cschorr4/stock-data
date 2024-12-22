'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PortfolioTracker from '@/components/PortfolioTracker';

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-4">
      <Card className="max-w-7xl mx-auto">
        <CardHeader>
          <CardTitle className="text-xl text-center">Portfolio Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <PortfolioTracker />
        </CardContent>
      </Card>
    </main>
  );
}