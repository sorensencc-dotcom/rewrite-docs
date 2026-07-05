export declare function detectDrift(service: string): Promise<{
    service: string;
    hasDrift: boolean;
    structure: import("../schemas/index.js").StructuralGraph | undefined;
    timeline: import("../schemas/index.js").ChangeEvent[] | undefined;
    architecture: import("../schemas/index.js").DocNode[] | undefined;
}>;
/**
 * Drift Domain Registration
 * Defines vaults and repos that should be monitored for content drift.
 * Used by the drift-detector service to compute drift scores.
 */
export interface DriftDomain {
    id: string;
    name: string;
    weight: number;
    patterns: string[];
    vaultPath?: string;
    repoPath?: string;
    refreshInterval?: number;
}
export declare const driftDomains: DriftDomain[];
/**
 * Get a drift domain by ID.
 */
export declare function getDriftDomain(id: string): DriftDomain | undefined;
/**
 * List all drift domains.
 */
export declare function listDriftDomains(): DriftDomain[];
/**
 * Check if a file path matches any drift domain.
 */
export declare function matchesDriftDomain(filePath: string): DriftDomain[];
/**
 * Compute aggregate drift score across all domains.
 * @param domainScores Map of domain ID to drift score (0-1)
 * @returns weighted average across all domains
 */
export declare function computeAggregateDriftScore(domainScores: Record<string, number>): number;
//# sourceMappingURL=drift.d.ts.map