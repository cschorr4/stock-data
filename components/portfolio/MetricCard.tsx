import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { TrendingUp, TrendingDown } from 'lucide-react';

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
  tooltipContent: string;
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
  gradient,
  tooltipContent
}) => (
  <HoverCard>
    <HoverCardTrigger asChild>
      <Card className={`w-[280px] ${gradient} transition-all duration-200 hover:scale-105 cursor-pointer`}>
        <CardHeader className="space-y-0 p-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold">{title}</CardTitle>
            {icon}
          </div>
          <p className={`text-2xl font-bold ${mainValueColor} flex items-center gap-2`}>
            {mainValue}
            {typeof mainValue === 'string' ? 
              parseFloat(mainValue.replace(/[^0-9.-]+/g, '')) > 0 ? 
                <TrendingUp className="h-4 w-4 text-green-500" /> : 
                <TrendingDown className="h-4 w-4 text-red-500" />
              : mainValue > 0 ?
                <TrendingUp className="h-4 w-4 text-green-500" /> :
                <TrendingDown className="h-4 w-4 text-red-500" />
            }
          </p>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">{metric1Label}</span>
              <span className={`font-medium ${metric1Color}`}>{metric1Value}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">{metric2Label}</span>
              <span className={`font-medium ${metric2Color}`}>{metric2Value}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </HoverCardTrigger>
    <HoverCardContent className="w-80 p-4">
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">{title} Details</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">{tooltipContent}</p>
      </div>
    </HoverCardContent>
  </HoverCard>
);

export default MetricCard;