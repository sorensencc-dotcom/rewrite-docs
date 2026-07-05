import { LatencySloManager } from '../../cic-runtime/sandbox-exec/latency-slo-manager';
import { KillSwitch } from '../../cic-runtime/sandbox-exec/kill-switch';
describe('Latency & SLO Enforcement', () => {
    it('should correctly flag SLO violations', () => {
        const slo = new LatencySloManager(100);
        expect(slo.enforce(90).violated).toBe(false);
        expect(slo.enforce(150).violated).toBe(true);
        expect(slo.enforce(150).exceededByMs).toBe(50);
    });
    it('should forcefully reject promises exceeding kill-switch limit', async () => {
        const slowPromise = new Promise(resolve => setTimeout(resolve, 50));
        await expect(KillSwitch.enforce(slowPromise, 10)).rejects.toThrowError(/Hard execution timeout exceeded: 10ms/);
    });
});
//# sourceMappingURL=latency.test.js.map