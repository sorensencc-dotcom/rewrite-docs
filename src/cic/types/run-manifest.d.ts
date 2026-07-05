export type SandboxTierId = "S0" | "S1" | "S2" | "S3";
export interface RunManifest {
    runId: string;
    timestamp: string;
    userId?: string;
    model: {
        id: string;
        version: string;
        reasonCodes: string[];
    };
    sandbox: {
        tier: SandboxTierId;
        isolationLevel: "container" | "hardened_container" | "microvm" | "microvm_offline";
        determinism: "low" | "medium" | "medium_high" | "high";
        network: "off" | "allowlist" | "strict" | "none";
        costTier: "lowest" | "low" | "medium" | "highest";
        reasonCodes: string[];
    };
    environment: {
        osImageHash: string;
        runtimeVersions: Record<string, string>;
        libraryHashes: Record<string, string>;
        seed: number;
        envHash: string;
    };
    input: {
        code: string;
        codeHash: string;
        config: Record<string, unknown>;
        configHash: string;
        inputHash: string;
    };
    execution: {
        stdout: string;
        stderr: string;
        exitCode: number;
        resourceUsage: {
            cpuMs: number;
            memoryMb: number;
            wallTimeMs: number;
        };
        networkCalls: string[];
        violation?: {
            type: "resource" | "isolation" | "determinism" | "unknown";
            details?: string;
        };
    };
    telemetry: {
        sloCompliance: {
            latency: boolean;
            isolation: boolean;
            reliability: boolean;
        };
        drift: {
            modelOutputHash: string;
            executionOutputHash: string;
            driftScore: number;
        };
    };
    reproducibility: {
        manifestHash: string;
        reproducible: boolean;
    };
}
//# sourceMappingURL=run-manifest.d.ts.map