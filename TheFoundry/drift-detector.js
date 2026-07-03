#!/usr/bin/env node

/**
 * Roadmap Drift Detector
 * Checks for inconsistencies between compiled graph and source roadmaps
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const graphIdx = args.indexOf('--graph');
const roadmapsIdx = args.indexOf('--roadmaps');

const graphPath = graphIdx >= 0 ? args[graphIdx + 1] : 'out/roadmap/ROADMAP_DEPENDENCY_GRAPH.json';
const roadmapsPath = roadmapsIdx >= 0 ? args[roadmapsIdx + 1] : '../docs/roadmap';

const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));

const issues = [];

// Check 1: Graph nodes vs roadmap references
console.log('[drift] Checking for dangling phases...');
const graphPhases = new Set(graph.nodes.map((n) => n.id));
const referencePhases = new Set();

// Extract phases from roadmap files
const roadmapFiles = fs.readdirSync(roadmapsPath).filter((f) => f.endsWith('.md'));
for (const file of roadmapFiles) {
  const content = fs.readFileSync(path.join(roadmapsPath, file), 'utf8');
  const phaseMatches = content.match(/\| (PHASE-\d+(?:\.\d+)?|RL-\d+(?:\.\d+)?)/g);
  if (phaseMatches) {
    for (const match of phaseMatches) {
      const phaseId = match.replace(/\| /, '');
      referencePhases.add(phaseId);
    }
  }
}

// Check for orphaned phases (in roadmap but not in graph)
for (const phase of referencePhases) {
  if (!graphPhases.has(phase)) {
    issues.push(`[WARNING] Phase ${phase} referenced in roadmap but not in graph`);
  }
}

// Check 2: Dependency cycles
console.log('[drift] Checking for dependency cycles...');
function hasCycle(graph) {
  const visited = new Set();
  const recStack = new Set();

  function dfs(nodeId) {
    visited.add(nodeId);
    recStack.add(nodeId);

    const neighbors = graph.edges.filter((e) => e.from === nodeId).map((e) => e.to);
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recStack.has(neighbor)) {
        return true;
      }
    }

    recStack.delete(nodeId);
    return false;
  }

  for (const node of graph.nodes) {
    if (!visited.has(node.id)) {
      if (dfs(node.id)) return true;
    }
  }
  return false;
}

if (hasCycle(graph)) {
  issues.push('[ERROR] Dependency cycle detected in roadmap graph');
}

// Check 3: Root phases without dependencies
console.log('[drift] Checking root phases...');
const rootPhases = graph.rootPhases || [];
if (rootPhases.length === 0) {
  issues.push('[WARNING] No root phases found (all phases have dependencies)');
}

// Report
if (issues.length > 0) {
  console.log('\n[drift] Issues found:');
  for (const issue of issues) {
    console.log(issue);
  }
  // Non-fatal for now
} else {
  console.log('[drift] No drift detected.');
}

console.log('\n[drift-detector] Drift detection complete.');
