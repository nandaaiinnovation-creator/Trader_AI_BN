/**
 * E2E-style integration test for SignalOrchestrator (JS version).
 * Starts the app bootstrap in-process (with critical external things mocked)
 * and verifies that when a signal is handled by the orchestrator it is
 * persisted (via TypeORM repo) and emitted on the Socket.IO server.
 */

// Keep test as JS-compatible so Jest/Babel can run it without TS transform
jest.useRealTimers();

// Mock TypeORM createConnection + getRepository and basic decorators/BaseEntity
jest.mock('typeorm', () => {
  const BaseEntity = class {};
  const noOpDecorator = () => () => {};
  return {
    createConnection: jest.fn(() => Promise.resolve()),
    getRepository: jest.fn(),
    BaseEntity,
    PrimaryColumn: noOpDecorator,
    PrimaryGeneratedColumn: noOpDecorator,
    Column: noOpDecorator,
    Entity: noOpDecorator,
  };
});

// Mock logger modules (both source and compiled paths) to avoid pino transport
// creating worker threads during tests.
jest.mock('../../src/utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../dist/utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

// Provide a lightweight fake Socket.IO Server implementation so start()
// can construct one without opening real sockets. We capture emits via
// an EventEmitter to allow assertions.
jest.mock('socket.io', () => {
  const EventEmitter = require('events');
  class FakeServer extends EventEmitter {
    constructor() {
      super();
    }
    emit(event, payload) {
      return EventEmitter.prototype.emit.call(this, event, payload);
    }
  }
  return { Server: FakeServer };
});

// Mock redis client (helpers.redisClient.connect/quit) and setupWebSocket to noop
// Also mock the compiled dist helpers/socket modules so requiring dist/index
// picks up our mocks instead of trying to load real Redis/WS code.
jest.mock('../../src/utils/helpers', () => ({
  redisClient: { connect: jest.fn(() => Promise.resolve()), quit: jest.fn() },
  gracefulShutdown: jest.fn(),
}));
jest.mock('../../src/ws/socket', () => ({
  setupWebSocket: jest.fn(),
}));
jest.mock('../../dist/utils/helpers', () => ({
  redisClient: { connect: jest.fn(() => Promise.resolve()), quit: jest.fn() },
  gracefulShutdown: jest.fn(),
}));
jest.mock('../../dist/ws/socket', () => ({
  setupWebSocket: jest.fn(),
}));

// Mock logger modules (src + dist) to avoid pino transport worker threads
jest.mock('../../src/utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }
}));
jest.mock('../../dist/utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }
}));

// Mock pino itself to avoid worker transports or threads being created by
// direct pino usage in some modules during tests.
jest.mock('pino', () => {
  return () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() });
});

// Mock http.createServer so server.listen won't bind to a real port during tests
jest.mock('http', () => {
  const real = jest.requireActual('http');
  return {
    ...real,
    createServer: (app) => {
      const server = real.createServer(app);
      // override listen so it doesn't bind sockets in tests
      server.listen = function (port, cb) {
        if (typeof port === 'function') { cb = port; }
        if (typeof cb === 'function') cb();
        // return a stub with close
        return { close: (cb2) => { if (typeof cb2 === 'function') cb2(); } };
      };
      return server;
    }
  };
});

// Prevent the process.exit in dist/index from killing the test process.
jest.spyOn(process, 'exit').mockImplementation(() => {});

const { getRepository } = require('typeorm');
// Prefer compiled dist files so Jest/Babel doesn't need to parse TS sources.
const { start } = require('../../dist/index');
const { setOrchestrator, getOrchestrator } = require('../../dist/services/orchestratorSingleton');

