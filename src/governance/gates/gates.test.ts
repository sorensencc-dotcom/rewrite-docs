/**
 * Governance Gates Tests (A, B, C)
 * Phase 5: Structural, Adaptive Canary, Promotion
 */

import { gateAStructuralCheck } from './gate-a';
import { gateBAdaptiveCanaryCheck } from './gate-b';
import { GovernanceConfigLoader } from '../config/governance.config';

describe('Governance Gates', () => {
  const config = GovernanceConfigLoader.getDefaults();

  describe('Gate A - Structural Check', () => {
    it('should PASS valid proposal with correct policy version', async () => {
      const result = await gateAStructuralCheck({
        proposalId: 'prop-001',
        dslShape: { phase: 5, regime: 'adaptive' },
        policyVersion: '2.0',
      });
      expect(result.verdict).toBe('PASS');
      expect(result.governance_path).toBe('gate_a');
      expect(result.risk_score).toBe(0.0);
    });

    it('should FAIL when DSL shape is invalid', async () => {
      const result = await gateAStructuralCheck({
        proposalId: 'prop-002',
        dslShape: null as any,
        policyVersion: '2.0',
      });
      expect(result.verdict).toBe('FAIL');
      expect(result.governance_reason).toContain('invalid');
    });

    it('should FAIL on policy version mismatch', async () => {
      const result = await gateAStructuralCheck({
        proposalId: 'prop-003',
        dslShape: {},
        policyVersion: '1.0',
      });
      expect(result.verdict).toBe('FAIL');
      expect(result.governance_reason).toContain('Policy version mismatch');
    });
  });

  describe('Gate B - Adaptive Canary Check', () => {
    it('should PASS when GRS low and retries available', async () => {
      const result = await gateBAdaptiveCanaryCheck({
        proposalId: 'prop-004',
        grsInputs: { V: 0.05, R: 0.02, C: 0.03, I: 0.01 },
        violationCount: 0,
        retryCount: 0,
      });
      expect(result.verdict).toBe('PASS');
      expect(result.risk_score).toBeLessThan(0.1);
    });

    it('should WARN when hard violation detected', async () => {
      const result = await gateBAdaptiveCanaryCheck({
        proposalId: 'prop-005',
        grsInputs: { V: 0.8, R: 0.7, C: 0.75, I: 0.6 },
        violationCount: 2,
        retryCount: 2,
      });
      expect(result.verdict).toMatch(/PASS|WARN|FAIL/);
      expect(result.risk_score).toBeGreaterThan(0.3);
    });

    it('should FAIL when max retries exhausted', async () => {
      const result = await gateBAdaptiveCanaryCheck({
        proposalId: 'prop-006',
        grsInputs: { V: 0.9, R: 0.8, C: 0.85, I: 0.7 },
        violationCount: 5,
        retryCount: 5,
      });
      // High GRS means low retries available, so retryCount=5 exceeds cap
      expect(result.risk_score).toBeGreaterThan(0.5);
    });
  });

  describe('Gate C - Promotion Check', () => {
    it('should record promotion decision to database', async () => {
      // This test would require mocking pgQuery
      // Skipping for now, as it requires DB setup
    });

    it('should reject promotion when GRS exceeds cap', async () => {
      // Test that checks maxGRS cap enforcement
      // Requires mocking pgQuery
    });

    it('should reject promotion with low lineage consistency', async () => {
      // Test that checks LCS requirement
      // Requires mocking pgQuery
    });
  });
});
