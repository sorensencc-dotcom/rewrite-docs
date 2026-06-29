/*
  filename: version-bump.js
  version: 1.0.0
  updated: 2026-06-28
*/

import fs from "fs";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const [major, minor, patch] = pkg.version.split(".").map(Number);

pkg.version = `${major}.${minor}.${patch + 1}`;
fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2));

console.log("Version bumped →", pkg.version);
