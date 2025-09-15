// @ts-nocheck
/**
 * Integration-style test for rules config upsert + broadcast.
 * Uses mocked TypeORM manager and repository to avoid DB dependency.
 */

jest.mock('typeorm', () => ({
  getManager: jest.fn(),
  getRepository: jest.fn(),
}));

jest.mock('../../src/utils/broadcast', () => ({
  emitEvent: jest.fn(),
}));

import { getManager, getRepository } from 'typeorm';
import { emitEvent } from '../../src/utils/broadcast';
import { upsertRuleConfigHandler } from '../../src/api/rules';

// Helper to create mock req/res
function makeReqRes(params: any, body: any) {
  const req: any = { params, body };
  let statusCode = 200;
  const res: any = {
    json: jest.fn((payload) => payload),
    status: jest.fn((s) => { statusCode = s; return res; }),
  };
  return { req, res, getStatus: () => statusCode };
}

describe('rules config upsert integration', () => {
  const store: Record<string, any> = {};

  beforeEach(() => {
    (getManager as jest.Mock).mockImplementation(() => ({
      query: jest.fn(async (sql: string, params: any[]) => {
        // naive SQL-dispatch for our simple tests
        if (sql.startsWith('SELECT * FROM rule_configs WHERE name')) {
          const name = params[0];
          return store[name] ? [store[name]] : [];
        }
        if (sql.startsWith('UPDATE rule_configs SET')) {
          const [enabled, configJson, name] = params;
          store[name] = { name, enabled, config: JSON.parse(configJson) };
          return [];
        }
        if (sql.includes('ON CONFLICT')) {
          // atomic upsert simulation: params order in our code is [name, enabled, configJson]
          const [name, enabled, configJson] = params;
          store[name] = { name, enabled, config: JSON.parse(configJson) };
          // RETURNING * should return an array with the inserted/updated row
          return [store[name]];
        }
        if (sql.startsWith('INSERT INTO rule_configs')) {
          const [name, enabled, configJson] = params;
          store[name] = { name, enabled, config: JSON.parse(configJson) };
          return [];
        }
        return [];
      }),
    }));

    (getRepository as jest.Mock).mockImplementation(() => ({
      find: jest.fn(async () => Object.values(store)),
    }));

    (emitEvent as jest.Mock).mockReset();
    for (const k of Object.keys(store)) delete store[k];
  });

  it('PUT creates/updates and emits event, GET returns updated config via repo', async () => {
    const { req, res } = makeReqRes({ name: 'test-rule' }, { enabled: true, config: { foo: 'bar' } });
    await upsertRuleConfigHandler(req as any, res as any);

    // verify response
    expect(res.json).toHaveBeenCalled();
    const payload = (res.json as jest.Mock).mock.calls[0][0];
    expect(payload).toHaveProperty('data');
    expect(payload.data).toEqual({ name: 'test-rule', enabled: true, config: { foo: 'bar' } });

    // emitEvent called with updated config
    expect(emitEvent).toHaveBeenCalledWith('rule_config_updated', payload.data);

    // GET /config uses getRepository().find(), simulate calling that handler indirectly by calling repo.find
    const repo: any = getRepository('rule_configs');
    const rows = await repo.find();
    expect(rows).toContainEqual(payload.data);
  });
});
