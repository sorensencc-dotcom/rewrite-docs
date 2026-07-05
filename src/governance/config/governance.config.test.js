/**
 * Governance Config Tests
 * Phase 5: Loading, merging, validation
 */
import { GovernanceConfigLoader } from './governance.config';
describe('GovernanceConfigLoader', () => {
    describe('load', () => {
        beforeEach(() => {
            delete process.env.HYBRID_THRESHOLD;
            delete process.env.GRS_WEIGHTS;
            delete process.env.AUDIT_CACHE_TTL_DAYS;
        });
        it('should load config from environment', () => {
            process.env.HYBRID_THRESHOLD = '0.35';
            const config = GovernanceConfigLoader.load();
            expect(config.hybridThreshold).toBe(0.35);
        });
        it('should use default values when env vars missing', () => {
            delete process.env.HYBRID_THRESHOLD;
            const config = GovernanceConfigLoader.load();
            expect(config.hybridThreshold).toBe(0.3);
        });
        it('should reject T outside [0.20, 0.40]', () => {
            process.env.HYBRID_THRESHOLD = '0.15';
            expect(() => GovernanceConfigLoader.load()).toThrow();
        });
        it('should load GRS weights from JSON env var', () => {
            process.env.GRS_WEIGHTS = '{"w1":0.5,"w2":0.3,"w3":0.1,"w4":0.1,"k":2.0}';
            const config = GovernanceConfigLoader.load();
            expect(config.grsWeights?.w1).toBe(0.5);
            expect(config.grsWeights?.k).toBe(2.0);
        });
        it('should merge AuditConfig fields', () => {
            process.env.AUDIT_CACHE_TTL_DAYS = '14';
            const config = GovernanceConfigLoader.load();
            expect(config.cache_ttl_days).toBe(14);
        });
        it('should include all required governance caps', () => {
            const config = GovernanceConfigLoader.load();
            expect(config.violationCaps).toBeDefined();
            expect(config.promotionCaps).toBeDefined();
            expect(config.retryCaps).toBeDefined();
            expect(config.lineageCaps).toBeDefined();
        });
    });
    describe('getDefaults', () => {
        it('should return complete default configuration', () => {
            const defaults = GovernanceConfigLoader.getDefaults();
            expect(defaults.hybridThreshold).toBe(0.3);
            expect(defaults.hybridThresholdSource).toBe('operator');
            expect(defaults.promotionCaps.maxGRS).toBe(0.7);
            expect(defaults.retryCaps.maxRetries).toBe(3);
        });
        it('should include valid GRS weights', () => {
            const defaults = GovernanceConfigLoader.getDefaults();
            const sum = (defaults.grsWeights?.w1 || 0) + (defaults.grsWeights?.w2 || 0) +
                (defaults.grsWeights?.w3 || 0) + (defaults.grsWeights?.w4 || 0);
            expect(sum).toBeCloseTo(1.0, 2); // Weights should sum to ~1
        });
    });
});
//# sourceMappingURL=governance.config.test.js.map