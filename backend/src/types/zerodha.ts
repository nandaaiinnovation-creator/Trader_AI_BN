export interface KiteTick {
  mode: 'full' | 'quote' | 'ltp';
  instrumentToken: number;
  symbol: string;
  lastPrice: number;
  lastQuantity?: number;
  averagePrice?: number;
  volume?: number;
  buyQuantity?: number;
  sellQuantity?: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  change?: number;
  oi?: number;
  oiHigh?: number;
  oiLow?: number;
  timestamp?: Date;
  depth?: {
    buy: Array<{ price: number; quantity: number; orders: number }>;
    sell: Array<{ price: number; quantity: number; orders: number }>;
  };
}
