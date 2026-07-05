// src/cic-runtime/generate-run-manifest.ts
import crypto from "crypto";
/**
 * Utility: stable SHA-256 hashing
 */
function sha256(data) {
    return crypto.createHash("sha256")
        .update(JSON.stringify(data))
        .digest("hex");
}
/**
 * Generate the immutable RunManifest AFTER sandbox execution.
 * This function must never mutate its inputs.
 */
export function generateRunManifest(req, route, env, input, exec, telemetry) {
    const manifest = {
        runId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        userId: req.userId,
        model: {
            id: route.selectedModel,
            version: env.modelVersion,
            reasonCodes: route.reasonCodes.filter(r => r.startsWith("model"))
        },
        sandbox: {
            tier: route.selectedSandboxTier,
            isolationLevel: env.sandboxIsolationLevel,
            determinism: env.sandboxDeterminism,
            network: env.sandboxNetwork,
            costTier: env.sandboxCostTier,
            reasonCodes: route.reasonCodes.filter(r => r.startsWith("sandbox"))
        },
        environment: {
            osImageHash: env.osImageHash,
            runtimeVersions: env.runtimeVersions,
            libraryHashes: env.libraryHashes,
            seed: env.seed,
            envHash: sha256({
                osImageHash: env.osImageHash,
                runtimeVersions: env.runtimeVersions,
                libraryHashes: env.libraryHashes,
                seed: env.seed
            })
        },
        input: {
            code: input.code,
            codeHash: sha256(input.code),
            config: input.config,
            configHash: sha256(input.config),
            inputHash: sha256({
                codeHash: sha256(input.code),
                configHash: sha256(input.config)
            })
        },
        execution: {
            stdout: exec.stdout,
            stderr: exec.stderr,
            exitCode: exec.exitCode,
            resourceUsage: exec.resourceUsage,
            networkCalls: exec.networkCalls,
            violation: exec.violation
        },
        telemetry: {
            sloCompliance: telemetry.sloCompliance,
            drift: {
                modelOutputHash: sha256(telemetry.modelOutput),
                executionOutputHash: sha256({
                    stdout: exec.stdout,
                    stderr: exec.stderr,
                    exitCode: exec.exitCode
                }),
                driftScore: telemetry.driftScore
            }
        },
        reproducibility: {
            manifestHash: "", // filled below
            reproducible: route.selectedSandboxTier === "S3"
        }
    };
    // Final manifest hash (immutable) — exclude runId and timestamp for determinism
    const manifestForHashing = {
        ...manifest,
        runId: undefined,
        timestamp: undefined
    };
    manifest.reproducibility.manifestHash = sha256(manifestForHashing);
    return manifest;
}
//# sourceMappingURL=generate-run-manifest.js.map