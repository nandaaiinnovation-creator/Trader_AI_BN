import { Server as IOServer } from 'socket.io';
import { persistSignal } from './signalPersist';

export interface OrchestratorPayload {
  symbol: string;
  timeframe: string;
  signal: 'BUY' | 'SELL' | null;
  score: number;
  firedRules: Array<Record<string, unknown>>;
  timestamp: number;
}

export class SignalOrchestrator {
  io?: IOServer;

  constructor(io?: IOServer) {
    this.io = io;
  }

  async persist(payload: OrchestratorPayload): Promise<unknown> {
    // delegate to the centralized persist helper which honors ENABLE_PERSIST
    // and is best-effort (doesn't throw to callers on DB errors)
    try {
      // create the entity object in the same shape the migration expects
      const entity = {
        symbol: payload.symbol,
        timeframe: payload.timeframe,
        signal: payload.signal,
        score: payload.score,
        fired_rules: JSON.stringify(payload.firedRules || []),
        ts: new Date(payload.timestamp),
      } as any;
      // persistSignal will return the saved entity when available
      const saved = await persistSignal(entity);
      return saved;
    } catch (err) {
      // ensure we never throw from persist()
      // eslint-disable-next-line no-console
      console.warn('SignalOrchestrator.persist: unexpected error', err);
      return undefined;
    }
  }

  emit(payload: OrchestratorPayload): void {
    if (!this.io) return;
    try {
      this.io.emit('signal', {
        symbol: payload.symbol,
        timeframe: payload.timeframe,
        signal: payload.signal,
        score: payload.score,
        firedRules: payload.firedRules,
        timestamp: payload.timestamp,
      });
    } catch (err) {
      // non-fatal emit error
      console.warn('SignalOrchestrator: failed to emit', err);
    }
  }

  async handle(payload: OrchestratorPayload) {
    // persist first (best-effort) then emit
    try {
      await this.persist(payload);
    } catch (err) {
      console.warn('SignalOrchestrator: persist failed', err);
    }
    this.emit(payload);
  }
}

export default SignalOrchestrator;
