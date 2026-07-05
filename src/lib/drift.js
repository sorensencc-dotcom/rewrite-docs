import { graphContext } from '../cic/graph/GraphContextBuilder.js';
export async function detectDrift(service) {
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
export const driftDomains = [
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
export function getDriftDomain(id) {
    return driftDomains.find((d) => d.id === id);
}
/**
 * List all drift domains.
 */
export function listDriftDomains() {
    return [...driftDomains];
}
/**
 * Check if a file path matches any drift domain.
 */
export function matchesDriftDomain(filePath) {
    const matched = [];
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
export function computeAggregateDriftScore(domainScores) {
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
//# sourceMappingURL=drift.js.map