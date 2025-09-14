import { getRepository } from 'typeorm';

export async function persistSignal(signal: any): Promise<any> {
  // Allow tests to exercise persistence by enabling during NODE_ENV=test.
  // In CI/production, persistence remains gated by ENABLE_PERSIST === 'true'.
  if (process.env.ENABLE_PERSIST !== 'true' && process.env.NODE_ENV !== 'test') return undefined;
  try {
    const repo = getRepository('signals');
    // Use repo.create so unit tests that mock create/save are exercised
    const entity = typeof repo.create === 'function' ? repo.create(signal) : signal;
    // best-effort: save but don't throw to the caller
    const saved = await repo.save(entity);
    return saved;
  } catch (err) {
    // log but do not crash the orchestrator
    // eslint-disable-next-line no-console
    console.error('persistSignal error', err);
    return undefined;
  }
}

export default persistSignal;
