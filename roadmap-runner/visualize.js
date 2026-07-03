#!/usr/bin/env node
/**
 * Roadmap Runner Phase Visualizer
 * Generates an HTML timeline of all phases in roadmap-runner/phases/.
 */

const fs = require("fs");
const path = require("path");

const PHASE_DIR = path.join(__dirname, "phases");
const OUT = path.join(__dirname, "phase-timeline.html");

function loadPhases() {
  if (!fs.existsSync(PHASE_DIR)) {
    console.warn("phases/ directory not found");
    return [];
  }

  const files = fs.readdirSync(PHASE_DIR).filter(f => f.endsWith(".json") || f.endsWith(".yaml"));
  return files.map(f => {
    const full = path.join(PHASE_DIR, f);
    const raw = fs.readFileSync(full, "utf8");
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      // Try YAML if JSON fails
      return { file: f, name: f.replace(/\.(json|yaml)/, ""), priority: 999, deps: [] };
    }
    return {
      file: f,
      name: data.name || data.phase || f.replace(/\.(json|yaml)/, ""),
      priority: data.priority || 999,
      deps: data.dependencies || data.deps || []
    };
  });
}

function generateHTML(phases) {
  const sorted = phases.sort((a, b) => a.priority - b.priority);
  const rows = sorted
    .map(p => `
      <tr>
        <td class="priority">${p.priority}</td>
        <td class="name">${escapeHtml(p.name)}</td>
        <td class="deps">${p.deps.length > 0 ? p.deps.map(d => escapeHtml(d)).join(", ") : "—"}</td>
        <td class="file">${escapeHtml(p.file)}</td>
      </tr>
    `)
    .join("");

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>CIC + Rewrite Labs — Phase Timeline</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: 'Courier New', monospace;
        background: #0a0a0a;
        color: #00ff88;
        padding: 20px;
        line-height: 1.6;
      }
      h1 { margin-bottom: 20px; font-size: 24px; }
      table {
        width: 100%;
        border-collapse: collapse;
        background: #111;
        border: 1px solid #00ff88;
      }
      th {
        background: #000;
        border: 1px solid #00ff88;
        padding: 12px;
        text-align: left;
        font-weight: bold;
      }
      td {
        border: 1px solid #00ff88;
        padding: 10px 12px;
      }
      tr:nth-child(even) { background: #0d0d0d; }
      tr:hover { background: #1a1a1a; }
      .priority { text-align: center; width: 80px; }
      .file { color: #0088ff; font-size: 12px; }
      .deps { color: #ffaa00; }
    </style>
  </head>
  <body>
    <h1>Phase Timeline — CIC + Rewrite Labs</h1>
    <table>
      <thead>
        <tr>
          <th>Priority</th>
          <th>Phase Name</th>
          <th>Dependencies</th>
          <th>Config File</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </body>
</html>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function main() {
  const phases = loadPhases();
  const html = generateHTML(phases);
  fs.writeFileSync(OUT, html);
  console.log(`✔ Phase timeline generated: ${OUT}`);
  console.log(`  Phases: ${phases.length}`);
}

main();
