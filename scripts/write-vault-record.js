#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");
const crypto = require("crypto");

function args() {
  const out = {};
  const a = process.argv.slice(2);
  for (let i = 0; i < a.length; i += 2) out[a[i].replace(/^--/, "")] = a[i + 1];
  return out;
}

function canonicalize(value) {
  const sortObject = (obj) => {
    if (obj === null || typeof obj !== "object") return obj;
    if (Array.isArray(obj)) return obj.map(sortObject);

    const sorted = {};
    for (const key of Object.keys(obj).sort()) {
      sorted[key] = sortObject(obj[key]);
    }
    return sorted;
  };

  return JSON.stringify(sortObject(value));
}

function computeDigest(record, algorithm = "sha256") {
  const canonical = canonicalize(record);
  const hash = crypto.createHash(algorithm);
  hash.update(canonical, "utf8");
  return `${algorithm}:${hash.digest("hex")}`;
}

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function write(vaultEndpoint, vaultApiKey, lineageFile, decisionFile, signingFile, promotionFile) {
  try {
    const lineage = JSON.parse(fs.readFileSync(path.resolve(lineageFile), "utf8"));
    const decision = JSON.parse(fs.readFileSync(path.resolve(decisionFile), "utf8"));
    const signing = JSON.parse(fs.readFileSync(path.resolve(signingFile), "utf8"));
    const promotion = JSON.parse(fs.readFileSync(path.resolve(promotionFile), "utf8"));

    // Build the vault record
    const vaultRecord = {
      vault_record_id: generateUUID(),
      schema_version: "24.5",
      created_at: new Date().toISOString(),
      
      // Build metadata
      build_id: lineage.build_id,
      cic_pipeline_id: lineage.cic_pipeline_id,
      git: lineage.git,
      environment: lineage.environment || {
        builder_image: "thefoundry-node-build:latest",
        cic_cli_version: "1.0.0",
        os: process.platform,
        toolchain_fingerprint: "tbd",
      },

      // Lineage metadata
      sbom_ref: lineage.sbom_ref || "sbom://tbd",
      provenance_ref: lineage.provenance_ref || "provenance://tbd",
      determinism_hash: lineage.determinism_hash || "sha256:tbd",
      test_summary: lineage.test_summary || { total: 0, passed: 0, failed: 0, skipped: 0 },

      // Artifact metadata
      type: lineage.artifact?.type || "container",
      coordinates: lineage.artifact?.coordinates || { group: "cic", name: "build", version: "0.0.1" },
      artifact_store_ref: lineage.artifact?.artifact_store_ref || null,
      digest: lineage.artifact?.digest || "sha256:tbd",
      size_bytes: lineage.artifact?.size_bytes || 0,

      // Governance decision
      decision: decision.decision,
      decision_reason: decision.decision_reason,
      policy_version: decision.policy_version || "1.0.0",
      council: decision.council || { members: [], quorum_met: false, decision_signature: "" },

      // Signing record
      signing_status: signing.status || signing.signing_status || "Pending",
      signing_key_id: signing.signing_key_id || null,
      signature_ref: signing.signature_ref || null,
      signing_timestamp: signing.timestamp || signing.signing_timestamp || null,

      // Promotion record
      promotion_status: promotion.status || promotion.promotion_status || "NotPromoted",
      target_environment: promotion.target_environment || null,
      promotion_timestamp: promotion.promotion_timestamp || null,
      initiator: promotion.initiator || null,

      // Audit envelope
      request_id: lineage.audit?.request_id || `req-${Date.now()}`,
      ci_job_id: lineage.audit?.ci_job_id || process.env.GITHUB_RUN_ID || "unknown",
      ip_or_node_id: lineage.audit?.ip_or_node_id || "ci-node",
      extra_metadata: lineage.audit?.extra_metadata || { labels: {} },
    };

    const digest = computeDigest(vaultRecord);
    const payload = { ...vaultRecord, vault_digest: digest };
    const body = canonicalize(payload);

    console.error(`Writing vault record: ${vaultRecord.vault_record_id}`);
    console.error(`Digest: ${digest}`);

    const url = new URL(vaultEndpoint);
    const proto = url.protocol === "https:" ? https : http;
    const req = proto.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${vaultApiKey}`,
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            console.error(`Vault write failed: ${res.statusCode} ${data}`);
            process.exit(1);
          }
          console.log(`Vault record written: ${data}`);
          console.error(`Success: vault_record_id=${vaultRecord.vault_record_id}`);
        });
      }
    );

    req.on("error", (e) => {
      console.error("Vault write error:", e);
      process.exit(1);
    });

    req.write(body);
    req.end();
  } catch (e) {
    console.error("Failed to write vault record:", e);
    process.exit(1);
  }
}

const a = args();
if (!a["vault-endpoint"] || !a["vault-api-key"] || !a["lineage-file"] || !a["decision-file"] || !a["signing-file"] || !a["promotion-file"]) {
  console.error(
    "Usage: write-vault-record.js --vault-endpoint <url> --vault-api-key <key> --lineage-file <file> --decision-file <file> --signing-file <file> --promotion-file <file>"
  );
  process.exit(1);
}

write(a["vault-endpoint"], a["vault-api-key"], a["lineage-file"], a["decision-file"], a["signing-file"], a["promotion-file"]);
