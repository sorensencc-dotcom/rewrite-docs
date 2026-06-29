/*
  filename: firecracker-collector.js
  version: 1.0.0
  updated: 2026-06-28
*/

import client from "prom-client";
import { bootVM } from "../../../src/sandbox/firecracker";

const gauge = new client.Gauge({
  name: "sandbox3_firecracker_boot_ms",
  help: "Firecracker boot time"
});

export async function collectFirecracker() {
  const ms = await bootVM();
  gauge.set(ms);
}
