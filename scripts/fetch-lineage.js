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

function fetch(endpoint, apiKey, buildId, outputFile) {
  const url = new URL(endpoint);
  url.searchParams.append("build_id", buildId);

  const req = https.request(
    url,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    },
    (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          console.error(`Fetch lineage failed: ${res.statusCode} ${data}`);
          process.exit(1);
        }
        try {
          const lineage = JSON.parse(data);
          fs.writeFileSync(path.resolve(outputFile), JSON.stringify(lineage, null, 2));
          console.log(`Lineage packet fetched and written to ${outputFile}`);
        } catch (e) {
          console.error("Failed to parse lineage response:", e);
          process.exit(1);
        }
      });
    }
  );

  req.on("error", (e) => {
    console.error("Fetch lineage error:", e);
    process.exit(1);
  });

  req.end();
}

const a = args();
if (!a["build-id"] || !a.output) {
  console.error(
    "Usage: fetch-lineage.js --build-id <id> --output <file>"
  );
  process.exit(1);
}

const endpoint = process.env.FOUNDRY_LINEAGE_ENDPOINT;
const apiKey = process.env.FOUNDRY_API_KEY;

if (!endpoint || !apiKey) {
  console.error(
    "Missing FOUNDRY_LINEAGE_ENDPOINT or FOUNDRY_API_KEY environment variables"
  );
  process.exit(1);
}

fetch(endpoint, apiKey, a["build-id"], a.output);
