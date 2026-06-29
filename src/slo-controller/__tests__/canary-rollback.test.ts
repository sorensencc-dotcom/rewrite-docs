import { executeCanaryRollback } from '../canary-rollback';
import { canaryEventBus } from '../canary-signals';

describe('canary-rollback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('executeCanaryRollback emits rollback signal', async () => {
    const emitSpy = jest.spyOn(canaryEventBus, 'emit');

    await executeCanaryRollback();

    expect(emitSpy).toHaveBeenCalledWith('rollback', expect.any(Object));
    expect(emitSpy).toHaveBeenCalledWith('rollback_complete', expect.any(Object));
  });

  test('executeCanaryRollback returns success result', async () => {
    const result = await executeCanaryRollback();

    expect(result.success).toBe(true);
    expect(result.completeMs).toBeGreaterThanOrEqual(0);
    expect(result.rolledBackAt).toBeGreaterThan(0);
  });

  test('rollback completes within 300ms threshold', async () => {
    const result = await executeCanaryRollback();

    expect(result.completeMs).toBeLessThanOrEqual(300);
  });
});
