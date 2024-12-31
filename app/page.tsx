'use client';

import { Card, CardContent } from "@/components/ui/card";
import PortfolioTracker from '@/components/PortfolioTracker';

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-2">
      <Card className="h-[calc(100vh-16px)] rounded-lg border shadow-sm">
        <CardContent className="p-0 h-full">
          <PortfolioTracker />
        </CardContent>
      </Card>
    </main>
  );
}