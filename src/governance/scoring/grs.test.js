/**
 * Governance Risk Score (GRS) Tests
 * Phase 5: Verify hybrid formula, input validation, adaptive caps
 */
import { computeGRS, validateGRSInputs, computeAdaptiveRetryCap, computeRollbackSeverity } from './grs';
import { GovernanceConfigLoader } from '../config/governance.config';
describe('GRS Hybrid Formula', () => {
    const config = GovernanceConfigLoader.getDefaults();
    describe('computeGRS', () => {
        it('should compute linear GRS when input < T=0.30', () => {
            const inputs = { V: 0.1, R: 0.05, C: 0.08, I: 0.02 };
            const grs = computeGRS(inputs, config);
            // linear = 0.4*0.1 + 0.2*0.05 + 0.2*0.08 + 0.2*0.02 = 0.04 + 0.01 + 0.016 + 0.004 = 0.07
            expect(grs).toBeLessThan(0.30);
            expect(grs).toBeCloseTo(0.07, 2);
        });
        it('should compute exponential GRS when input >= T=0.30', () => {
            const inputs = { V: 0.3, R: 0.2, C: 0.25, I: 0.15 };
            const grs = computeGRS(inputs, config);
            // linear = 0.4*0.3 + 0.2*0.2 + 0.2*0.25 + 0.2*0.15 = 0.12 + 0.04 + 0.05 + 0.03 = 0.24
            // Wait, that's < 0.30, so should be linear
            // Let me use inputs that trigger exponential
            const inputs2 = { V: 0.5, R: 0.4, C: 0.45, I: 0.35 };
            const grs2 = computeGRS(inputs2, config);
            // linear = 0.4*0.5 + 0.2*0.4 + 0.2*0.45 + 0.2*0.35 = 0.2 + 0.08 + 0.09 + 0.07 = 0.44
            // Since 0.44 >= 0.30, use exponential: 1 - exp(-k * sum)
            expect(grs2).toBeGreaterThan(0.30);
            expect(grs2).toBeLessThan(1.0);
        });
        it('should return 0 for zero inputs', () => {
            const inputs = { V: 0, R: 0, C: 0, I: 0 };
            const grs = computeGRS(inputs, config);
            expect(grs).toBe(0);
        });
        it('should return near 1 for maximum inputs', () => {
            const inputs = { V: 1, R: 1, C: 1, I: 1 };
            const grs = computeGRS(inputs, config);
            expect(grs).toBeGreaterThan(0.9);
        });
    });
    describe('validateGRSInputs', () => {
        it('should accept valid inputs in [0, 1]', () => {
            const inputs = { V: 0.5, R: 0.3, C: 0.7, I: 0.2 };
            expect(() => validateGRSInputs(inputs)).not.toThrow();
        });
        it('should reject inputs < 0', () => {
            const inputs = { V: -0.1, R: 0.3, C: 0.7, I: 0.2 };
            expect(() => validateGRSInputs(inputs)).toThrow();
        });
        it('should reject inputs > 1', () => {
            const inputs = { V: 1.5, R: 0.3, C: 0.7, I: 0.2 };
            expect(() => validateGRSInputs(inputs)).toThrow();
        });
    });
    describe('computeAdaptiveRetryCap', () => {
        it('should allow 3 retries when GRS=0', () => {
            const cap = computeAdaptiveRetryCap(0, config);
            expect(cap).toBe(3);
        });
        it('should allow 1-2 retries when GRS=0.5', () => {
            const cap = computeAdaptiveRetryCap(0.5, config);
            expect(cap).toBeGreaterThanOrEqual(1);
            expect(cap).toBeLessThanOrEqual(2);
        });
        it('should allow 0 retries when GRS=0.9', () => {
            const cap = computeAdaptiveRetryCap(0.9, config);
            expect(cap).toBe(0);
        });
        it('should clamp to 0 when GRS >= 1', () => {
            const cap = computeAdaptiveRetryCap(1.5, config);
            expect(cap).toBe(0);
        });
    });
    describe('computeRollbackSeverity', () => {
        it('should return rollback_soft when GRS < 0.33', () => {
            expect(computeRollbackSeverity(0.2)).toBe('rollback_soft');
        });
        it('should return rollback_structured when 0.33 <= GRS < 0.66', () => {
            expect(computeRollbackSeverity(0.5)).toBe('rollback_structured');
        });
        it('should return rollback_hard when GRS >= 0.66', () => {
            expect(computeRollbackSeverity(0.8)).toBe('rollback_hard');
        });
    });
});
//# sourceMappingURL=grs.test.js.map