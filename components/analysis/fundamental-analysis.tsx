import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Info } from 'lucide-react';

const LoadingValue = () => (
  <div className="animate-pulse">
    <div className="h-6 w-24 bg-muted-foreground/20 rounded" />
  </div>
);

const MetricCard = ({ label, value, trend = null, isLoading = false, info = '' }) => {
  const getTrendColor = () => {
    if (!trend) return '';
    return parseFloat(trend) > 0 ? 'text-green-500' : 'text-red-500';
  };

  const TrendIcon = () => {
    if (!trend) return null;
    return parseFloat(trend) > 0 ? (
      <TrendingUp className="w-4 h-4 text-green-500" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-500" />
    );
  };

  const [showInfo, setShowInfo] = React.useState(false);

  return (
    <div 
      className="p-4 bg-muted/50 rounded-lg transition-all duration-200 hover:bg-muted hover:shadow-md relative"
      onMouseEnter={() => setShowInfo(true)}
      onMouseLeave={() => setShowInfo(false)}  
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm text-muted-foreground">{label}</h3>
          {info && <Info className={`w-4 h-4 transition-opacity ${showInfo ? 'opacity-100' : 'opacity-0'}`} />}
        </div>
        {!isLoading && <TrendIcon />}
      </div>
      <div className="flex items-baseline gap-2">
        {isLoading ? (
          <LoadingValue />
        ) : (
          <>
            <p className={`text-xl font-bold ${getTrendColor()}`}>{value}</p>
            {trend && (
              <span className={`text-sm ${getTrendColor()}`}>
                {parseFloat(trend) > 0 ? '+' : ''}{trend}%
              </span>
            )}
          </>
        )}
      </div>
      {info && showInfo && (
        <div className="absolute z-10 p-2 bg-popover text-popover-foreground rounded-md shadow-lg -top-12 left-1/2 transform -translate-x-1/2 w-48 text-sm">
          {info}
        </div>
      )}
    </div>
  );
};

const METRIC_INFO = {
  'Market Cap': 'Total value of all outstanding shares',
  'P/E Ratio': 'Price relative to earnings per share',
  'EPS': 'Net income per outstanding share',
  'PEG Ratio': 'P/E ratio relative to growth rate',
  'Book Value': 'Net value of assets per share',
  'Dividend Yield': 'Annual dividend as percentage of price',
  'Profit Margin': 'Net income as percentage of revenue',
  'Revenue': 'Total sales generated',
  'Revenue Growth': 'Year-over-year revenue increase',
  'Debt to Equity': 'Total debt relative to equity',
  'Current Ratio': 'Short-term assets vs. liabilities',
  'ROE': 'Return on equity percentage',
  'Beta': 'Stock volatility vs. market',
  '52W Range': 'Trading range over past year',
  'Average Volume': 'Average daily trading volume'
};

const FundamentalAnalysis = ({ data, isLoading = false }) => {
  const formatValue = (value, prefix = '', suffix = '') => {
    if (!value && value !== 0) return 'N/A';
    if (typeof value === 'number') {
      if (Math.abs(value) >= 1e12) {
        return `${prefix}${(value / 1e12).toFixed(2)}T${suffix}`;
      }
      if (Math.abs(value) >= 1e9) {
        return `${prefix}${(value / 1e9).toFixed(2)}B${suffix}`;
      }
      if (Math.abs(value) >= 1e6) {
        return `${prefix}${(value / 1e6).toFixed(2)}M${suffix}`;
      }
      return `${prefix}${value.toFixed(2)}${suffix}`;
    }
    return `${prefix}${value}${suffix}`;
  };

  const metricsData = [
    {
      label: 'Market Cap',
      value: formatValue(data?.marketCap, '$'),
      info: METRIC_INFO['Market Cap']
    },
    {
      label: 'P/E Ratio',
      value: formatValue(data?.peRatio),
      info: METRIC_INFO['P/E Ratio']
    },
    {
      label: 'EPS',
      value: formatValue(data?.eps, '$'),
      info: METRIC_INFO['EPS']
    },
    {
      label: 'PEG Ratio',
      value: formatValue(data?.pegRatio),
      info: METRIC_INFO['PEG Ratio']
    },
    {
      label: 'Book Value',
      value: formatValue(data?.bookValue, '$'),
      info: METRIC_INFO['Book Value']
    },
    {
      label: 'Dividend Yield',
      value: data?.dividendYield ? formatValue(data.dividendYield, '', '%') : 'N/A',
      info: METRIC_INFO['Dividend Yield']
    },
    {
      label: 'Profit Margin',
      value: formatValue(data?.profitMargin, '', '%'),
      info: METRIC_INFO['Profit Margin']
    },
    {
      label: 'Revenue',
      value: formatValue(data?.revenue, '$'),
      info: METRIC_INFO['Revenue']
    },
    {
      label: 'Revenue Growth',
      value: formatValue(data?.revenueGrowth, '', '%'),
      trend: data?.revenueGrowth?.toString(),
      info: METRIC_INFO['Revenue Growth']
    },
    {
      label: 'Debt to Equity',
      value: formatValue(data?.debtToEquity),
      info: METRIC_INFO['Debt to Equity']
    },
    {
      label: 'Current Ratio',
      value: formatValue(data?.currentRatio),
      info: METRIC_INFO['Current Ratio']
    },
    {
      label: 'ROE',
      value: formatValue(data?.returnOnEquity, '', '%'),
      info: METRIC_INFO['ROE']
    },
    {
      label: 'Beta',
      value: formatValue(data?.beta),
      info: METRIC_INFO['Beta']
    },
    {
      label: '52W Range',
      value: `$${formatValue(data?.fiftyTwoWeekLow)} - $${formatValue(data?.fiftyTwoWeekHigh)}`,
      info: METRIC_INFO['52W Range']
    },
    {
      label: 'Average Volume',
      value: formatValue(data?.averageVolume),
      info: METRIC_INFO['Average Volume']
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Company Overview - {isLoading ? <LoadingValue /> : data?.companyName}
        </CardTitle>
        {!isLoading && data?.sector && (
          <p className="text-muted-foreground">
            {data.sector} | {data.industry}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricsData.map((metric) => (
            <MetricCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              trend={metric.trend}
              isLoading={isLoading}
              info={metric.info}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FundamentalAnalysis;