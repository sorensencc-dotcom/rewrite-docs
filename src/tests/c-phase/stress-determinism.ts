#!/usr/bin/env node

/**
 * C-Phase Stress Test: Determinism Under Load
 *
 * Runs 100 parallel routing decisions and validates all produce
 * byte-identical output. This detects nondeterministic sources like
 * random(), timestamps, async races, provider drift.
 *
 * Usage: node stress-determinism.js
 */

import { ModelRouter } from "../../core/modelRouter.js";
import { loadModelRegistry } from "../../core/modelRegistry.js";
import { AgentRoutingProfile } from "../../agents/routingProfile.js";
import { OrchestratorAgent } from "../../agents/orchestratorAgent.js";

process.env.MAAL_MODE = "local";

const STRESS_COUNT = 100;
const PROFILES = [
  new AgentRoutingProfile(["mock"]),
  new AgentRoutingProfile(["mock"], ["claude-3.7"]),
  new AgentRoutingProfile(["mock", "claude-3.7"])
];

const payload = {
  model: "",
  messages: [{ role: "user", content: "stress test" }]
};

const results = {
  routing: { runs: 0, identical: 0, diffs: [] },
  agent: { runs: 0, identical: 0, diffs: [] },
  parallel: { runs: 0, identical: 0, diffs: [] }
};

// Test 1: Routing determinism (100 runs per profile)
// Test 1: Routing Determinism
const router = new ModelRouter(loadModelRegistry());

for (const profile of PROFILES) {
  const selections = Array.from({ length: STRESS_COUNT }, () =>
    router.selectModel(profile, payload)
  );

  const serialized = selections.map(s =>
    JSON.stringify({ name: s.name, provider: s.provider, bias: s.routingBias })
  );

  const unique = new Set(serialized);
  results.routing.runs += STRESS_COUNT;
  results.routing.identical += unique.size === 1 ? STRESS_COUNT : 0;

  if (unique.size > 1) {
    results.routing.diffs.push({
      profile: profile["preferredModels"],
      uniqueOutputs: unique.size
    });
  }

  // console.log(
  //   `  ✓ Profile ${profile["preferredModels"].join(",")} → ${
  //     unique.size === 1 ? "✅ DETERMINISTIC" : `❌ ${unique.size} VARIANTS`
  //   }`
  // );
}

// Test 2: Agent determinism (100 runs)
// console.log("\n📊 Test 2: Agent Determinism (100 runs)...");
const agent = new OrchestratorAgent();

(async () => {
  const agentResults = await Promise.all(
    Array.from({ length: STRESS_COUNT }, () => agent.runPlan("stress test"))
  );

  const uniqueResults = new Set(agentResults);
  results.agent.runs = STRESS_COUNT;
  results.agent.identical = uniqueResults.size === 1 ? STRESS_COUNT : 0;

  if (uniqueResults.size > 1) {
    results.agent.diffs.push({
      uniqueOutputs: uniqueResults.size,
      samples: Array.from(uniqueResults).slice(0, 2)
    });
  }

  // console.log(
  //   `  ✓ OrchestratorAgent → ${
  //     uniqueResults.size === 1 ? "✅ DETERMINISTIC" : `❌ ${uniqueResults.size} VARIANTS`
  //   }`
  // );

  // Test 3: Parallel routing (100 concurrent)
  // // console.log("\n📊 Test 3: Parallel Routing (100 concurrent)...");
  const parallelSelections = await Promise.all(
    Array.from({ length: STRESS_COUNT }, () =>
      Promise.resolve(router.selectModel(PROFILES[0], payload))
    )
  );

  const parallelSerialized = parallelSelections.map(s =>
    JSON.stringify({ name: s.name, provider: s.provider })
  );

  const parallelUnique = new Set(parallelSerialized);
  results.parallel.runs = STRESS_COUNT;
  results.parallel.identical = parallelUnique.size === 1 ? STRESS_COUNT : 0;

  if (parallelUnique.size > 1) {
    results.parallel.diffs.push({
      uniqueOutputs: parallelUnique.size
    });
  }

  // console.log(
  //   `  ✓ Parallel routing → ${
  //     parallelUnique.size === 1 ? "✅ DETERMINISTIC" : `❌ ${parallelUnique.size} VARIANTS`
  //   }`
  // );

  // Summary
  // // console.log("\n" + "=".repeat(60));
  // // console.log("📈 STRESS TEST SUMMARY");
  // // console.log("=".repeat(60));

  const allPass =
    results.routing.identical === results.routing.runs &&
    results.agent.identical === results.agent.runs &&
    results.parallel.identical === results.parallel.runs;

  // // console.log(`\nRouting:  ${results.routing.identical}/${results.routing.runs} ✅`);
  // // console.log(`Agent:    ${results.agent.identical}/${results.agent.runs} ✅`);
  // // console.log(`Parallel: ${results.parallel.identical}/${results.parallel.runs} ✅`);

  if (allPass) {
    // // console.log("\n✅ C-PHASE DETERMINISM PASSED: All 300 runs produced identical output");
    process.exit(0);
  } else {
    // // console.log("\n❌ C-PHASE DETERMINISM FAILED: Nondeterminism detected");
    // // console.log("\nDifferences:");
    // // console.log(JSON.stringify(results, null, 2));
    process.exit(1);
  }
})();
