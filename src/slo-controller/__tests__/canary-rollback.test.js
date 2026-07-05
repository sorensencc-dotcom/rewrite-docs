import { executeCanaryRollback } from '../canary-rollback';
import { canaryEventBus } from '../canary-signals';
import * as pgClient from '../../cic-runtime/audit-log/postgres-client';
jest.mock('../../cic-runtime/audit-log/postgres-client');
describe('canary-rollback', () => {
    const mockProposalId = 'prop-test-123';
    beforeEach(() => {
        jest.clearAllMocks();
        pgClient.pgQuery.mockResolvedValue([
            { previous_version: 'v1.0.0' }
        ]);
    });
    test('executeCanaryRollback emits rollback signal', async () => {
        const emitSpy = jest.spyOn(canaryEventBus, 'emit');
        await executeCanaryRollback(mockProposalId);
        expect(emitSpy).toHaveBeenCalledWith('rollback', expect.any(Object));
        expect(emitSpy).toHaveBeenCalledWith('rollback_complete', expect.any(Object));
    });
    test('executeCanaryRollback returns success result', async () => {
        const result = await executeCanaryRollback(mockProposalId);
        expect(result.success).toBe(true);
        expect(result.completeMs).toBeGreaterThanOrEqual(0);
        expect(result.rolledBackAt).toBeGreaterThan(0);
        expect(result.previousVersion).toBe('v1.0.0');
    });
    test('rollback completes within 300ms threshold', async () => {
        const result = await executeCanaryRollback(mockProposalId);
        expect(result.completeMs).toBeLessThanOrEqual(300);
    });
});
//# sourceMappingURL=canary-rollback.test.js.map