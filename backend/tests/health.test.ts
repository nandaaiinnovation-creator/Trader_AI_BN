import http from 'http';
import express from 'express';

describe('GET /health', () => {
  it('responds with status ok', (done) => {
    const app = express();
    app.get('/health', (_req, res) => res.json({ status: 'ok' }));
    const server = app.listen(0, () => {
      const port = (server.address() as any).port;
      http.get({ port, path: '/health' }, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          expect(res.statusCode).toBe(200);
          const json = JSON.parse(body);
          expect(json).toHaveProperty('status', 'ok');
          server.close();
          done();
        });
      }).on('error', (err) => {
        server.close();
        done(err);
      });
    });
  });
});
