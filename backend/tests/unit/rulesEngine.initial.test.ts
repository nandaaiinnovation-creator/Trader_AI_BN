import RulesEngine from '../../src/services/rules';

describe('RulesEngine scaffold', () => {
  test('can register and evaluate a simple rule', async () => {
    const engine = new RulesEngine();
    engine.registerRule('always-pass', () => ({ id: 'always-pass', name: 'always-pass', passed: true, score: 1 }));

    const results = await engine.evaluateAll({});
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('always-pass');
    expect(results[0].passed).toBe(true);
  });
});
