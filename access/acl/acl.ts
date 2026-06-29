/*
  filename: acl.ts
  version: 1.0.0
  updated: 2026-06-29
*/

import fs from "fs";

export function loadACL() {
  return JSON.parse(fs.readFileSync("access/acl/acl.json", "utf8")).acl;
}

export function getAccess(entity: string) {
  const acl = loadACL();
  return acl[entity] || [];
}
