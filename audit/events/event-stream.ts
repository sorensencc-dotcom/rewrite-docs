/*
  filename: event-stream.ts
  version: 1.0.0
  updated: 2026-06-29
*/

import { appendLedger } from "../ledger/append";
import { EventTypes } from "./event-types";

export function emitEvent(type, payload) {
  return appendLedger({ type, payload });
}
