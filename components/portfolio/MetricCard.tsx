import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
    className={cn(
      "w-[220px] xs:w-[200px] sm:w-[220px] md:w-[240px]",
      gradient,
      "rounded-xl border-0",
      "shadow-sm transition-all duration-300",
      "hover:shadow-lg hover:-translate-y-1",
      "relative overflow-hidden"
    )}
  >
    {/* Gradient overlay for depth effect */}
    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5" />
    
    <CardContent className="p-4 relative">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-white/20 dark:bg-white/10 backdrop-blur-sm p-2 shadow-sm">
              {icon}
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {title}
            </span>
          </div>
        </div>

        {/* Main Value with enhanced typography */}
        <div className="space-y-1">
          <div className={cn(
            "text-2xl md:text-3xl font-bold tracking-tight",
            mainValueColor
          )}>
            {mainValue}
          </div>
        </div>

        {/* Metrics Grid with improved spacing and alignment */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {metric1Label}
            </p>
            <p className={cn(
              "text-sm font-semibold",
              metric1Color
            )}>
              {metric1Value}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {metric2Label}
            </p>
            <p className={cn(
              "text-sm font-semibold",
              metric2Color
            )}>
              {metric2Value}
            </p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default MetricCard;