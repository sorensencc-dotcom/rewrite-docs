/*
  filename: package-builder.js
  version: 1.0.0
  updated: 2026-06-28
*/

import fs from "fs";
import { execSync } from "child_process";

export function buildPackage(input, output) {
  if (!fs.existsSync("bundle")) fs.mkdirSync("bundle");

  execSync(`tar -czf ${output} ${input}`, { stdio: "inherit" });

  return output;
}
