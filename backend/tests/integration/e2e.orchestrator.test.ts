/**
 * E2E-style integration test for SignalOrchestrator.
 * Starts the app bootstrap in-process (with critical external things mocked)
 * and verifies that when a signal is handled by the orchestrator it is
 * persisted (via TypeORM repo) and emitted on the Socket.IO server.
 */

/// <reference types="jest" />

jest.useRealTimers();

// Prevent pino transport from starting threads during tests by mocking pino
jest.mock('pino', () => {
  return function noopPino() {
    return {
      info: () => {},
      error: () => {},
      warn: () => {},
      debug: () => {},
    };
  };
});

// Make a small TypeORM mock so compiled entities that extend BaseEntity
// won't fail when tests load 'dist' modules. We'll let createConnection
// and getRepository be mocked later as needed.
jest.mock('typeorm', () => ({
  BaseEntity: class {},
  createConnection: jest.fn(() => Promise.resolve()),
  getRepository: jest.fn(),
}));

/**
 * E2E-style integration test for SignalOrchestrator.
 * Starts the app bootstrap in-process (with critical external things mocked)
 * and verifies that when a signal is handled by the orchestrator it is
 * persisted (via TypeORM repo) and emitted on the Socket.IO server.
 */

// Keep test as JS-compatible (avoid TS-only syntax) so Jest's parser can run it
jest.useRealTimers();

// Mock TypeORM createConnection + getRepository
jest.mock('typeorm', () => ({
  createConnection: jest.fn(() => Promise.resolve()),
  getRepository: jest.fn(),
}));

// Provide a lightweight fake Socket.IO Server implementation so start()
// can construct one without opening real sockets. We capture emits via
// an EventEmitter to allow assertions.
jest.mock('socket.io', () => {
  const EventEmitter = require('events');
  class FakeServer extends EventEmitter {
      // Use require() after mocks so mocked modules are used by the app when required
      const { getRepository } = require('typeorm');
      const { start } = require('../../src/index');
      const { setOrchestrator, getOrchestrator } = require('../../src/services/orchestratorSingleton');
      const SignalOrchestrator = require('../../src/services/signalOrchestrator').default || require('../../src/services/signalOrchestrator');
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
jest.mock('../../src/utils/helpers', () => ({
  redisClient: { connect: jest.fn(() => Promise.resolve()), quit: jest.fn() },
  gracefulShutdown: jest.fn(),
}));

jest.mock('../../src/ws/socket', () => ({
  setupWebSocket: jest.fn(),
}));

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
