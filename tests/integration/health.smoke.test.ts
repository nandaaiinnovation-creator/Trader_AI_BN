import http from 'http';
import axios from 'axios';

// Very small smoke test that performs an HTTP GET /health against the running app.
// In CI the infra-validation workflow starts the backend and waits for tcp:8080; this test
// helps ensure that the HTTP endpoint returns 200 at the app level.

describe('Smoke: /health', () => {
  jest.setTimeout(30_000);

  test('GET /health returns 200', async () => {
    const res = await axios.get('http://localhost:8080/health', { timeout: 5000 });
    expect(res.status).toBe(200);
    // Optionally assert a JSON body exists
    expect(res.data).toBeDefined();
  });
});
