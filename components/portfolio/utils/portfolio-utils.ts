// portfolio-utils.ts
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
  if (!positions.length) return [];
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
  if (!positions.length) {
    return {
      portfolioBeta: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      riskScore: 0,
      sectorConcentration: 0
    };
  }

  // Calculate portfolio beta and value
  const portfolioValue = _.sumBy(positions, 'currentValue');
  const weightedBeta = positions.reduce((acc, pos) => {
    const weight = pos.currentValue / portfolioValue;
    return acc + (pos.beta || 1) * weight;
  }, 0);

  // Calculate max drawdown
  const values = positions.map(pos => pos.currentValue / (pos.avgCost * pos.shares));
  let maxDrawdown = 0;
  let peak = values[0] || 1;
  values.forEach(value => {
    if (value > peak) peak = value;
    const drawdown = (peak - value) / peak * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  });

  // Calculate Sharpe ratio
  const returns = positions.map(pos => pos.percentChange);
  const avgReturn = returns.length ? _.mean(returns) : 0;
  const stdDev = Math.sqrt(_.meanBy(returns, ret => Math.pow(ret - avgReturn, 2)) || 0);
  const sharpeRatio = stdDev !== 0 ? (avgReturn - 2.5) / stdDev : 0;

  // Calculate sector concentration
  const sectorGroups = _.groupBy(positions, 'sector');
  const sectorConcentration = Object.values(sectorGroups).reduce((acc, posArray) => {
    const sectorWeight = _.sumBy(posArray, 'currentValue') / portfolioValue;
    return acc + Math.pow(sectorWeight, 2);
  }, 0);

  // Calculate risk score
  const volatilityScore = Math.min(maxDrawdown / 20, 1);
  const betaScore = Math.min(Math.abs(weightedBeta - 1), 1);
  const concentrationScore = Math.min(metrics.industryMetrics.length / 10, 1);
  const riskScore = ((volatilityScore + betaScore + concentrationScore) / 3) * 100;

  return {
    portfolioBeta: weightedBeta,
    maxDrawdown,
    sharpeRatio,
    sectorConcentration,
    riskScore
  };
};

export const calculateMetricsFromPositions = (positions: Position[]) => {
  if (!positions.length) {
    return {
      portfolioBeta: 0,
      maxDrawdown: 0,
      sharpeRatio: 0
    };
  }

  const values = positions.map(pos => pos.currentValue / (pos.avgCost * pos.shares));
  let maxDrawdown = 0;
  let peak = values[0] || 1;
  
  values.forEach(value => {
    if (value > peak) peak = value;
    const drawdown = (peak - value) / peak * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  });

  const returns = positions.map(pos => pos.percentChange);
  const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const stdDev = Math.sqrt(
    returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length
  );
  const sharpeRatio = stdDev !== 0 ? (avgReturn - 2.5) / stdDev : 0;

  const totalValue = positions.reduce((sum, pos) => sum + pos.currentValue, 0);
  const portfolioBeta = positions.reduce((beta, pos) => {
    const weight = pos.currentValue / totalValue;
    return beta + (pos.beta || 1) * weight;
  }, 0);

  return { portfolioBeta, maxDrawdown, sharpeRatio };
};