describe('E2E orchestrator (in-process bootstrap)', () => {
  const fakeCreate = jest.fn(x => x);
  const fakeSave = jest.fn(() => Promise.resolve());

  beforeAll(() => {
    // Ensure feature flag is enabled
    process.env.ENABLE_ORCHESTRATOR = '1';
  });

  beforeEach(() => {
    getRepository.mockReturnValue({ create: fakeCreate, save: fakeSave });
    fakeCreate.mockReset();
    fakeSave.mockReset();
    // Clear any singleton orchestrator and set later by start()
    try { setOrchestrator(undefined); } catch (e) { /* ignore */ }
  });

  afterEach(() => {
    delete process.env.ENABLE_ORCHESTRATOR;
  });

  // Ensure any resources created during start() are closed to avoid Jest
  // open-handle warnings. This includes restoring process.exit spy,
  // closing/removing listeners from the orchestrator IO, and quitting the
  // (mocked) redis client.
  afterAll(async () => {
    // Restore process.exit spy if present
    try {
      if (process.exit && process.exit.mockRestore) process.exit.mockRestore();
    } catch (e) { /* ignore */ }

    // Close orchestrator IO if it exists
    try {
      const orch = getOrchestrator && getOrchestrator();
      if (orch) {
        // If emit/spies or an EventEmitter instance exists, remove listeners
        try {
          if (orch.io && typeof orch.io.removeAllListeners === 'function') {
            orch.io.removeAllListeners();
          }
          if (orch.io && typeof orch.io.close === 'function') {
            orch.io.close();
          }
        } catch (e) { /* ignore */ }

        // Some orchestrator implementations expose getIO()
        try {
          if (typeof orch.getIO === 'function') {
            const io = orch.getIO();
            if (io && typeof io.removeAllListeners === 'function') io.removeAllListeners();
            if (io && typeof io.close === 'function') io.close();
          }
        } catch (e) { /* ignore */ }
      }
    } catch (e) { /* ignore */ }

    // Ensure mocked redis client is quit to avoid lingering handles
    try {
      // Prefer dist helpers since test requires from dist
      // eslint-disable-next-line global-require
      const helpers = require('../../dist/utils/helpers');
      if (helpers && helpers.redisClient && typeof helpers.redisClient.quit === 'function') {
        // may be sync or return a promise
        await helpers.redisClient.quit();
      }
      // Also attempt src helpers as a fallback
      // eslint-disable-next-line global-require
      const srcHelpers = require('../../src/utils/helpers');
      if (srcHelpers && srcHelpers.redisClient && typeof srcHelpers.redisClient.quit === 'function') {
        await srcHelpers.redisClient.quit();
      }
    } catch (e) { /* ignore */ }
  });

  it('boots the app, wires orchestrator, and persists+emits a signal', async () => {
    // Start the app in-process (external services are mocked)
    await start();

    // After start, orchestrator singleton should be set
    const orch = getOrchestrator();
    expect(orch).toBeDefined();
    if (!orch) throw new Error('orchestrator not set');

    // Attach a listener to the fake IO server to observe emitted signals
    const events = [];
    const io = orch.io || (orch.getIO && orch.getIO());
    if (!io) {
      // fallback to spying on emit
      const emitSpy = jest.spyOn(orch, 'emit');
      const payload = { symbol: 'BANKNIFTY', timeframe: '1m', signal: 'BUY', score: 0.9, firedRules: [{ name: 't' }], timestamp: Date.now() };
      await orch.handle(payload);
      expect(fakeCreate).toHaveBeenCalled();
      expect(fakeSave).toHaveBeenCalled();
      expect(emitSpy).toHaveBeenCalled();
      emitSpy.mockRestore();
      return;
    }

    io.on('signal', p => events.push(p));

    // Trigger a signal via orchestrator.handle
    const payload = { symbol: 'BANKNIFTY', timeframe: '1m', signal: 'BUY', score: 0.9, firedRules: [{ name: 't' }], timestamp: Date.now() };
    await orch.handle(payload);

    // Assert DB persist attempted
    expect(fakeCreate).toHaveBeenCalledWith(expect.objectContaining({ symbol: 'BANKNIFTY' }));
    expect(fakeSave).toHaveBeenCalled();

    // Assert IO emitted the signal
    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events[0]).toEqual(expect.objectContaining({ symbol: 'BANKNIFTY' }));
  }, 20000);
});
