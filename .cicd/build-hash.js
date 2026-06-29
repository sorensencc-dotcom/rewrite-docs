/*
  filename: build-hash.js
  version: 1.0.0
  updated: 2026-06-28
*/

import crypto from "crypto";
import fs from "fs";

function hashDir(dir) {
  const files = fs.readdirSync(dir);
  const hash = crypto.createHash("sha256");

  for (const f of files) {
    const data = fs.readFileSync(`${dir}/${f}`);
    hash.update(data);
  }

  return hash.digest("hex");
}

const buildHash = hashDir("dist");
fs.writeFileSync("build-hash.txt", buildHash);

console.log("Build hash:", buildHash);
