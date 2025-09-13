import { ZerodhaService } from '../../src/services/zerodha';

describe('Zerodha parser defensive checks', () => {
  test('should return gracefully on too-short buffer', () => {
    const s = new ZerodhaService();
    // Spy on storeTick to ensure it's not called
    const spy = jest.spyOn(s as any, 'storeTick').mockImplementation(() => Promise.resolve());
    const shortBuffer = Buffer.from([0x00, 0x01, 0x02]);
    expect(() => (s as any).handleTick(shortBuffer)).not.toThrow();
    spy.mockRestore();
  });
});
