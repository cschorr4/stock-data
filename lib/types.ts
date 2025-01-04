// Existing interfaces
export interface Transaction {
  id: number;
  date: string;
  ticker: string;
  type: 'buy' | 'sell' | 'dividend';
  price: number;
  shares: number;
}

export interface StockQuote {
  symbol: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  volume: number;
  dayHigh: number;
  dayLow: number;
  peRatio?: number;
  forwardPE?: number;
  industryPE?: number;
  spyReturn?: number;
  sector?: string;
  industry?: string;
  beta?: number;
}

export interface ApiResponse {
  quotes: StockQuote[];
}

export interface Position {
  ticker: string;
  shares: number;
  avgCost: number;
  currentValue: number;
  currentPrice: number;
  dollarChange: number;
  percentChange: number;
  dayChange: number;
  dayChangePercent: number;
  volume?: number;
  dayHigh?: number;
  dayLow?: number;
  buyDate: string;
  lastUpdated: string;
  peRatio?: number;
  forwardPE?: number;
  industryPE?: number;
  spyReturn?: number;
  beta?: number; 
  dividendYield?: number;
  marketCap?: number;
  sector: SectorKey;
  industry: string;
}

export interface ClosedPosition {
  ticker: string;
  buyDate: string;
  sellDate: string;
  shares: number;
  buyPrice: number;
  sellPrice: number;
  profit: number;
  percentChange: number;
  spyReturn?: number;
  holdingPeriod: number;
  sector: SectorKey;
  industry: string;
}

export type SectorKey = 'Healthcare' | 'Technology' | 'Energy' | 'Finance' | 
  'Consumer Cyclical' | 'Consumer Defensive' | 'Industrials' | 
  'Materials' | 'Real Estate' | 'Utilities' | 'Communication Services';

export interface TransactionFormState {
  date: string;
  ticker: string;
  type: 'buy' | 'sell' | 'dividend';
  price: string;
  shares: string;
}

export interface PortfolioMetrics {
  totalValue: number;
  totalCost: number;
  winRate: number;
  avgWinPercent: number;
  avgLossPercent: number;
  bestPerformer: Position | null;
  worstPerformer: Position | null;
  avgHoldingPeriodWinners: number;
  maxDrawdown: number;
  portfolioBeta: number;
  sharpeRatio: number;
  cashBalance: number;
  buyingPower: number;
  sectorMetrics: any[];  // or proper type if available
  industryMetrics: any[];  // or proper type if available
}

export interface PortfolioTotals {
  realizedProfits: number;
  unrealizedProfits: number;
  totalInvestment: number;
  currentValue: number;
  totalReturn: number;
}

export interface StockData {
  currentPrice: number;
  change: number;
  changePercent: number;
  volume: number;
  dayHigh: number;
  dayLow: number;
  peRatio?: number;
  forwardPE?: number;
  industryPE?: number;
}

export interface MarketData {
  [ticker: string]: {
    currentPrice: number;
    change: number;
    changePercent: number;
    volume: number;
    dayHigh: number;
    dayLow: number;
    peRatio?: number;
    forwardPE?: number;
    industryPE?: number;
    spyReturn?: number;
    sector?: string;
    industry?: string;
    beta?: number;
  };
}

// Component Props interfaces
export interface TransactionTableProps {
  transactions: Transaction[];
  onTransactionAdd: (transaction: Transaction) => void;
  onTransactionEdit: (transaction: Transaction) => void;
  onTransactionDelete: (id: number) => void;
  onTransactionsDeleteAll: () => void;
}

export interface OpenPositionsTableProps {
  positions: Position[];
}

export interface ClosedPositionsTableProps {
  positions: ClosedPosition[];
  spyData?: Record<string, number>;
}

export interface TransactionFormProps {
  formState: TransactionFormState;
  selectedDate: Date;
  onSubmit: (e: React.FormEvent) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (value: string) => void;
  onDateSelect: (date: Date | undefined) => void;
  onCancel: () => void;
  submitText: string;
  initialData?: Transaction;
}

export interface PortfolioSummaryProps {
  metrics: PortfolioMetrics;
  totals: PortfolioTotals;
  openPositions: Position[];
  closedPositions: ClosedPosition[];
}

// Chart-related interfaces
export interface ChartDataPoint {
  date: string;
  [key: string]: number | string | null;
}

export interface ChartPoint {
  date: string;
  [key: string]: number | string;
}

export interface TickerData {
  ticker: string;
  data: {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];
}

export interface PositionTimelineChartProps {
  transactions: Transaction[];  // Add this line
  openPositions: Position[];
  closedPositions: ClosedPosition[];
}

export interface ChartControlsProps {
  allTickers: string[];
  selectedTickers: string[];
  showPercentage: boolean;
  timeRange: '1M' | '3M' | '6M' | '1Y' | '2Y' | '5Y' | 'YTD' | 'Custom';
  onTickerSelect: (ticker: string) => void;
  onShowPercentageChange: (checked: boolean) => void;
  onTimeRangeChange: (value: string) => void;
}

// Tooltip-related interfaces
interface TooltipPayloadItem {
  value: number;
  name: string;
  dataKey: string;
  color?: string;
  fill?: string;
  payload?: ChartPoint;
}

interface PositionDataValue {
  shares: number;
  price?: number;
  value?: number;
  percentChange?: number;
  ticker?: string;
  type?: string;
}

export interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  positionData: Record<string, PositionDataValue>;
  showPercentage: boolean;
  getTickerColor: (ticker: string) => string;
}

export interface ChartPosition {
  price: number;
  shares: number;
  date: string;
  holdingPeriod: number;
}

export interface FinancialStatement {
  [metric: string]: number | null;
}

export interface StatementCollection {
  [date: string]: FinancialStatement;
}

export interface FinancialStatements {
  income_statement: StatementCollection;
  balance_sheet: StatementCollection;
  cash_flow: StatementCollection;
}

export interface CompanyInfo {
  name: string;
  sector: string | null;
  industry: string | null;
  employees: number | null;
  exchange: string | null;
  description: string | null;
  website: string | null;
  country: string | null;
}

export interface FinancialData {
  company_info: CompanyInfo;
  financial_statements: {
    quarterly: FinancialStatements;
    annual: FinancialStatements;
  };
  metrics: {
    [category: string]: {
      [metric: string]: number | null;
    };
  };
}