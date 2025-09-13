/**
 * Minimal orchestrator service stub.
 * The real orchestrator will be implemented later. This stub provides a
 * `setupOrchestrator` entrypoint which the bootstrap can call when
 * `ENABLE_ORCHESTRATOR=1`.
 */
import { EventEmitter } from 'events';
import { Server as IOServer } from 'socket.io';

export type Orchestrator = {
  persist: (payload: any) => Promise<unknown>;
  emit: (payload: any) => void;
  handle: (payload: any) => Promise<void>;
  on: (event: string, cb: (...args: any[]) => void) => void;
};

/**
 * Create a minimal orchestrator instance that mirrors the public API of
 * `SignalOrchestrator` in this repo. Accepts an optional `io` to emit
 * socket events in tests or in-process usage.
 */
export function setupOrchestrator(io?: IOServer): Orchestrator {
  const emitter = new EventEmitter();

  async function persist(_payload: any) {
    // noop persistence for the stub. Tests may mock TypeORM to assert calls.
    return Promise.resolve(undefined);
  }

  function emit(payload: any) {
    try {
      if (io && typeof io.emit === 'function') {
        io.emit('signal', payload);
      }
    } catch (err) {
      // swallow non-fatal emit errors
      // eslint-disable-next-line no-console
      console.warn('Orchestrator stub: emit failed', err);
    }
    emitter.emit('signal', payload);
  }

  async function handle(payload: any) {
    try {
      await persist(payload);
    } catch (err) {
      // noop on persist failure for stub
      // eslint-disable-next-line no-console
      console.warn('Orchestrator stub: persist failed', err);
    }
    emit(payload);
  }

  return {
    persist,
    emit,
    handle,
    on: (event: string, cb: (...args: any[]) => void) => emitter.on(event, cb),
  };
}
