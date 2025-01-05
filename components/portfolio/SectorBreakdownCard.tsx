import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SectorBreakdownCardProps {
  sectorData: {
    sector: string;
    allocation: number;
    positions: number;
  }[];
}

const COLORS = [
  '#60a5fa', '#34d399', '#a78bfa', '#f87171', '#fbbf24',
  '#a855f7', '#ec4899', '#14b8a6', '#f472b6', '#22d3ee',
  '#6366f1', '#fb923c', '#4ade80', '#e879f9',
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-2 rounded shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="text-xs font-medium">{payload[0].name}</p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {payload[0].value.toFixed(1)}%
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500">
          {payload[0].payload.positions} positions
        </p>
      </div>
    );
  }
  return null;
};

const SectorBreakdownCard: React.FC<SectorBreakdownCardProps> = ({ sectorData }) => {
  const filteredData = sectorData
    .filter(item => item.allocation > 0)
    .sort((a, b) => b.allocation - a.allocation);

  return (
    <Card className="flex-none w-[220px] xs:w-[200px] sm:w-[220px] md:w-[240px] bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border-0 shadow-sm transition-all duration-200 hover:shadow-md">
  <CardContent className="p-4">
    <div className="space-y-3">
      {/* Header remains the same */}
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-indigo-100 dark:bg-indigo-900/30 p-1.5">
          <PieChartIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Sector Breakdown
        </span>
      </div>

      {/* Main Content */}
      <div className="flex gap-3">
        {/* Slightly shorter chart */}
        <div className="w-30 h-28"> {/* Reduced height */}
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={filteredData}
                dataKey="allocation"
                nameKey="sector"
                cx="50%"
                cy="50%"
                innerRadius={26}
                outerRadius={42}
                paddingAngle={2}
              >
                {filteredData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    className="stroke-white dark:stroke-gray-800"
                    strokeWidth={1.5}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <ScrollArea className="flex-1 h-28">
          <div className="space-y-1.5 pr-2">
            {filteredData.map((item, index) => (
              <div key={item.sector} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div 
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-gray-700 dark:text-gray-300 truncate max-w-[90px]">
                    {item.sector}
                  </span>
                </div>
                <span className="font-medium whitespace-nowrap text-gray-900 dark:text-gray-100">
                  {item.allocation.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  </CardContent>
</Card>

  );
};

export default SectorBreakdownCard;
