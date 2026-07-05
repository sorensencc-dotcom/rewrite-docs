/**
 * Generate isolation flags for hardened tiers.
 * S1: hardened container
 * S2: gVisor (runsc)
 * S3: Firecracker (handled separately)
 */
export declare function buildIsolationFlags(tier: "S1" | "S2" | "S3"): string[];
//# sourceMappingURL=enforce-isolation.d.ts.map