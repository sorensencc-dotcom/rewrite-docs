// analyze.js - CodeFlow analyzer extracted to Node.js
// Input: repoPath (filesystem directory)
// Output: { files, edges, security, patterns, blastRadius } matching schema

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================================
// FILE SCANNER
// ============================================================================

const EXTENSIONS = [".js", ".ts", ".tsx", ".jsx", ".mjs", ".cjs"];

async function scanFiles(repoPath) {
  const files = [];
  const visited = new Set();

  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === ".git") continue;
        await walk(path.join(dir, entry.name));
      } else {
        const ext = path.extname(entry.name);
        if (EXTENSIONS.includes(ext)) {
          const fullPath = path.join(dir, entry.name);
          const relPath = path.relative(repoPath, fullPath);
          if (!visited.has(relPath)) {
            visited.add(relPath);
            try {
              const stat = await fs.stat(fullPath);
              files.push({
                path: relPath.replace(/\\/g, "/"),
                size: stat.size
              });
            } catch (e) {
              // skip unreadable files
            }
          }
        }
      }
    }
  }

  await walk(repoPath);
  return files;
}

// ============================================================================
// DEPENDENCY GRAPH BUILDER
// ============================================================================

const importRegex = /(?:^|\n)\s*(?:import|require)\s*(?:\{[^}]*\}\s*from\s*|)["']([^"']+)["']/gm;
const dynamicImportRegex = /(?:import|require)\s*\(\s*["']([^"']+)["']\s*\)/gm;

function getLineNumber(content, matchIndex) {
  let lineNum = 1;
  for (let i = 0; i < matchIndex; i++) {
    if (content[i] === '\n') lineNum++;
  }
  return lineNum;
}

