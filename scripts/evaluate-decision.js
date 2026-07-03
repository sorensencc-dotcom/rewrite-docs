#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

function args() {
  const out = {};
  const a = process.argv.slice(2);
  for (let i = 0; i < a.length; i += 2) out[a[i].replace(/^--/, "")] = a[i + 1];
  return out;
}

function evaluate(decisionFile) {
  try {
    const decision = JSON.parse(fs.readFileSync(path.resolve(decisionFile), "utf8"));
    
    if (!decision.decision) {
      console.error("Invalid decision format: missing 'decision' field");
      process.exit(1);
    }

    const verdict = decision.decision;
    const reason = decision.decision_reason || "No reason provided";

    // Set GitHub Actions output variables
    console.log(`decision=${verdict}`);
    console.log(`reason=${reason}`);

    // Also output to stderr for visibility in logs
    console.error(`Governance verdict: ${verdict}`);
    console.error(`Reason: ${reason}`);

    process.exit(0);
  } catch (e) {
    console.error("Failed to evaluate decision:", e);
    process.exit(1);
  }
}

const a = args();
if (!a["decision-file"]) {
  console.error(
    "Usage: evaluate-decision.js --decision-file <file>"
  );
  process.exit(1);
}

evaluate(a["decision-file"]);
