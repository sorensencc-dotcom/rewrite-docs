#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const https = require("https");

function args() {
  const out = {};
  const a = process.argv.slice(2);
  for (let i = 0; i < a.length; i += 2) out[a[i].replace(/^--/, "")] = a[i + 1];
  return out;
}

function submit(endpoint, apiKey, lineageFile, outputFile) {
  const lineage = JSON.parse(fs.readFileSync(path.resolve(lineageFile), "utf8"));

  const payload = {
    request_id: `req-${Date.now()}`,
    build_id: lineage.build_id,
    cic_pipeline_id: lineage.cic_pipeline_id,
    git: lineage.git,
    lineage: {
      sbom_ref: lineage.sbom_ref,
      provenance_ref: lineage.provenance_ref,
      determinism_hash: lineage.determinism_hash,
      test_summary: lineage.test_summary,
    },
    artifact: lineage.artifact,
    audit: lineage.audit,
  };

  const body = JSON.stringify(payload);
  const url = new URL(endpoint);

  const req = https.request(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "Content-Length": Buffer.byteLength(body),
      },
    },
    (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          console.error(`Governance submit failed: ${res.statusCode} ${data}`);
          process.exit(1);
        }
        fs.writeFileSync(path.resolve(outputFile), data);
        console.log(`Governance decision written to ${outputFile}`);
      });
    }
  );

  req.on("error", (e) => {
    console.error("Governance submit error:", e);
    process.exit(1);
  });

  req.write(body);
  req.end();
}

const a = args();
if (!a.endpoint || !a["api-key"] || !a["lineage-file"] || !a.output) {
  console.error(
    "Usage: submit-governance.js --endpoint <url> --api-key <key> --lineage-file <file> --output <file>"
  );
  process.exit(1);
}

submit(a.endpoint, a["api-key"], a["lineage-file"], a.output);
