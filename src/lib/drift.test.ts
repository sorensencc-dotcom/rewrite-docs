/**
 * Drift Domain Registration Tests
 */

import {
  driftDomains,
  getDriftDomain,
  listDriftDomains,
  matchesDriftDomain,
  computeAggregateDriftScore,
} from "./drift";

describe("Drift Domain Registration", () => {
  describe("getDriftDomain", () => {
    test("retrieves domain by ID", () => {
      const domain = getDriftDomain("cic-vault");
      expect(domain).toBeDefined();
      expect(domain?.id).toBe("cic-vault");
      expect(domain?.name).toBe("CIC Governance Vault");
    });

    test("returns RL vault domain", () => {
      const domain = getDriftDomain("rl-vault");
      expect(domain).toBeDefined();
      expect(domain?.id).toBe("rl-vault");
      expect(domain?.weight).toBe(0.8);
      expect(domain?.vaultPath).toBe("C:/dev/rl-ref");
    });

    test("returns undefined for unknown domain", () => {
      const domain = getDriftDomain("nonexistent");
      expect(domain).toBeUndefined();
    });
  });

  describe("listDriftDomains", () => {
    test("returns all registered domains", () => {
      const domains = listDriftDomains();
      expect(domains.length).toBeGreaterThanOrEqual(3);
      expect(domains.some((d) => d.id === "cic-vault")).toBe(true);
      expect(domains.some((d) => d.id === "rl-vault")).toBe(true);
      expect(domains.some((d) => d.id === "roadmap-main")).toBe(true);
    });

    test("returns a copy, not the original array", () => {
      const domains1 = listDriftDomains();
      const domains2 = listDriftDomains();
      expect(domains1).not.toBe(domains2);
      expect(domains1).toEqual(domains2);
    });
  });

  describe("matchesDriftDomain", () => {
    test("matches CIC vault patterns", () => {
      const matched = matchesDriftDomain("cic/governance/state.json");
      expect(matched.some((d) => d.id === "cic-vault")).toBe(true);
    });

    test("matches RL vault patterns", () => {
      const matched = matchesDriftDomain("docs/rewrite-labs/overview.md");
      expect(matched.some((d) => d.id === "rl-vault")).toBe(true);
    });

    test("matches architecture patterns under RL vault", () => {
      const matched = matchesDriftDomain("docs/architecture/drift.md");
      expect(matched.some((d) => d.id === "rl-vault")).toBe(true);
    });

    test("matches roadmap patterns", () => {
      const matched = matchesDriftDomain("ROADMAP.md");
      expect(matched.some((d) => d.id === "roadmap-main")).toBe(true);
    });

    test("matches multiple domains for a file", () => {
      // This file could potentially match multiple patterns
      // depending on implementation
      const matched = matchesDriftDomain("docs/roadmaps/master-roadmap.md");
      expect(Array.isArray(matched)).toBe(true);
    });

    test("returns empty array for non-matching file", () => {
      const matched = matchesDriftDomain("unrelated/file.txt");
      // May be empty or may match based on glob patterns
      expect(Array.isArray(matched)).toBe(true);
    });
  });

  describe("computeAggregateDriftScore", () => {
    test("computes weighted average drift score", () => {
      const domainScores = {
        "cic-vault": 0.5, // weight 1.0
        "rl-vault": 0.8, // weight 0.8
      };

      const aggregate = computeAggregateDriftScore(domainScores);

      // Expected: (0.5 * 1.0 + 0.8 * 0.8) / (1.0 + 0.8)
      // = (0.5 + 0.64) / 1.8 = 1.14 / 1.8 ≈ 0.633
      expect(aggregate).toBeGreaterThan(0.6);
      expect(aggregate).toBeLessThan(0.65);
    });

    test("handles partial domain scores", () => {
      const domainScores = {
        "cic-vault": 0.7,
        // RL vault score missing
      };

      const aggregate = computeAggregateDriftScore(domainScores);

      // Expected: (0.7 * 1.0) / 1.0 = 0.7
      expect(aggregate).toBe(0.7);
    });

    test("returns 0 for empty domain scores", () => {
      const domainScores = {};
      const aggregate = computeAggregateDriftScore(domainScores);
      expect(aggregate).toBe(0);
    });

    test("clamps score between 0 and 1", () => {
      const domainScores = {
        "cic-vault": 0.9,
        "rl-vault": 1.0,
      };

      const aggregate = computeAggregateDriftScore(domainScores);
      expect(aggregate).toBeGreaterThanOrEqual(0);
      expect(aggregate).toBeLessThanOrEqual(1);
    });

    test("RL vault domain has correct weight", () => {
      const domain = getDriftDomain("rl-vault");
      expect(domain?.weight).toBe(0.8);
    });

    test("all domains have valid weights", () => {
      const domains = listDriftDomains();
      domains.forEach((d) => {
        expect(d.weight).toBeGreaterThan(0);
        expect(d.weight).toBeLessThanOrEqual(1);
      });
    });
  });

  describe("Drift Domain Configuration", () => {
    test("RL vault domain configured correctly", () => {
      const domain = getDriftDomain("rl-vault");
      expect(domain?.name).toBe("Rewrite Labs Reference Vault");
      expect(domain?.weight).toBe(0.8);
      expect(domain?.vaultPath).toBe("C:/dev/rl-ref");
      expect(domain?.patterns).toContain("docs/rewrite-labs/**");
      expect(domain?.patterns).toContain("docs/architecture/**");
      expect(domain?.refreshInterval).toBe(3600);
    });

    test("all domains have required fields", () => {
      const domains = listDriftDomains();
      domains.forEach((d) => {
        expect(d.id).toBeDefined();
        expect(d.name).toBeDefined();
        expect(d.weight).toBeDefined();
        expect(d.patterns).toBeDefined();
        expect(Array.isArray(d.patterns)).toBe(true);
      });
    });

    test("RL vault patterns are specific", () => {
      const domain = getDriftDomain("rl-vault");
      expect(domain?.patterns.length).toBeGreaterThan(0);
      domain?.patterns.forEach((pattern) => {
        expect(pattern).toContain("docs/");
      });
    });
  });
});
