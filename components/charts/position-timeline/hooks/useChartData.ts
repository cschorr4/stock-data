import { useMemo } from 'react';
import { Transaction, Position, ClosedPosition } from '@/lib/types';

interface PositionPeriod {
  start: string;
  end: string | null;
  type: 'open' | 'closed';
}

interface PositionState {
  periods: PositionPeriod[];
}

export const usePositionTimeline = (
  openPositions: Position[],
  closedPositions: ClosedPosition[]
): Record<string, PositionState> => {
  return useMemo(() => {
    const states: Record<string, PositionState> = {};

    [...openPositions, ...closedPositions].forEach(pos => {
      if (!states[pos.ticker]) {
        states[pos.ticker] = { periods: [] };
      }
    });

    closedPositions.forEach(pos => {
      states[pos.ticker].periods.push({
        start: pos.buyDate,
        end: pos.sellDate,
        type: 'closed'
      });
    });

    openPositions.forEach(pos => {
      states[pos.ticker].periods.push({
        start: pos.buyDate,
        end: null,
        type: 'open'
      });
    });

    return states;
  }, [openPositions, closedPositions]);
};

interface ChartPoint {
  date: string;
  [key: string]: number | string;
}

export const useChartDataProcessing = (
  chartData: ChartPoint[],
  positionStates: Record<string, PositionState>,
  showPercentage: boolean
): ChartPoint[] => {
  return useMemo(() => {
    if (!chartData.length) return [];

    const baseValues: Record<string, number> = {};
    const firstPoint = chartData[0];
    
    Object.entries(firstPoint).forEach(([key, value]) => {
      if (key !== 'date' && typeof value === 'number') {
        baseValues[key] = value;
      }
    });

    return chartData.map(point => {
      const processedPoint: ChartPoint = { date: point.date };
      const currentDate = new Date(point.date);

      if (typeof point.SPY === 'number') {
        processedPoint.SPY = showPercentage
          ? ((point.SPY - baseValues.SPY) / baseValues.SPY) * 100
          : point.SPY;
      }

      Object.entries(positionStates).forEach(([ticker, state]) => {
        const value = point[ticker];
        if (typeof value !== 'number') return;

        const baseValue = baseValues[ticker];
        const normalizedValue = showPercentage && baseValue
          ? ((value - baseValue) / baseValue) * 100
          : value;

        const activeStatus = state.periods.reduce<'inactive' | 'open' | 'closed'>((status, period) => {
          const startDate = new Date(period.start);
          const endDate = period.end ? new Date(period.end) : null;
          
          if (currentDate >= startDate && (!endDate || currentDate <= endDate)) {
            return period.type;
          }
          return status;
        }, 'inactive');

        processedPoint[`${ticker}_${activeStatus}`] = normalizedValue;
      });

      return processedPoint;
    });
  }, [chartData, positionStates, showPercentage]);
};