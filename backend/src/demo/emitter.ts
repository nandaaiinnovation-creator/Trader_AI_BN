import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

export interface DemoEmitterOptions {
  symbol?: string;
  intervalMs?: number;
}

export class DemoEmitter extends EventEmitter {
  private timer: NodeJS.Timeout | null = null;
  private price = 45000;
  private seq = 0;
  private readonly symbol: string;
  private readonly interval: number;

  constructor(opts?: DemoEmitterOptions) {
    super();
    this.symbol = opts?.symbol || 'BANKNIFTY';
    this.interval = opts?.intervalMs || 1000;
  }

  start() {
    if (this.timer) return;
    logger.info('DemoEmitter: starting synthetic tick stream');
    this.timer = setInterval(() => {
      this.seq += 1;
      const jitter = (Math.random() - 0.5) * 10;
      this.price = Math.max(100, this.price + jitter);
      const now = Date.now();
      const tick = {
        symbol: this.symbol,
        ltp: Number(this.price.toFixed(2)),
        ts: now,
        seq: this.seq,
      };
      this.emit('tick', tick);
      // Occasionally emit a demo signal
      if (this.seq % 5 === 0) {
        const signal = {
          id: `${this.symbol}-${now}`,
          symbol: this.symbol,
          side: (this.seq % 10 === 0) ? 'SELL' : 'BUY',
          score: Math.round(Math.random() * 100) / 100,
          createdAt: new Date(now).toISOString(),
        };
        this.emit('signal', signal);
      }
    }, this.interval);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      logger.info('DemoEmitter: stopped');
    }
  }
}

export const demoEmitter = new DemoEmitter();
