// Centralized teardown helper for integration tests.
// Ensures mocked/real resources are closed to avoid Jest open-handle warnings.
module.exports = async function cleanup() {
  // Restore process.exit if it was spied on
  try {
    if (process.exit && process.exit.mockRestore) process.exit.mockRestore();
  } catch (e) { /* ignore */ }

  // Attempt to close orchestrator IO if present
  try {
    // Prefer compiled dist helpers/singleton
    // eslint-disable-next-line global-require
    const { getOrchestrator } = require('../../dist/services/orchestratorSingleton');
    const orch = getOrchestrator && getOrchestrator();
    if (orch) {
      try {
        if (orch.io && typeof orch.io.removeAllListeners === 'function') orch.io.removeAllListeners();
        if (orch.io && typeof orch.io.close === 'function') orch.io.close();
      } catch (e) { /* ignore */ }
      try {
        if (typeof orch.getIO === 'function') {
          const io = orch.getIO();
          if (io && typeof io.removeAllListeners === 'function') io.removeAllListeners();
          if (io && typeof io.close === 'function') io.close();
        }
      } catch (e) { /* ignore */ }
    }
  } catch (e) { /* ignore */ }

  // Quit redis clients in dist and src helpers (if present)
  try {
    // eslint-disable-next-line global-require
    const distHelpers = require('../../dist/utils/helpers');
    if (distHelpers && distHelpers.redisClient && typeof distHelpers.redisClient.quit === 'function') {
      await distHelpers.redisClient.quit();
    }
  } catch (e) { /* ignore */ }

  try {
    // eslint-disable-next-line global-require
    const srcHelpers = require('../../src/utils/helpers');
    if (srcHelpers && srcHelpers.redisClient && typeof srcHelpers.redisClient.quit === 'function') {
      await srcHelpers.redisClient.quit();
    }
  } catch (e) { /* ignore */ }
};
