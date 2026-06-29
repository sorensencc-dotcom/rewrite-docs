export type SandboxTierId = "S0" | "S1" | "S2" | "S3";

export interface RunManifest {
  // --- Identity ---
  runId: string;                 // UUIDv4
  timestamp: string;             // ISO8601
  userId?: string;               // optional tenant or internal actor

  // --- Routing decisions ---
  model: {
    id: string;                  // selected model ID
    version: string;             // model version/hash
    reasonCodes: string[];       // MAAL model routing reasons
  };

  sandbox: {
    tier: SandboxTierId;
    isolationLevel: "container" | "hardened_container" | "microvm" | "microvm_offline";
    determinism: "low" | "medium" | "medium_high" | "high";
    network: "off" | "allowlist" | "strict" | "none";
    costTier: "lowest" | "low" | "medium" | "highest";
    reasonCodes: string[];       // MAAL sandbox routing reasons
  };

  // --- Environment snapshot ---
  environment: {
    osImageHash: string;         // SHA256 of OS image
    runtimeVersions: Record<string, string>; // e.g., { node: "20.11.0", python: "3.11.3" }
    libraryHashes: Record<string, string>;   // pinned libs: { "numpy": "sha256:..." }
    seed: number;                // RNG seed for deterministic runs
    envHash: string;             // hash of entire environment block
  };

  // --- Input snapshot ---
  input: {
    code: string;                // code executed
    codeHash: string;            // SHA256 of code
    config: Record<string, unknown>; // execution config
    configHash: string;          // SHA256 of config
    inputHash: string;           // combined hash of code + config
  };

  // --- Execution results ---
  execution: {
    stdout: string;
    stderr: string;
    exitCode: number;
    resourceUsage: {
      cpuMs: number;
      memoryMb: number;
      wallTimeMs: number;
    };
    networkCalls: string[];      // captured egress calls (S1/S2)
    violation?: {
      type: "resource" | "isolation" | "determinism" | "unknown";
      details?: string;
    };
  };

  // --- SLO + Drift telemetry ---
  telemetry: {
    sloCompliance: {
      latency: boolean;
      isolation: boolean;
      reliability: boolean;
    };
    drift: {
      modelOutputHash: string;      // hash of model output used to generate code
      executionOutputHash: string;  // hash of stdout+stderr+exitCode
      driftScore: number;           // 0–1 normalized
    };
  };

  // --- Reproducibility ---
  reproducibility: {
    manifestHash: string;        // SHA256 of entire manifest
    reproducible: boolean;       // true for S3, best-effort for others
  };
}