function parseImports(filePath, content) {
  const imports = [];

  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  importRegex.lastIndex = 0;

  while ((match = dynamicImportRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  return imports.filter(i => !i.includes("//")); // filter out comments
}

function resolveImport(importPath, fromFile, fileMap) {
  const fromDir = path.dirname(fromFile);
  const candidates = [
    path.join(fromDir, importPath + ".js"),
    path.join(fromDir, importPath + ".ts"),
    path.join(fromDir, importPath + "/index.js"),
    path.join(fromDir, importPath + "/index.ts"),
    path.join(fromDir, importPath)
  ];

  for (const candidate of candidates) {
    if (fileMap.has(candidate)) {
      return candidate;
    }
  }

  return null;
}

async function buildDependencyGraph(repoPath, files) {
  const edges = [];
  const fileMap = new Map(files.map(f => [f.path, f]));

  for (const file of files) {
    const fullPath = path.join(repoPath, file.path);
    try {
      const content = await fs.readFile(fullPath, "utf-8");
      const imports = parseImports(file.path, content);

      for (const imp of imports) {
        const resolved = resolveImport(imp, file.path, fileMap);
        if (resolved) {
          edges.push({
            from: file.path,
            to: resolved,
            type: "import"
          });
        }
      }
    } catch (e) {
      // skip files that can't be read
    }
  }

  return edges;
}

// ============================================================================
// SECURITY SCANNER
// ============================================================================

const securityPatterns = [
  { regex: /(?:api[_-]?key|apikey|api_key)\s*[:=]\s*["']([^"']+)["']/gi, type: "hardcoded_api_key", severity: "critical" },
  { regex: /(?:password|passwd|pwd)\s*[:=]\s*["']([^"']+)["']/gi, type: "hardcoded_password", severity: "critical" },
  { regex: /(?:secret|token)\s*[:=]\s*["']([^"']{10,})["']/gi, type: "hardcoded_secret", severity: "high" },
  { regex: /eval\s*\(/gi, type: "eval_usage", severity: "high" },
  { regex: /Function\s*\(/gi, type: "function_constructor", severity: "high" },
  { regex: /exec\s*\(/gi, type: "exec_usage", severity: "high" },
  { regex: /child_process/gi, type: "child_process", severity: "medium" },
  { regex: /select\s+\*\s+from/gi, type: "sql_injection_risk", severity: "high" },
  { regex: /where\s+1\s*=\s*1/gi, type: "sql_injection_risk", severity: "high" },
  { regex: /TODO|FIXME|HACK|XXX/g, type: "code_smell", severity: "low" }
];

async function scanSecurity(repoPath, files) {
  const findings = [];
  let findingId = 0;

  for (const file of files) {
    const fullPath = path.join(repoPath, file.path);
    try {
      const content = await fs.readFile(fullPath, "utf-8");

      for (const pattern of securityPatterns) {
        let match;
        while ((match = pattern.regex.exec(content)) !== null) {
          const lineNum = getLineNumber(content, match.index);
          findings.push({
            file: file.path,
            line: lineNum,
            type: pattern.type,
            severity: pattern.severity
          });
          findingId++;
        }
        pattern.regex.lastIndex = 0;
      }
    } catch (e) {
      // skip files that can't be read
    }
  }

  // deduplicate by file + line + type
  const dedup = new Map();
  for (const f of findings) {
    const key = `${f.file}:${f.line}:${f.type}`;
    if (!dedup.has(key)) {
      dedup.set(key, f);
    }
  }

  return Array.from(dedup.values());
}

// ============================================================================
// PATTERN DETECTOR
// ============================================================================

const patterns = [
  { regex: /(?:const|class|function)\s+\w+.*{[^}]*static\s+instance[^}]*static\s+getInstance/s, type: "singleton" },
  { regex: /(?:const|function)\s+\w+Factory\s*\(/g, type: "factory" },
  { regex: /Object\.assign|Object\.create|Object\.defineProperty/g, type: "object_manipulation" },
  { regex: /addEventListener|on\w+\s*=/g, type: "event_listener" },
  { regex: /useEffect|useState|useReducer|useContext/g, type: "react_hooks" },
  { regex: /async\s+function|async\s*\w+\s*=/g, type: "async_function" },
  { regex: /Promise\.all|Promise\.race|Promise\.any/g, type: "promise_concurrency" },
  { regex: /try\s*{[^}]*catch|try\s*{[^}]*finally/s, type: "error_handling" }
];

async function detectPatterns(repoPath, files) {
  const patternHits = [];

  for (const file of files) {
    const fullPath = path.join(repoPath, file.path);
    try {
      const content = await fs.readFile(fullPath, "utf-8");

      for (const pattern of patterns) {
        let match;
        while ((match = pattern.regex.exec(content)) !== null) {
          const lineNum = getLineNumber(content, match.index);
          patternHits.push({
            file: file.path,
            line: lineNum,
            type: pattern.type
          });
        }
        pattern.regex.lastIndex = 0;
      }
    } catch (e) {
      // skip files that can't be read
    }
  }

  // deduplicate
  const dedup = new Map();
  for (const p of patternHits) {
    const key = `${p.file}:${p.line}:${p.type}`;
    if (!dedup.has(key)) {
      dedup.set(key, p);
    }
  }

  return Array.from(dedup.values());
}

// ============================================================================
// BLAST RADIUS CALCULATOR
// ============================================================================

function computeBlastRadius(edges) {
  const blastRadius = [];
  const dependsOnMap = new Map();

  // Build reverse dependency map (what depends on each file)
  for (const edge of edges) {
    if (!dependsOnMap.has(edge.to)) {
      dependsOnMap.set(edge.to, []);
    }
    dependsOnMap.get(edge.to).push(edge.from);
  }

  // For each file, compute transitive dependents
  const visited = new Set();

  function getAffected(file, memo = new Set()) {
    if (memo.has(file)) return [];
    memo.add(file);

    const direct = dependsOnMap.get(file) || [];
    const transitive = new Set(direct);

    for (const dep of direct) {
      getAffected(dep, memo).forEach(t => transitive.add(t));
    }

    return Array.from(transitive);
  }

  for (const file of new Set(edges.map(e => e.to))) {
    const affected = getAffected(file);
    if (affected.length > 0) {
      blastRadius.push({
        file,
        affected
      });
    }
  }

  return blastRadius;
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

export async function analyzeRepo(repoPath) {
  console.log(`Analyzing ${repoPath}...`);

  const files = await scanFiles(repoPath);
  console.log(`Found ${files.length} files`);

  const edges = await buildDependencyGraph(repoPath, files);
  console.log(`Built dependency graph: ${edges.length} edges`);

  const security = await scanSecurity(repoPath, files);
  console.log(`Found ${security.length} security findings`);

  const patternHits = await detectPatterns(repoPath, files);
  console.log(`Detected ${patternHits.length} pattern hits`);

  const blastRadius = computeBlastRadius(edges);
  console.log(`Computed blast radius: ${blastRadius.length} files analyzed`);

  return {
    files,
    edges,
    security,
    patterns: patternHits,
    blastRadius
  };
}
