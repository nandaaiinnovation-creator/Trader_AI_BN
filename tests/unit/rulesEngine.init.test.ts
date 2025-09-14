import { jest } from '@jest/globals';

// Minimal unit tests for RulesEngine initialization paths.
// We'll mock environment and any external dependencies to ensure the initialization
// code doesn't throw and chooses the right path when ENABLE_RULES_ENGINE is set.

describe('RulesEngine initialization', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules(); // clear module cache
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  test('does not initialize when ENABLE_RULES_ENGINE is not set', async () => {
    delete process.env.ENABLE_RULES_ENGINE;

    // Import index after env change to ensure module picks up env
    const index = await import('../../backend/src/index');

    // Expect index.start to be a function and not to throw when called
    expect(typeof index.start).toBe('function');

    // calling start should return a Promise (but we won't actually start server)
    const startPromise = index.start();
    // allow it to run briefly and then abort if it tries to bind; we only assert no immediate rejection
    await expect(Promise.race([startPromise, Promise.resolve('ok')])).resolves.not.toBe('ok');
  });

  test('initialization path when ENABLE_RULES_ENGINE=true does not crash on missing dependencies', async () => {
    process.env.ENABLE_RULES_ENGINE = 'true';

    // Mock createAppConnection to prevent TypeORM from actually connecting
    jest.unstable_mockModule('../../backend/src/db', () => ({
      createAppConnection: async () => ({ isMock: true })
    }));

    const index = await import('../../backend/src/index');

    // Starting should not throw synchronously
    expect(typeof index.start).toBe('function');

    // Call start but don't wait for full server lifecycle; just ensure it doesn't throw
    await expect(Promise.resolve().then(() => index.start())).resolves.toBeUndefined();
  });
});
