#!/usr/bin/env node

/**
 * Unified Roadmap Execution Graph Generator
 * Parses CIC + RL roadmaps, builds dependency graph, exports JSON + DOT + visualizer
 */

const fs = require('fs');
const path = require('path');

/**
 * Parse markdown tables into array of objects.
 * Assumes: | Header1 | Header2 | Header3 |
 *          |---------|---------|---------|
 *          | row1-1  | row1-2  | row1-3  |
 */
function parseMarkdownTable(content) {
  const lines = content.split('\n');
  let tableStart = -1;
  let headers = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('|') && line.endsWith('|')) {
      // Extract headers
      if (tableStart === -1) {
        const headerLine = lines[i];
        const sepLine = lines[i + 1];
        if (sepLine && sepLine.includes('---')) {
          headers = headerLine
            .split('|')
            .map((h) => h.trim())
            .filter((h) => h);
          tableStart = i + 2;
          break;
        }
      }
    }
  }

  if (tableStart === -1 || headers.length === 0) {
    return [];
  }

  const rows = [];
  for (let i = tableStart; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('|') || !line.endsWith('|')) break;
    const cells = line
      .split('|')
      .map((c) => c.trim())
      .filter((c) => c);
    if (cells.length === headers.length) {
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = cells[idx];
      });
      rows.push(row);
    }
  }

  return rows;
}

/**
 * Extract CIC phase ID from phase column (e.g., "0.9 M3" -> "PHASE-0.9-M3")
 */
function normalizeCicPhaseId(phase) {
  return phase
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9.-]/g, '');
}

/**
 * Extract RL phase ID from phase column (e.g., "RL-4.0" -> "RL-4.0")
 */
function normalizeRlPhaseId(phase) {
  return phase.trim();
}

/**
 * Build nodes from CIC roadmap.
 */
function extractCicNodes(cicContent) {
  const nodes = [];
  const tableRows = parseMarkdownTable(cicContent);

  for (const row of tableRows) {
    const phase = row['Phase'] || row['phase'];
    if (!phase) continue;

    const id = normalizeCicPhaseId(phase);
    const title = row['Title'] || row['title'] || '';
    const status = row['Status'] || row['status'] || '';

    nodes.push({
      id,
      type: 'cic',
      phase,
      title,
      status,
      srcFile: 'CIC Roadmap',
    });
  }

  return nodes;
}

/**
 * Build nodes from RL roadmap mapping.
 */
function extractRlNodes(unifiedContent) {
  const nodes = [];
  const tableRows = parseMarkdownTable(unifiedContent);

  for (const row of tableRows) {
    const rlPhase = row['RL Phase'] || row['RL phase'];
    if (!rlPhase) continue;

    const id = normalizeRlPhaseId(rlPhase);
    const deliverable = row['RL Deliverable'] || row['RL deliverable'] || '';
    const cicAligned = row['Aligned CIC Phase/Subsystem'] || row['Aligned CIC Phase/Subsystem'] || '';

    nodes.push({
      id,
      type: 'rl',
      phase: rlPhase,
      deliverable,
      alignedCic: cicAligned,
      srcFile: 'Unified Roadmap',
    });
  }

  return nodes;
}

/**
 * Build edges from RL-to-CIC alignment.
 */
function extractEdges(unifiedContent) {
  const edges = [];
  const tableRows = parseMarkdownTable(unifiedContent);

  for (const row of tableRows) {
    const rlPhase = row['RL Phase'] || row['RL phase'];
    const cicPhase = row['Aligned CIC Phase/Subsystem'] || row['Aligned CIC Phase/Subsystem'] || '';

    if (rlPhase && cicPhase) {
      const rlId = normalizeRlPhaseId(rlPhase);
      // Extract first CIC phase reference (might be "Phase 23" or "Phase 26 (TorqueQuery...)")
      const match = cicPhase.match(/Phase\s+([\d.]+)/);
      if (match) {
        const cicId = `PHASE-${match[1]}`;
        edges.push({
          from: cicId,
          to: rlId,
          label: 'feeds',
        });
      }
    }
  }

  return edges;
}

/**
 * Generate JSON graph.
 */
function generateJsonGraph(cicContent, rlContent, unifiedContent) {
  const cicNodes = extractCicNodes(cicContent);
  const rlNodes = extractRlNodes(unifiedContent);
  const edges = extractEdges(unifiedContent);

  return {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    nodes: [...cicNodes, ...rlNodes],
    edges,
  };
}

/**
 * Generate DOT format for Graphviz.
 */
function generateDotGraph(graph) {
  let dot = 'digraph unified_roadmap {\n';
  dot += '  rankdir=LR;\n';
  dot += '  node [shape=box];\n';

  const cicColor = '#e1f5ff';
  const rlColor = '#f3e5f5';

  // Nodes
  for (const node of graph.nodes) {
    const color = node.type === 'cic' ? cicColor : rlColor;
    const label = `${node.id}\\n${node.title || node.deliverable}`;
    dot += `  "${node.id}" [label="${label}", fillcolor="${color}", style=filled];\n`;
  }

  // Edges
  for (const edge of graph.edges) {
    dot += `  "${edge.from}" -> "${edge.to}" [label="${edge.label}"];\n`;
  }

  dot += '}\n';
  return dot;
}

