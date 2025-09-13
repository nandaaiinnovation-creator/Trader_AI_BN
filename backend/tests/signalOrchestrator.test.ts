jest.mock('typeorm', () => ({
  getRepository: jest.fn(),
}));

import SignalOrchestrator from '../src/services/signalOrchestrator';
import { getRepository } from 'typeorm';

describe('SignalOrchestrator', () => {
  const fakeRepoSave = jest.fn();
  const fakeRepoCreate = jest.fn((x) => x);

  beforeEach(() => {
    (getRepository as jest.Mock).mockReturnValue({
      create: fakeRepoCreate,
      save: fakeRepoSave,
    });
    fakeRepoSave.mockReset();
    fakeRepoCreate.mockReset();
  });

  it('persists a signal', async () => {
    fakeRepoSave.mockResolvedValue({ id: 1 });
    const orch = new SignalOrchestrator();
    const payload = {
      symbol: 'BANKNIFTY',
      timeframe: '3m',
      signal: 'BUY' as const,
      score: 0.8,
      firedRules: [{ name: 'macd' }],
      timestamp: Date.now(),
    };
    const res = await orch.persist(payload as any);
    expect(fakeRepoCreate).toHaveBeenCalled();
    expect(fakeRepoSave).toHaveBeenCalled();
    expect(res).toEqual({ id: 1 });
  });

  it('emits via socket.io when io provided', () => {
    const emit = jest.fn();
    const fakeIo: any = { emit };
    const orch = new SignalOrchestrator(fakeIo);
    const payload = {
      symbol: 'BANKNIFTY',
      timeframe: '5m',
      signal: 'SELL' as const,
      score: 0.3,
      firedRules: [],
      timestamp: Date.now(),
    };
    orch.emit(payload as any);
    expect(emit).toHaveBeenCalledWith('signal', expect.objectContaining({ symbol: 'BANKNIFTY' }));
  });
});
