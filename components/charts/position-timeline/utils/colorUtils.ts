// components/charts/position-timeline/utils/colorUtils.ts
export const getTickerColor = (ticker: string, openPositions: any[]) => {
    if (ticker === 'SPY') return '#fbbf24';
    const isOpen = openPositions.some(p => p.ticker === ticker);
    return isOpen ? '#2563eb' : '#dc2626';
  };