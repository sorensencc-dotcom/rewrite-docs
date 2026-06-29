/*
  filename: ledger.ts
  version: 1.0.0
  updated: 2026-06-29
*/

import fs from "fs";

export class Ledger {
  constructor(path = "audit/ledger/ledger.json") {
    this.path = path;
    if (!fs.existsSync(path)) fs.writeFileSync(path, "[]");
  }

  read() {
    return JSON.parse(fs.readFileSync(this.path, "utf8"));
  }

  write(entries) {
    fs.writeFileSync(this.path, JSON.stringify(entries, null, 2));
  }
}
