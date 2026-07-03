#!/usr/bin/env node

/**
 * Agent Definition Scanner
 * Scans 5 projects for agent definitions (classes, interfaces, types)
 * Outputs structured registry JSON
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECTS = {
  cic: '/app/cic',
  'rewrite-labs': '/app/rewrite-mcp',
  'ai-os': '/app/rewrite-mcp/ai-os',
  harvester: '/app/cic-ingestion',
  'torque-query': '/app/services/torquequery',
};

const PATTERNS = [
  /export\s+class\s+(\w+Agent)\s*[{<]/g,
  /export\s+interface\s+(\w+Agent)[^{]*{/g,
  /export\s+type\s+(\w+Agent)\s*=/g,
  /export\s+const\s+(\w+Agent):/g,
  /agentDefinitions?\s*[:=]\s*{[^}]*}/g,
];

function scanDir(dir, maxDepth = 3) {
  const agents = [];

  if (!fs.existsSync(dir)) return agents;

  function walk(curr, depth = 0) {
    if (depth > maxDepth) return;

    try {
      const entries = fs.readdirSync(curr, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (['node_modules', '.git', 'dist', 'build', '.claude'].includes(entry.name)) continue;
          walk(path.join(curr, entry.name), depth + 1);
        } else if (entry.isFile() && /\.(ts|js)$/.test(entry.name)) {
          try {
            const content = fs.readFileSync(path.join(curr, entry.name), 'utf8');
            const matches = new Set();

            PATTERNS.forEach(pattern => {
              let match;
              while ((match = pattern.exec(content)) !== null) {
                matches.add(match[1] || match[0]);
              }
            });

            matches.forEach(agent => {
              agents.push({
                name: agent,
                file: path.relative(dir, path.join(curr, entry.name)),
              });
            });
          } catch (e) {
            // Skip read errors
          }
        }
      }
    } catch (e) {
      // Skip dir errors
    }
  }

  walk(dir);
  return agents;
}

const registry = {};

Object.entries(PROJECTS).forEach(([projectName, projectPath]) => {
  console.error(`Scanning ${projectName}...`);
  const agents = scanDir(projectPath);
  registry[projectName] = {
    path: projectPath,
    agents: agents.reduce((acc, agent) => {
      const key = agent.name;
      if (!acc[key]) {
        acc[key] = { files: [] };
      }
      acc[key].files.push(agent.file);
      return acc;
    }, {}),
    count: Object.keys(agents.reduce((acc, a) => ({ ...acc, [a.name]: true }), {})).length,
  };
});

console.log(JSON.stringify(registry, null, 2));
