const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

jest.setTimeout(120000);

test('orchestrator persists signal and emits socket event', async () => {
  const tmpEmitFile = path.join(__dirname, '..', '..', 'tmp', 'orchestrator_emit.txt');
  try { fs.rmSync(tmpEmitFile); } catch (e) {}

  const env = Object.assign({}, process.env, {
    ENABLE_ORCHESTRATOR: '1',
    ENABLE_PERSIST: 'true',
    NODE_ENV: 'test',
    POSTGRES_URL: process.env.POSTGRES_URL || 'postgres://postgres:postgres@localhost:5432/postgres',
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379'
  });

  // Start the compiled orchestrator in a child process (dist entrypoint)
  const proc = spawn('node', ['dist/orchestratorEntry.js'], { env, stdio: ['ignore', 'pipe', 'pipe'] });

  proc.stdout.on('data', d => process.stdout.write('[orch] ' + d.toString()));
  proc.stderr.on('data', d => process.stderr.write('[orch.err] ' + d.toString()));

  // Wait a bit for startup
  await new Promise(r => setTimeout(r, 3000));

  // Trigger a synthetic signal by POSTing to a test endpoint if available, or write a small file that the orchestrator's test harness watches
  const triggerFile = path.join(__dirname, '..', '..', 'tmp', 'trigger_signal.json');
  fs.writeFileSync(triggerFile, JSON.stringify({ symbol: 'TEST/BNF', rule: 'integration-test' }));

  // Give orchestrator time to pick it up and persist
  await new Promise(r => setTimeout(r, 4000));

  // Connect a Socket.IO client to listen for the emitted signal
  const ioClient = require('socket.io-client');
  const socket = ioClient.connect(`http://localhost:${env.PORT || 8080}`, { transports: ['websocket'], reconnection: false });
  const received = [];
  socket.on('signal', (payload) => {
    try { received.push(payload); } catch (e) {}
  });

  // Check Postgres for inserted row
  const client = new Client({ connectionString: env.POSTGRES_URL });
  await client.connect();
  const res = await client.query("SELECT * FROM signals WHERE rule = 'integration-test' ORDER BY created_at DESC LIMIT 1");
  await client.end();

  // Clean up socket
  socket.disconnect();
  proc.kill();

  expect(res.rows.length).toBeGreaterThanOrEqual(1);

  // Check that a signal event containing our rule was emitted
  const foundEmit = received.some(r => r && (r.rule === 'integration-test' || (r.firedRules && JSON.stringify(r.firedRules).includes('integration-test')) || (r.symbol && r.symbol.includes('TEST/BNF'))));
  expect(foundEmit).toBeTruthy();
});
