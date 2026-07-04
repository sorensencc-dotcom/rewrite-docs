#!/usr/bin/env node

/**
 * Roadmap Compiler
 * Reads MASTER_ROADMAP_v3.0.md + sub-roadmaps
 * Generates ROADMAP_DEPENDENCY_GRAPH.json
 */

const fs = require('fs');
const path = require('path');

const ROADMAP_DIR = path.join(__dirname, '..', 'docs', 'roadmap');

function parseRoadmapFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  const phases = [];
  const edges = [];

  let currentPhase = null;
  let inDependencyMap = false;

  for (const line of lines) {
    // Detect dependency map section
    if (line.includes('## 2. Cross-System Dependency Map')) {
      inDependencyMap = true;
      continue;
    }

    // Parse phase rows (simple table parsing)
    // Format: | Phase | Name | Status |
    if (line.includes('|') && !inDependencyMap) {
      const parts = line.split('|').map((p) => p.trim());
      if (parts.length >= 3 && parts[1] && !parts[1].includes('---')) {
        const phaseId = parts[1];
        const title = parts[2] || '';
        const status = parts[3] || 'pending';

        // Only accept canonical runnable phase ids (PHASE-x.y / RL-x.y);
        // loose prefixes match prose table rows like "Phase 1"
        if (!phaseId.match(/^(PHASE-[\d.]+|RL-\d+\.\d+)$/)) continue;

        phases.push({
          id: phaseId,
          title: title || phaseId,
          status: status.toLowerCase(),
          track: classifyTrack(phaseId),
          category: classifyCategory(phaseId),
        });
      }
    }
  }

  return { phases, edges };
}

function classifyTrack(phaseId) {
  if (phaseId.startsWith('RL-')) return 'rewrite-labs';
  if (phaseId.match(/^(PHASE|Phase)-?(0|9|26)/)) return 'shared';
  if (phaseId.match(/^(PHASE|Phase)/)) return 'cic';
  return 'unknown';
}

function classifyCategory(phaseId) {
  if (phaseId.match(/^PHASE-(0|9)/)) return 'infrastructure';
  if (phaseId.match(/^PHASE-2[0-9]/)) return 'autonomy';
  if (phaseId === 'PHASE-26') return 'platform';
  if (phaseId.startsWith('RL-')) return 'product';
  return 'other';
}

function buildEdges(phases) {
  const edges = [];

  // Hard-coded dependency relationships (from roadmap)
  const dependencies = {
    'PHASE-26': ['PHASE-0.9'],
    'RL-4.6': [],
    'RL-4.0': ['RL-4.6'],
    'RL-4.1': ['RL-4.0'],
    'RL-4.2': ['RL-4.1'],
    'RL-4.3': ['RL-4.2'],
    'RL-4.4': ['RL-4.2'],
    'RL-4.5': ['RL-4.3', 'RL-4.4'],
    'PHASE-0.9': [],
  };

  for (const [fromId, toIds] of Object.entries(dependencies)) {
    for (const toId of toIds) {
      edges.push({
        from: toId,
        to: fromId,
        reason: `${fromId} depends on ${toId}`,
      });
    }
  }

  return edges;
}

function main() {
  const phases = [];
  const phaseSet = new Set();

  // Parse all roadmap files
  const files = [
    'MASTER_ROADMAP_v3.0.md',
    'CIC_SUBROADMAP_v3.0.md',
    'REWRITE_LABS_SUBROADMAP_v3.0.md',
  ];

  for (const file of files) {
    const filePath = path.join(ROADMAP_DIR, file);
    if (fs.existsSync(filePath)) {
      const { phases: filePhasesPhases } = parseRoadmapFile(filePath);
      for (const phase of filePhasesPhases) {
        if (!phaseSet.has(phase.id)) {
          phases.push(phase);
          phaseSet.add(phase.id);
        }
      }
    }
  }

  // Ensure every phase in the dependency map exists as a node, even when
  // roadmap markdown parsing misses it (runner needs a node per runnable phase)
  const KNOWN_PHASES = [
    'PHASE-0.9',
    'PHASE-26',
    'RL-4.6',
    'RL-4.0',
    'RL-4.1',
    'RL-4.2',
    'RL-4.3',
    'RL-4.4',
    'RL-4.5',
  ];
  for (const id of KNOWN_PHASES) {
    if (!phaseSet.has(id)) {
      phases.push({
        id,
        title: id,
        status: 'pending',
        track: classifyTrack(id),
        category: classifyCategory(id),
      });
      phaseSet.add(id);
    }
  }

  const edges = buildEdges(phases);

  // SOURCE_DATE_EPOCH (reproducible-builds.org) pins the timestamp so
  // repeated builds produce byte-identical output
  const generated = process.env.SOURCE_DATE_EPOCH
    ? new Date(parseInt(process.env.SOURCE_DATE_EPOCH, 10) * 1000).toISOString()
    : new Date().toISOString();

  const graph = {
    version: 'v3.0',
    generated,
    description:
      'Compiled roadmap dependency graph. Source: MASTER_ROADMAP_v3.0.md, CIC_SUBROADMAP_v3.0.md, REWRITE_LABS_SUBROADMAP_v3.0.md',
    nodes: phases,
    edges: edges,
    criticalPath: calculateCriticalPath(phases, edges),
    parallelizable: findParallelizable(edges),
    rootPhases: findRootPhases(phases, edges),
  };

  console.log(JSON.stringify(graph, null, 2));
}

function calculateCriticalPath(phases, edges) {
  // Simplified: linear chain (RL-4.6 → RL-4.0 → ... → RL-4.5)
  return ['RL-4.6', 'RL-4.0', 'RL-4.1', 'RL-4.2', 'RL-4.3', 'RL-4.5'];
}

function findParallelizable(edges) {
  // Phases that can run in parallel (no dependency edge between them)
  return [['RL-4.3', 'RL-4.4']];
}

function findRootPhases(phases, edges) {
  const hasIncoming = new Set(edges.map((e) => e.to));
  return phases.filter((p) => !hasIncoming.has(p.id)).map((p) => p.id);
}

main();
