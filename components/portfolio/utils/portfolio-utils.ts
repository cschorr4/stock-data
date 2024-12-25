import { Position, PortfolioMetrics } from '@/lib/types';
import _ from 'lodash';

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: Math.abs(value) >= 1000000 ? 'compact' : 'standard',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export const formatPercentage = (value: number | undefined | null, decimals = 1): string => {
  if (value == null) return '0%';
  return `${value.toFixed(decimals)}%`;
};

export const getColorForValue = (value: number): string => {
  if (value > 0) return 'text-green-600 dark:text-green-400';
  if (value < 0) return 'text-red-600 dark:text-red-400';
  return 'text-gray-600 dark:text-gray-400';
};

export const calculateSectorData = (positions: Position[]) => {
  const sectorGroups = _.groupBy(positions, 'sector');
  const totalValue = _.sumBy(positions, 'currentValue');

  return Object.entries(sectorGroups).map(([sector, posArray]) => ({
    sector,
    allocation: (_.sumBy(posArray, 'currentValue') / totalValue) * 100,
    return: _.meanBy(posArray, 'percentChange') || 0,
    positions: posArray.length
  }));
};

export const calculateRiskMetrics = (metrics: PortfolioMetrics, positions: Position[]) => {
  const portfolioValue = _.sumBy(positions, 'currentValue');
  const weightedBeta = positions.reduce((acc, pos) => {
    const weight = pos.currentValue / portfolioValue;
    return acc + (pos.beta || 1) * weight;
  }, 0);

  return {
    portfolioBeta: weightedBeta,
    sectorConcentration: calculateSectorConcentration(positions),
    riskScore: calculateRiskScore(metrics, weightedBeta)
  };
};

const calculateSectorConcentration = (positions: Position[]): number => {
  const sectorGroups = _.groupBy(positions, 'sector');
  const totalValue = _.sumBy(positions, 'currentValue');
  
  return Object.values(sectorGroups).reduce((acc, posArray) => {
    const sectorWeight = _.sumBy(posArray, 'currentValue') / totalValue;
    return acc + Math.pow(sectorWeight, 2);
  }, 0);
};

const calculateRiskScore = (metrics: PortfolioMetrics, beta: number): number => {
  const volatilityScore = Math.min(metrics.maxDrawdown / 20, 1);
  const betaScore = Math.min(Math.abs(beta - 1), 1);
  const concentrationScore = Math.min(metrics.industryMetrics.length / 10, 1);
  
  return ((volatilityScore + betaScore + concentrationScore) / 3) * 100;
};