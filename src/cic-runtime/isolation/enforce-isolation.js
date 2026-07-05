// src/cic-runtime/isolation/enforce-isolation.ts
/**
 * Generate isolation flags for hardened tiers.
 * S1: hardened container
 * S2: gVisor (runsc)
 * S3: Firecracker (handled separately)
 */
export function buildIsolationFlags(tier) {
    if (tier === "S1") {
        return [
            "--cap-drop=ALL",
            "--security-opt=no-new-privileges",
            "--pids-limit=256",
            "--memory=512m",
            "--read-only",
            "--tmpfs=/tmp"
        ];
    }
    if (tier === "S2") {
        return [
            "--runtime=runsc",
            "--cap-drop=ALL",
            "--security-opt=no-new-privileges",
            "--pids-limit=256",
            "--memory=512m",
            "--read-only",
            "--tmpfs=/tmp"
        ];
    }
    if (tier === "S3") {
        // Firecracker isolation handled in s3-exec-firecracker.ts
        return [];
    }
    return [];
}
//# sourceMappingURL=enforce-isolation.js.map