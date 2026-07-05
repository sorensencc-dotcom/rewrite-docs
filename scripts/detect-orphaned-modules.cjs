const fs = require('fs');
const path = require('path');

const ROOT_DIR = 'C:\\dev';
const SCAN_DIRS = ['src', 'cic-runtime', 'routing', 'ingestion', 'messaging', 'governance', 'harvester-bridge'];

const IGNORED_PATHS = [
  'node_modules',
  'dist',
  'build',
  'out',
  'coverage',
  'playwright-report',
  'test-results',
];

// Helper to recursively find JS/TS files
function getFiles(dir, fileList = []) {
  let files;
  try {
    files = fs.readdirSync(dir);
  } catch (err) {
    return fileList;
  }

  for (const file of files) {
    const filePath = path.join(dir, file);
    let stat;
    try {
      stat = fs.statSync(filePath);
    } catch (err) {
      continue;
    }

    if (IGNORED_PATHS.some(ignored => filePath.split(path.sep).includes(ignored))) {
      continue;
    }

    if (stat.isDirectory()) {
      getFiles(filePath, fileList);
    } else if (['.ts', '.tsx', '.js', '.jsx', '.cjs', '.mjs'].includes(path.extname(file))) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

// Find all source files
let sourceFiles = [];
SCAN_DIRS.forEach(dir => {
  const dirPath = path.join(ROOT_DIR, dir);
  if (fs.existsSync(dirPath)) {
    getFiles(dirPath, sourceFiles);
  }
});

console.log(`Scanning ${sourceFiles.length} source files for incoming imports...`);

const incomingImports = {};
sourceFiles.forEach(file => {
  incomingImports[file] = 0;
});

// Main entrypoints which are expected to have 0 incoming imports
const entryPoints = [
  path.join(ROOT_DIR, 'cic-cli.ts'),
  path.join(ROOT_DIR, 'cic-cli-governance.ts'),
  path.join(ROOT_DIR, 'cic-runtime', 'example-entrypoint.ts'),
  path.join(ROOT_DIR, 'cic-runtime', 'bootstrap-maal.ts'),
  path.join(ROOT_DIR, 'src', 'server', 'adapterGatewayAPI.ts'),
  path.join(ROOT_DIR, 'src', 'server', 'consoleAPI.ts'),
  path.join(ROOT_DIR, 'src', 'server', 'agentsAPI.ts'),
  path.join(ROOT_DIR, 'scripts', 'build-deterministic.sh')
];

sourceFiles.forEach(filePath => {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    return;
  }

  // Find imports
  const importRegex = /(?:import|from|require)\s*\(\s*['"]([^'"]+)['"]\s*\)|from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1] || match[2];
    if (!importPath) continue;

    // We only care about local imports (starting with . or @/)
    if (importPath.startsWith('.') || importPath.startsWith('@/')) {
      let resolvedPath = '';

      if (importPath.startsWith('@/')) {
        // Map '@/...' to 'src/...'
        resolvedPath = path.join(ROOT_DIR, 'src', importPath.substring(2));
      } else {
        // Relative import
        resolvedPath = path.resolve(path.dirname(filePath), importPath);
      }

      // Try extensions: .ts, .tsx, .js, .jsx, /index.ts, /index.js, etc.
      const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.js'];
      let found = false;
      for (const ext of extensions) {
        const checkPath = resolvedPath + ext;
        if (fs.existsSync(checkPath) && fs.statSync(checkPath).isFile()) {
          incomingImports[checkPath] = (incomingImports[checkPath] || 0) + 1;
          found = true;
          break;
        }
      }
    }
  }
});

// Output orphaned modules
console.log('\n--- ORPHANED MODULES (0 incoming imports) ---');
let orphanCount = 0;
Object.entries(incomingImports).forEach(([file, count]) => {
  const isEntry = entryPoints.some(ep => file.toLowerCase() === ep.toLowerCase()) || 
                  path.basename(file).includes('.test.') || 
                  path.basename(file).includes('.spec.') ||
                  file.includes('__tests__') ||
                  file.includes('tests/');

  if (count === 0 && !isEntry) {
    console.log(`  - ${path.relative(ROOT_DIR, file).replace(/\\/g, '/')}`);
    orphanCount++;
  }
});
console.log(`Total orphaned modules: ${orphanCount}`);
