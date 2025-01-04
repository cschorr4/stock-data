import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface MetricCardProps {
  title: string;
  icon: React.ReactNode;
  mainValue: string | number;
  mainValueColor: string;
  metric1Label: string;
  metric1Value: string | number;
  metric1Color: string;
  metric2Label: string;
  metric2Value: string | number;
  metric2Color: string;
  gradient: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  icon,
  mainValue,
  mainValueColor,
  metric1Label,
  metric1Value,
  metric1Color,
  metric2Label,
  metric2Value,
  metric2Color,
  gradient
}) => (
  <Card
    className={`w-full max-w-[280px] ${gradient}
      rounded-xl border-0 shadow-lg transition-all duration-300
      hover:shadow-xl hover:scale-105 cursor-pointer`}
  >
    <CardContent className="p-5">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {title}
          </span>
          <div className="rounded-full bg-white/20 p-2">
            {icon}
          </div>
        </div>

        {/* Main Value */}
        <div className={`text-3xl font-bold ${mainValueColor}`}>
          {mainValue}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {metric1Label}
            </p>
            <p className={`text-sm font-semibold ${metric1Color}`}>
              {metric1Value}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {metric2Label}
            </p>
            <p className={`text-sm font-semibold ${metric2Color}`}>
              {metric2Value}
            </p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default MetricCard;
