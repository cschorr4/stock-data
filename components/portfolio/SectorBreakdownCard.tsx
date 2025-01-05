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

// Extended color palette for more sectors
const COLORS = [
  '#60a5fa', // blue-400
  '#34d399', // emerald-400
  '#a78bfa', // violet-400
  '#f87171', // red-400
  '#fbbf24', // amber-400
  '#a855f7', // purple-400
  '#ec4899', // pink-400
  '#14b8a6', // teal-400
  '#f472b6', // pink-400
  '#22d3ee', // cyan-400
  '#6366f1', // indigo-400
  '#fb923c', // orange-400
  '#4ade80', // green-400
  '#e879f9', // fuchsia-400
  '#2dd4bf', // teal-400
  '#38bdf8', // sky-400
  '#818cf8', // indigo-400
  '#fb7185', // rose-400
  '#94a3b8', // slate-400
  '#c084fc', // purple-400
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

const CustomLegend = ({ payload }: any) => {
  return (
    <ScrollArea className="h-40 w-full pr-4">
      <div className="space-y-1">
        {payload.map((entry: any, index: number) => (
          <div key={entry.value} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <div 
                className="w-2 h-2 rounded-full flex-shrink-0" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600 dark:text-gray-400 truncate max-w-[120px]">
                {entry.value}
              </span>
            </div>
            <span className="font-medium whitespace-nowrap">
              {entry.payload.allocation.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

const SectorBreakdownCard: React.FC<SectorBreakdownCardProps> = ({ sectorData }) => {
  // Filter out sectors with 0 allocation and sort by allocation
  const filteredData = sectorData
    .filter(item => item.allocation > 0)
    .sort((a, b) => b.allocation - a.allocation);

  return (
    <Card className="flex-none w-[220px] xs:w-[200px] sm:w-[220px] md:w-[240px] bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border-0 shadow-sm transition-all duration-200 hover:shadow-md">
      <CardContent className="p-3">
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-white/10 p-1">
              <PieChartIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Sector Breakdown
            </span>
          </div>

          {/* Chart */}
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={filteredData}
                  dataKey="allocation"
                  nameKey="sector"
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={70}
                  paddingAngle={2}
                >
                  {filteredData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      className="stroke-white dark:stroke-gray-800"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Scrollable Legend */}
          <CustomLegend 
            payload={filteredData.map((item, index) => ({
              value: item.sector,
              color: COLORS[index % COLORS.length],
              payload: item
            }))} 
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default SectorBreakdownCard;