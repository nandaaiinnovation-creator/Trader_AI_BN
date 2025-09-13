import { getRepository } from 'typeorm';

export async function persistSignal(signal: any): Promise<void> {
  if (process.env.ENABLE_PERSIST !== 'true') return;
  try {
    const repo = getRepository('signals');
    // best-effort: save but don't throw to the caller
    await repo.save(signal);
  } catch (err) {
    // log but do not crash the orchestrator
    // eslint-disable-next-line no-console
    console.error('persistSignal error', err);
  }
}

export default persistSignal;
