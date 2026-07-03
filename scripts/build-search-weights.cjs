#!/usr/bin/env node
/**
 * Docs Search Relevance Booster
 * - Reads docs-metadata.json
 * - Writes docs-search-weights.json with per-doc weight
 */

const fs = require("fs");
const path = require("path");

const META = path.join("docs-metadata.json");
const OUT = path.join("docs-search-weights.json");

function computeWeight(doc) {
  let weight = 1.0;

  const tags = (doc.tags || "").toLowerCase();

  if (tags.includes("cic")) weight += 0.5;
  if (tags.includes("rewrite-labs")) weight += 0.3;
  if (tags.includes("roadmap")) weight += 0.4;
  if (tags.includes("governance")) weight += 0.6;
  if (tags.includes("architecture")) weight += 0.5;

  if ((doc.title || "").toLowerCase().includes("phase")) weight += 0.3;
  if ((doc.title || "").toLowerCase().includes("torquequery")) weight += 0.4;

  return weight;
}

function main() {
  if (!fs.existsSync(META)) {
    console.error(`❌ ${META} not found. Run build-metadata-index first.`);
    process.exit(1);
  }

  const meta = JSON.parse(fs.readFileSync(META, "utf8"));
  const weights = meta.map(doc => ({
    path: doc.path,
    weight: computeWeight(doc)
  }));

  fs.writeFileSync(OUT, JSON.stringify(weights, null, 2));
  console.log(`✔ Search weights written to ${OUT} (${weights.length} files)`);
}

main();
