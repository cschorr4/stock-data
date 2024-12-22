// components/charts/position-timeline/CustomTooltip.tsx
import { format } from 'date-fns';

interface TooltipData {
  active: boolean;
  payload: any[];
  label: string;
  positionData: Record<string, any>;
  showPercentage: boolean;
  getTickerColor: (ticker: string) => string;
}

export const CustomTooltip: React.FC<TooltipData> = ({
  active,
  payload,
  label,
  positionData,
  showPercentage,
  getTickerColor
}) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white p-4 border rounded shadow">
      <p className="font-medium">{format(new Date(label), "PPP")}</p>
      {payload.map((entry, index) => {
        const ticker = entry.dataKey.split('_')[0];
        const shares = positionData[label]?.[ticker]?.shares || 0;
        const value = entry.value;
        
        if (value === undefined || value === null) return null;

        return (
          <div key={index} className="text-sm">
            <span style={{ color: getTickerColor(ticker) }}>{ticker}</span>
            <span className="ml-2">
              {showPercentage ? `${value.toFixed(2)}%` : `$${value.toFixed(2)}`}
            </span>
            {shares > 0 && (
              <span className="ml-2 text-gray-600">
                ({shares} shares)
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
