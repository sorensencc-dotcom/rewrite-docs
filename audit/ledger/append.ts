/*
  filename: append.ts
  version: 1.0.0
  updated: 2026-06-29
*/

import crypto from "crypto";
import { Ledger } from "./ledger";

export function appendLedger(event) {
  const ledger = new Ledger();
  const entries = ledger.read();

  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify(event))
    .digest("hex");

  const entry = {
    timestamp: new Date().toISOString(),
    event,
    hash
  };

  entries.push(entry);
  ledger.write(entries);

  return entry;
}
