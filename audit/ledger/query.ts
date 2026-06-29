/*
  filename: query.ts
  version: 1.0.0
  updated: 2026-06-29
*/

import { Ledger } from "./ledger";

export function queryLedger(filter = {}) {
  const ledger = new Ledger();
  const entries = ledger.read();

  return entries.filter((e) =>
    Object.entries(filter).every(([k, v]) => e.event[k] === v)
  );
}
