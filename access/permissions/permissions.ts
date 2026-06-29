/*
  filename: permissions.ts
  version: 1.0.0
  updated: 2026-06-29
*/

import fs from "fs";

export function loadPermissions() {
  return JSON.parse(
    fs.readFileSync("access/permissions/permissions.json", "utf8")
  ).permissions;
}

export function getPermissionTargets(permission: string) {
  const perms = loadPermissions();
  return perms[permission] || [];
}
