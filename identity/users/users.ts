/*
  filename: users.ts
  version: 1.0.0
  updated: 2026-06-29
*/

import fs from "fs";

export function loadUsers() {
  return JSON.parse(fs.readFileSync("identity/users/users.json", "utf8"));
}

export function getUser(name: string) {
  return loadUsers()[name];
}
