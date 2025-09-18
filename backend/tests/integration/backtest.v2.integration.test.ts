import http from 'http';
import express from 'express';
import backtestRouter from '../../src/api/backtest';

describe('POST /api/backtest/run (v2)', () => {
  function startApp() {
    const app = express();
    app.use(express.json());
    app.use('/api/backtest', backtestRouter);
    const server = app.listen(0);
    const port = (server.address() as any).port as number;
    return { server, port };
  }

  it('returns deterministic result with metrics, equity curve, and trades when enabled', (done) => {
    process.env.BACKTEST_V2_ENABLED = 'true';
    const { server, port } = startApp();

    const payload = {
      timeframe: '5m',
      toggles: { global: true, groups: { 'Price Action': true, Momentum: true, Trend: true, Volatility: true, Sentiment: true } },
    };

    const req = http.request(
      { port, path: '/api/backtest/run', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            expect(res.statusCode).toBe(200);
            const json = JSON.parse(body);
            expect(json).toHaveProperty('data');
            const data = json.data;
            expect(data).toHaveProperty('overall');
            expect(data).toHaveProperty('equity_curve');
            expect(data).toHaveProperty('trades');
            expect(data).toHaveProperty('groups');
            expect(data).toHaveProperty('meta');
            expect(data.meta).toHaveProperty('timeframe', '5m');

            // overall metrics sanity
            expect(typeof data.overall.pnl).toBe('number');
            expect(typeof data.overall.win_rate).toBe('number');
            expect(typeof data.overall.profit_factor).toBe('number');
            expect(typeof data.overall.expectancy).toBe('number');
            expect(typeof data.overall.sharpe).toBe('number');
            expect(typeof data.overall.max_drawdown).toBe('number');

            // equity_curve and trades lengths align with meta.count
            expect(Array.isArray(data.trades)).toBe(true);
            expect(Array.isArray(data.equity_curve)).toBe(true);
            expect(typeof data.meta.count).toBe('number');
            expect(data.trades.length).toBe(data.meta.count);
            expect(data.equity_curve.length).toBe(data.meta.count);

            server.close();
            done();
          } catch (e) {
            server.close();
            done(e);
          }
        });
      }
    );
    req.on('error', (err) => {
      server.close();
      done(err);
    });
    req.write(JSON.stringify(payload));
    req.end();
  });

  it('respects group toggles and can produce zero trades when all groups disabled', (done) => {
    process.env.BACKTEST_V2_ENABLED = 'true';
    const { server, port } = startApp();

    const payload = {
      timeframe: '5m',
      toggles: { global: true, groups: { 'Price Action': false, Momentum: false, Trend: false, Volatility: false, Sentiment: false } },
    };

    const req = http.request(
      { port, path: '/api/backtest/run', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            expect(res.statusCode).toBe(200);
            const json = JSON.parse(body);
            expect(json).toHaveProperty('data');
            const data = json.data;
            expect(data.meta.count).toBe(0);
            expect(data.trades.length).toBe(0);
            expect(data.equity_curve.length).toBe(0);
            expect(data.overall.pnl).toBe(0);
            server.close();
            done();
          } catch (e) {
            server.close();
            done(e);
          }
        });
      }
    );
    req.on('error', (err) => {
      server.close();
      done(err);
    });
    req.write(JSON.stringify(payload));
    req.end();
  });
});
