import { getRepository } from 'typeorm';
import { Server as IOServer } from 'socket.io';

export interface OrchestratorPayload {
  symbol: string;
  timeframe: string;
  signal: 'BUY' | 'SELL' | null;
  score: number;
  firedRules: any[];
  timestamp: number;
}

export class SignalOrchestrator {
  io?: IOServer;

  constructor(io?: IOServer) {
    this.io = io;
  }

  async persist(payload: OrchestratorPayload) {
  // Use entity name to avoid importing entity classes at module load time
  const repo = getRepository('signals');
    const s = repo.create({
      symbol: payload.symbol,
      timeframe: payload.timeframe,
      signal: payload.signal,
      score: payload.score,
      fired_rules: JSON.stringify(payload.firedRules || []),
      ts: new Date(payload.timestamp),
    } as any);
    return repo.save(s);
  }

  emit(payload: OrchestratorPayload) {
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
