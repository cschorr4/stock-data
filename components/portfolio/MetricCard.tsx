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
    className={`flex-none w-[200px] xs:w-[180px] sm:w-[200px] md:w-[220px] ${gradient}
      rounded-xl border-0 shadow-sm transition-all duration-200
      hover:shadow-md touch-pan-x select-none`}
  >
    <CardContent className="p-3">
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-white/10 p-1">
            {icon}
          </div>
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {title}
          </span>
        </div>

        {/* Main Value */}
        <div className={`text-lg font-semibold ${mainValueColor}`}>
          {mainValue}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-x-3">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
              {metric1Label}
            </p>
            <p className={`text-xs font-medium ${metric1Color}`}>
              {metric1Value}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
              {metric2Label}
            </p>
            <p className={`text-xs font-medium ${metric2Color}`}>
              {metric2Value}
            </p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default MetricCard;