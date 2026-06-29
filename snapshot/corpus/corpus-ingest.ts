/*
  filename: corpus-ingest.ts
  version: 1.0.0
  updated: 2026-06-29
*/

import fs from "fs";

export function ingestCorpus() {
  const manifest = JSON.parse(
    fs.readFileSync("snapshot/corpus/corpus-manifest.json", "utf8")
  );

  const result = {};

  for (const [name, path] of Object.entries(manifest.sources)) {
    const files = fs.readdirSync(path);
    result[name] = files.map((f) => `${path}/${f}`);
  }

  fs.writeFileSync(
    "snapshot/corpus/corpus-index.json",
    JSON.stringify(result, null, 2)
  );

  return result;
}
