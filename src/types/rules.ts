export interface RuleResult {
  pass: boolean;
  score: number;  // 0 to 1
  reason: string;
  errorType?: 'CONFIG_MISSING' | 'DATA_MISSING' | 'RULE_ERROR';
}

import { MarketState } from './market';

export interface RuleContext {
  symbol: string;
  timeframe: string;
  candles: CandleData[];
  tick?: TickData;
  regime: TradingRegime;
  marketState: MarketState;
}

export interface RuleConfig {
  enabled: boolean;
  weight: number;
  params: Record<string, any>;
}

export interface CandleData {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap?: number;
  oi?: number;
}

export interface TickData {
  price: number;
  volume: number;
  buyQuantity: number;
  sellQuantity: number;
  oi?: number;
  timestamp: Date;
  depth?: {
    buy: DepthLevel[];
    sell: DepthLevel[];
  };
}

export interface DepthLevel {
  price: number;
  quantity: number;
  orders: number;
}

export enum TradingRegime {
  TRENDING = 'TRENDING',
  RANGE = 'RANGE',
  MEAN_REVERT = 'MEAN_REVERT'
}

// MarketState is imported from './market' which contains the richer structure used by rules
