export interface MarketState {
  atr: number;
  regime: 'TRENDING' | 'RANGE' | 'MEAN_REVERT';
  sgxNifty?: {
    price: number;
    change: number;
    volume: number;
  };
  globalMarkets?: {
    sentiment: number;  // -1 to 1 scale
    asiaStatus: 'bullish' | 'bearish' | 'neutral';
    usStatus: 'bullish' | 'bearish' | 'neutral';
  };
  sectoralData?: {
    bankingIndex: {
      price: number;
      change: number;
      volume: number;
    };
    psuBanks: {
      change: number;
      leaders: string[];
      history?: number[];
    };
    privateBanks: {
      change: number;
      leaders: string[];
      history?: number[];
    };
  };
  preMarketVolume?: {
    value: number;
    ratio: number;  // Compared to 10-day average
    distribution: 'normal' | 'heavy_call' | 'heavy_put';
  };
  optionChain?: {
    value: number;  // Strike price
    callOI: number;
    putOI: number;
    callVolume: number;
    putVolume: number;
    callOIChange: number;
    putOIChange: number;
    impliedVolatility: number;
    callGreeks?: { delta: number; gamma: number; vega: number; theta: number; };
    putGreeks?: { delta: number; gamma: number; vega: number; theta: number; };
  }[];

  // Optional additional market data used by advanced rules
  nifty?: {
    candles: any[];
  };

  dailyHistory?: {
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    timestamp: string;
  }[];

  // Orderflow / depth data
  orderflow?: {
    cumulativeDelta?: number[];
    ticks?: any[];
  };

  cumulativeDelta?: number[];
  vwap?: number;
  tickSize?: number;
}
