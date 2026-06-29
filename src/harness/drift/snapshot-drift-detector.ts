/*
  filename: snapshot-drift-detector.ts
  version: 1.0.0
  updated: 2026-06-28
*/

import { computeSnapshotHash, computeFsHash, computeEnvHash } from "../../harness/snapshot-hash-verifier";

export async function detectSnapshotDrift() {
  const snap1 = await computeSnapshotHash();
  const snap2 = await computeSnapshotHash();

  const fs1 = await computeFsHash();
  const fs2 = await computeFsHash();

  const env1 = await computeEnvHash();
  const env2 = await computeEnvHash();

  return {
    snapshot: snap1 === snap2,
    fs: fs1 === fs2,
    env: env1 === env2,
    passed: snap1 === snap2 && fs1 === fs2 && env1 === env2,
  };
}
