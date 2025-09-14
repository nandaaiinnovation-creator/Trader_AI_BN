// Minimal unit tests for RulesEngine initialization paths.
// Keep tests lightweight: only assert that the exported `start` function exists and that
// importing the module doesn't throw. We avoid calling `start()` here because it
// performs DB/Redis connections and starts the HTTP server.

describe('RulesEngine initialization', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules(); // clear module cache
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  test('module exposes start function when ENABLE_RULES_ENGINE not set', async () => {
    delete process.env.ENABLE_RULES_ENGINE;
    const index = await import('../../backend/src/index');
    expect(typeof index.start).toBe('function');
  });

  test('module exposes start function when ENABLE_RULES_ENGINE=true', async () => {
    process.env.ENABLE_RULES_ENGINE = 'true';
    const index = await import('../../backend/src/index');
    expect(typeof index.start).toBe('function');
  });
});
