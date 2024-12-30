'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PortfolioTracker from '@/components/PortfolioTracker';

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <PortfolioTracker />
    </main>
  );
}