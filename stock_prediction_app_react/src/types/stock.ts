export interface StockQuote {
  symbol: string;
  companyName: string;
  latestPrice: number;
  change: number;
  changePercent: number;
  latestTime: string;
}

export interface StockChartData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
} 