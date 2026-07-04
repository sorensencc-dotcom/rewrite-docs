import { graphContext } from '../cic/graph/GraphContextBuilder.js';

export async function detectDrift(service: string) {
  console.log(`[DriftDetector] Checking drift for service: ${service}`);

  // Consuming unified context instead of direct Graphify/TrueCode comparison calls
  const ctx = await graphContext.getDriftContext({ service });

  const structure = ctx.code.structure;
  const timeline = ctx.history.changeTimeline;
  const architecture = ctx.knowledge.documentedArchitecture;

  // Simple deterministic drift check
  const hasDrift = !!(timeline && timeline.length > 0 && architecture && architecture.length > 0);

  return {
    service,
    hasDrift,
    structure,
    timeline,
    architecture
  };
}

/**
 * Drift Domain Registration
 * Defines vaults and repos that should be monitored for content drift.
 * Used by the drift-detector service to compute drift scores.
 */

export interface DriftDomain {
  id: string;
  name: string;
  weight: number; // 0-1 scale, used in aggregate drift scoring
  patterns: string[]; // glob patterns for files to monitor
  vaultPath?: string; // local vault mirror path
  repoPath?: string; // repo root path
  refreshInterval?: number; // seconds
}

export const driftDomains: DriftDomain[] = [
  {
    id: "cic-vault",
    name: "CIC Governance Vault",
    weight: 1.0,
    patterns: ["cic/**/*", "governance/**/*"],
    vaultPath: "C:/dev/cic",
    refreshInterval: 3600, // hourly
  },
  {
    id: "rl-vault",
    name: "Rewrite Labs Reference Vault",
    weight: 0.8,
    patterns: ["docs/rewrite-labs/**", "docs/architecture/**"],
    vaultPath: "C:/dev/rl-ref",
    refreshInterval: 3600, // hourly
  },
  {
    id: "roadmap-main",
    name: "Master Roadmap",
    weight: 1.0,
    patterns: ["**/ROADMAP*.md", "**/roadmap*.json"],
    repoPath: "C:/dev",
    refreshInterval: 1800, // 30 minutes
  },
];

/**
 * Get a drift domain by ID.
 */
export function getDriftDomain(id: string): DriftDomain | undefined {
  return driftDomains.find((d) => d.id === id);
}

/**
 * List all drift domains.
 */
export function listDriftDomains(): DriftDomain[] {
  return [...driftDomains];
}

/**
 * Check if a file path matches any drift domain.
 */
export function matchesDriftDomain(filePath: string): DriftDomain[] {
  const matched: DriftDomain[] = [];

  for (const domain of driftDomains) {
    for (const pattern of domain.patterns) {
      // Simple glob matching (in production, use a proper glob library)
      const regex = new RegExp(pattern.replace(/\*/g, ".*").replace(/\?/g, "."));
      if (regex.test(filePath)) {
        matched.push(domain);
        break; // Don't add same domain twice
      }
    }
  }

  return matched;
}

/**
 * Compute aggregate drift score across all domains.
 * @param domainScores Map of domain ID to drift score (0-1)
 * @returns weighted average across all domains
 */
export function computeAggregateDriftScore(domainScores: Record<string, number>): number {
  let totalWeight = 0;
  let weightedSum = 0;

  for (const domain of driftDomains) {
    if (domainScores[domain.id] !== undefined) {
      weightedSum += domainScores[domain.id] * domain.weight;
      totalWeight += domain.weight;
    }
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}
