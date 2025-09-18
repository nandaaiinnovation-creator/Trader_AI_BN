import { redisClient } from '../utils/helpers';
import { logger } from '../utils/logger';

export interface SentimentProvider {
  getScore(symbol: string, timeframe: string): Promise<number>; // -1..1
}

// Deterministic stub provider for CI/demo
export class StubSentimentProvider implements SentimentProvider {
  async getScore(symbol: string, timeframe: string): Promise<number> {
    const base = Math.abs(hash(`${symbol}:${timeframe}`) % 200) / 100 - 1; // range -1..1
    return roundTo(base * 0.6, 2); // tame amplitude
  }
}

function roundTo(n: number, d = 2) { const p = Math.pow(10, d); return Math.round(n * p) / p; }
function hash(s: string) { let h = 0; for (let i=0;i<s.length;i++){ h = (h<<5)-h + s.charCodeAt(i); h|=0; } return Math.abs(h); }

export class SentimentService {
  private provider: SentimentProvider;
  private inMemoryCache = new Map<string, { v: number; exp: number }>();
  private rateBucket = new Map<string, { ts: number; count: number }>();

  constructor(provider?: SentimentProvider) {
    this.provider = provider || new StubSentimentProvider();
  }

  isEnabled() { return process.env.SENTIMENT_ENABLED === 'true'; }

  private cacheKey(symbol: string, timeframe: string) { return `sent:${symbol}:${timeframe}`; }

  private async cacheGet(key: string): Promise<number | undefined> {
    try {
      if (redisClient.isOpen) {
        const v = await redisClient.get(key);
        if (v != null) return Number(v);
      }
    } catch (_) {}
    const m = this.inMemoryCache.get(key);
    if (m && m.exp > Date.now()) return m.v;
    return undefined;
  }

  private async cacheSet(key: string, val: number, ttlSec = 60) {
    try {
      if (redisClient.isOpen) {
        await redisClient.setEx(key, ttlSec, String(val));
      }
    } catch (_) {}
    this.inMemoryCache.set(key, { v: val, exp: Date.now() + ttlSec * 1000 });
  }

  private rateLimitKey(symbol: string) { return `rl:${symbol}`; }
  private checkRateLimit(symbol: string, limitPerMin = 60): boolean {
    const k = this.rateLimitKey(symbol);
    const now = Date.now();
    const bucket = this.rateBucket.get(k) || { ts: now, count: 0 };
    if (now - bucket.ts > 60_000) { bucket.ts = now; bucket.count = 0; }
    bucket.count += 1;
    this.rateBucket.set(k, bucket);
    return bucket.count <= limitPerMin;
  }

  async getScore(symbol: string, timeframe: string): Promise<number> {
    if (!this.isEnabled()) throw new Error('sentiment_disabled');
    const key = this.cacheKey(symbol, timeframe);
    const cached = await this.cacheGet(key);
    if (cached !== undefined) return cached;
    if (!this.checkRateLimit(symbol)) {
      logger.warn({ message: 'Sentiment rate limit exceeded', symbol });
      return 0;
    }
    const v = await this.provider.getScore(symbol, timeframe);
    await this.cacheSet(key, v, 60);
    return v;
  }
}

export const sentimentService = new SentimentService();
