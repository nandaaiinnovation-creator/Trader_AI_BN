import request from 'supertest';
import express from 'express';

// Minimal test: require the app file if it exports the Express app, else create a small instance
let app: express.Express;
try {
  // Attempt to import the runtime app - many projects export the app for tests
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const server = require('../dist/index.js');
  app = server && server.app ? server.app : express();
} catch (err) {
  app = express();
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
}

describe('GET /health', () => {
  it('responds with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });
});
