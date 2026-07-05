import { measureCanaryRollbackTiming } from '../rollback-timing-harness';
describe('rollback-timing-harness', () => {
    test('measures rollback latency within hard limit', async () => {
        const mockRollback = async () => {
            // Simulate fast rollback
            await new Promise((resolve) => setTimeout(resolve, 50));
        };
        const result = await measureCanaryRollbackTiming({ reason: 'test', scenario: 'normal' }, mockRollback);
        expect(result.withinTarget).toBe(true);
        expect(result.totalMs).toBeLessThanOrEqual(300);
        expect(result.startToCompleteMs).toBeGreaterThanOrEqual(50);
    });
    test('detects rollback exceeding hard limit', async () => {
        const mockRollback = async () => {
            // Simulate slow rollback
            await new Promise((resolve) => setTimeout(resolve, 400));
        };
        const result = await measureCanaryRollbackTiming({ reason: 'test', scenario: 'slow' }, mockRollback);
        expect(result.withinTarget).toBe(false);
        expect(result.totalMs).toBeGreaterThan(300);
    });
    test('measures abort-to-start overhead', async () => {
        const mockRollback = async () => {
            await new Promise((resolve) => setTimeout(resolve, 10));
        };
        const result = await measureCanaryRollbackTiming({ reason: 'test' }, mockRollback);
        expect(result.abortToStartMs).toBeGreaterThanOrEqual(0);
        expect(result.abortToStartMs).toBeLessThan(10);
    });
});
//# sourceMappingURL=rollback-timing-harness.test.js.map