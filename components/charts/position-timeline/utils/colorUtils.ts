import { Position } from '@/lib/types';

export const getTickerColor = (ticker: string, openPositions: Position[]) => {
  if (ticker === 'SPY') return '#fbbf24';
  const isOpen = openPositions.some(p => p.ticker === ticker);
  return isOpen ? '#2563eb' : '#dc2626';
};