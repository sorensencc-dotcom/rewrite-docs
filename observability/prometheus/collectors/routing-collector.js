/*
  filename: routing-collector.js
  version: 1.0.0
  updated: 2026-06-28
*/

import client from "prom-client";
import { selectRegime } from "../../../src/routing/regimeSelector";

const gauge = new client.Gauge({
  name: "cic_routing_variance",
  help: "Routing determinism variance"
});

export async function collectRouting() {
  const fp = { task: "summarize", size: 128 };
  const r1 = selectRegime(fp);
  const r2 = selectRegime(fp);
  gauge.set(r1 === r2 ? 0 : 1);
}
