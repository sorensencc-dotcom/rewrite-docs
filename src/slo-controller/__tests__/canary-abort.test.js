import { triggerCanaryAbort } from '../canary-abort';
import { canaryEventBus } from '../canary-signals';
import { metricsExporter } from '../../observability/metrics-endpoint';
jest.mock('../../observability/metrics-endpoint');
describe('canary-abort', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    test('triggerCanaryAbort emits abort signal', async () => {
        const emitSpy = jest.spyOn(canaryEventBus, 'emit');
        await triggerCanaryAbort('prop-test-123', {
            reason: 'test_violation',
            sloId: 'latency_p99',
            burnRate: 15,
            threshold: 14,
        });
        expect(emitSpy).toHaveBeenCalledWith('abort', expect.objectContaining({
            type: 'abort',
            reason: 'test_violation',
        }));
    });
    test('triggerCanaryAbort records metric', async () => {
        await triggerCanaryAbort('prop-test-123', {
            reason: 'test_violation',
        });
        expect(metricsExporter.recordCanaryAbort).toHaveBeenCalled();
    });
});
//# sourceMappingURL=canary-abort.test.js.map