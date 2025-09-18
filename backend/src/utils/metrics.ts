import client from 'prom-client';

// Default metrics and registry
export const register = new client.Registry();
client.collectDefaultMetrics({ register });

export const backtestRuns = new client.Counter({
  name: 'backtest_runs_total',
  help: 'Total number of backtest v2 runs',
  labelNames: ['timeframe', 'sentiment'] as const,
});
register.registerMetric(backtestRuns);

export const backtestDuration = new client.Histogram({
  name: 'backtest_duration_seconds',
  help: 'Duration of backtest v2 runs in seconds',
  labelNames: ['timeframe', 'sentiment'] as const,
  buckets: [0.05, 0.1, 0.2, 0.5, 1, 2, 5],
});
register.registerMetric(backtestDuration);

export const sentimentGauge = new client.Gauge({
  name: 'sentiment_score',
  help: 'Latest sentiment score reported by API',
  labelNames: ['symbol', 'timeframe'] as const,
});
register.registerMetric(sentimentGauge);

export default register;