/**
 * Generate HTML visualizer (renders the graph as a table + legend).
 */
function generateHtmlVisualizer(graph) {
  const cicNodes = graph.nodes.filter((n) => n.type === 'cic');
  const rlNodes = graph.nodes.filter((n) => n.type === 'rl');

  const cicTableRows = cicNodes
    .map(
      (n) =>
        `<tr><td>${n.id}</td><td>${n.title}</td><td>${n.status}</td></tr>`
    )
    .join('\n    ');

  const rlTableRows = rlNodes
    .map(
      (n) =>
        `<tr><td>${n.id}</td><td>${n.deliverable}</td><td>${n.alignedCic}</td></tr>`
    )
    .join('\n    ');

  const edgeRows = graph.edges
    .map((e) => `<tr><td>${e.from}</td><td>${e.label}</td><td>${e.to}</td></tr>`)
    .join('\n    ');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unified Execution Graph</title>
  <style>
    body { font-family: sans-serif; margin: 20px; background: #f5f5f5; }
    h1, h2 { color: #333; }
    table { border-collapse: collapse; background: white; margin: 20px 0; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background: #1976d2; color: white; }
    tr:nth-child(even) { background: #f9f9f9; }
    .cic-box { background: #e1f5ff; padding: 10px; margin: 10px 0; border-left: 4px solid #1976d2; }
    .rl-box { background: #f3e5f5; padding: 10px; margin: 10px 0; border-left: 4px solid #7b1fa2; }
    .meta { color: #666; font-size: 0.9em; margin: 10px 0; }
  </style>
</head>
<body>
  <h1>Unified Roadmap Execution Graph</h1>
  <div class="meta">Generated: ${new Date().toISOString()}</div>
  <p>
    <span class="cic-box" style="display:inline-block;width:auto;">CIC Phases</span>
    <span class="rl-box" style="display:inline-block;width:auto;">Rewrite Labs Phases</span>
  </p>

  <h2>CIC Phases (${cicNodes.length})</h2>
  <table>
    <tr><th>ID</th><th>Title</th><th>Status</th></tr>
    ${cicTableRows}
  </table>

  <h2>Rewrite Labs Phases (${rlNodes.length})</h2>
  <table>
    <tr><th>ID</th><th>Deliverable</th><th>Aligned CIC Phase</th></tr>
    ${rlTableRows}
  </table>

  <h2>Dependencies (${graph.edges.length})</h2>
  <table>
    <tr><th>From</th><th>Relation</th><th>To</th></tr>
    ${edgeRows}
  </table>

  <h2>Export Formats</h2>
  <ul>
    <li><a href="execution-graph.json">execution-graph.json</a> (JSON)</li>
    <li><a href="execution-graph.dot">execution-graph.dot</a> (Graphviz DOT)</li>
  </ul>
  <p><small>To visualize the DOT file: <code>dot -Tsvg execution-graph.dot -o graph.svg</code></small></p>
</body>
</html>`;

  return html;
}

/**
 * Main: read roadmap files, generate outputs.
 */
async function main() {
  const docsDir = path.join(__dirname, '..', 'docs', 'roadmaps');
  const outDir = path.join(__dirname);

  const cicPath = path.join(docsDir, 'cic-roadmap.md');
  const rlPath = path.join(docsDir, 'rewrite-labs-roadmap.md');
  const unifiedPath = path.join(docsDir, 'unified-roadmap.md');

  // Read files
  let cicContent, rlContent, unifiedContent;
  try {
    cicContent = fs.readFileSync(cicPath, 'utf8');
    rlContent = fs.readFileSync(rlPath, 'utf8');
    unifiedContent = fs.readFileSync(unifiedPath, 'utf8');
  } catch (e) {
    console.error(`Error reading roadmap files: ${e.message}`);
    process.exit(1);
  }

  // Generate graph
  const graph = generateJsonGraph(cicContent, rlContent, unifiedContent);

  // Write outputs
  try {
    fs.mkdirSync(outDir, { recursive: true });

    fs.writeFileSync(
      path.join(outDir, 'execution-graph.json'),
      JSON.stringify(graph, null, 2),
      'utf8'
    );
    console.log(`✓ execution-graph.json (${graph.nodes.length} nodes, ${graph.edges.length} edges)`);

    const dotGraph = generateDotGraph(graph);
    fs.writeFileSync(path.join(outDir, 'execution-graph.dot'), dotGraph, 'utf8');
    console.log('✓ execution-graph.dot');

    const html = generateHtmlVisualizer(graph);
    fs.writeFileSync(path.join(outDir, 'visualizer', 'index.html'), html, 'utf8');
    console.log('✓ visualizer/index.html');
  } catch (e) {
    console.error(`Error writing outputs: ${e.message}`);
    process.exit(1);
  }

  console.log(`\n[OK] Execution graph generated: ${outDir}`);
}

if (require.main === module) {
  main().catch((e) => {
    console.error(`[FATAL] ${e.message}`);
    process.exit(1);
  });
}

module.exports = { generateJsonGraph, generateDotGraph, generateHtmlVisualizer };
