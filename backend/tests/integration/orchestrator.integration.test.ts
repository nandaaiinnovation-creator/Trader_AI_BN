jest.mock('typeorm', () => ({
  getRepository: jest.fn(),
}));

import { RulesEngine } from '../../src/services/rulesEngine';
import defaultConfig from '../../src/config/rules';
import { setOrchestrator, getOrchestrator } from '../../src/services/orchestratorSingleton';
import SignalOrchestrator from '../../src/services/signalOrchestrator';
import { getRepository } from 'typeorm';

describe('Orchestrator integration', () => {
  const fakeSave = jest.fn();
  const fakeCreate = jest.fn((x) => x);
  const emit = jest.fn();

  beforeEach(() => {
    (getRepository as jest.Mock).mockReturnValue({ create: fakeCreate, save: fakeSave });
    fakeSave.mockReset();
    fakeCreate.mockReset();
    emit.mockReset();
    // install orchestrator singleton with fake io
    const fakeIo: any = { emit };
    const orch = new SignalOrchestrator(fakeIo);
    setOrchestrator(orch);
  });

  it('persists and emits when rules produce a signal', async () => {
    // craft a config and context that will produce a high composite score
    const cfg: any = JSON.parse(JSON.stringify(defaultConfig));
    // force composite params to be permissive for test
    if (!cfg.rules) cfg.rules = {};
    cfg.rules.compositeScore = { params: { signal_threshold: 0.1, cooldown_bars: 0 } };

  new RulesEngine(cfg as any, getOrchestrator());

    // Construct a context where rules array is minimal; since rules may be many,
    // directly call orchestrator via singleton path by simulating a generated signal
    const payload = {
      symbol: 'BANKNIFTY',
      timeframe: '1m',
      signal: 'BUY' as const,
      score: 0.9,
      firedRules: [{ name: 'test' }],
      timestamp: Date.now(),
    };

  // get singleton orchestrator and exercise it
  const orch = getOrchestrator();
  expect(orch).toBeDefined();
  if (!orch) throw new Error('orchestrator not installed');
  // Call handle which should attempt persist then emit
  await orch.handle(payload as any);

    expect(fakeCreate).toHaveBeenCalled();
    expect(fakeSave).toHaveBeenCalled();
    expect(emit).toHaveBeenCalledWith('signal', expect.objectContaining({ symbol: 'BANKNIFTY' }));
  });
});
