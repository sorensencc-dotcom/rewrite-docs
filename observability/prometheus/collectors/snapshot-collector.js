/*
  filename: snapshot-collector.js
  version: 1.0.0
  updated: 2026-06-28
*/

import client from "prom-client";
import { computeSnapshotHash } from "../../../src/harness/snapshot-hash-verifier";

const gauge = new client.Gauge({
  name: "sandbox3_snapshot_integrity",
  help: "Snapshot hash consistency"
});

export async function collectSnapshot() {
  const h1 = await computeSnapshotHash();
  const h2 = await computeSnapshotHash();
  gauge.set(h1 === h2 ? 1 : 0);
}
