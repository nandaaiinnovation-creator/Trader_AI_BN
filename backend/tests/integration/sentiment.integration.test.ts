import http from 'http';
import express from 'express';
import sentimentRouter from '../../src/api/sentiment';
import backtestRouter from '../../src/api/backtest';

describe('Sentiment integration', () => {
  function startApp() {
    const app = express();
    app.use(express.json());
    app.use('/api/sentiment', sentimentRouter);
    app.use('/api/backtest', backtestRouter);
    const server = app.listen(0);
    const port = (server.address() as any).port as number;
    return { server, port };
  }

  beforeAll(()=>{
    process.env.SENTIMENT_ENABLED = 'true';
    process.env.BACKTEST_V2_ENABLED = 'true';
  })

  it('GET /api/sentiment/score returns a bounded score', (done) => {
    const { server, port } = startApp();
    http.get({ port, path: '/api/sentiment/score?symbol=BANKNIFTY&timeframe=5m' }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try {
          expect(res.statusCode).toBe(200);
          const json = JSON.parse(body);
          const s = json?.data?.score;
          expect(typeof s).toBe('number');
          expect(s).toBeGreaterThanOrEqual(-1);
          expect(s).toBeLessThanOrEqual(1);
          server.close();
          done();
        } catch (e) { server.close(); done(e); }
      });
    }).on('error', (err) => { server.close(); done(err); });
  });

  it('POST /api/backtest/run applies sentiment influence when enabled', (done) => {
    const { server, port } = startApp();
    const payload = { timeframe: '5m', toggles: { global: true, groups: { 'Price Action': true, Momentum: true, Trend: true, Volatility: true, Sentiment: true } }, sentimentInfluence: true };
    const req = http.request({ port, path: '/api/backtest/run', method: 'POST', headers: { 'Content-Type': 'application/json' } }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try {
          expect(res.statusCode).toBe(200);
          const json = JSON.parse(body);
          expect(json?.data?.sentiment_meta).toBeDefined();
          const meta = json.data.sentiment_meta;
          expect(typeof meta.score).toBe('number');
          expect(typeof meta.alpha).toBe('number');
          expect(typeof meta.factor).toBe('number');
          // ensure equity curve aligns with trades after influence
          expect(json.data.trades.length).toBe(json.data.equity_curve.length);
          server.close();
          done();
        } catch (e) { server.close(); done(e); }
      });
    });
    req.on('error', (err) => { server.close(); done(err); });
    req.write(JSON.stringify(payload));
    req.end();
  });
});
