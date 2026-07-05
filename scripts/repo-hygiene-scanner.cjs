const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT_DIR = 'C:\\dev';

// Exclude these directories completely from scanning
const IGNORED_PATHS = [
  'node_modules',
  '.git',
  '.venv',
  'venv',
  'dist',
  'build',
  'out',
  '.next',
  'coverage',
  'playwright-report',
  'test-results',
  '.claude/worktrees',
  '.ijfw',
];

// Helper to recursively find files
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
      continue; // Skip broken symlinks or permission errors
    }

    const relPath = path.relative(ROOT_DIR, filePath);
    
    // Check if path matches any ignored directory
    if (IGNORED_PATHS.some(ignored => relPath.split(path.sep).includes(ignored))) {
      continue;
    }

    if (stat.isDirectory()) {
      getFiles(filePath, fileList);
    } else {
      fileList.push({
        fullPath: filePath,
        relPath: relPath.replace(/\\/g, '/'),
        name: file,
        ext: path.extname(file),
        size: stat.size,
        mtime: stat.mtime
      });
    }
  }
  return fileList;
}

console.log('Gathering files...');
const allFiles = getFiles(ROOT_DIR);
console.log(`Found ${allFiles.length} files to scan (excluding ignored paths).`);

// 1. Dependency Analysis (package.json)
console.log('\n--- 1. Analyzing package.json files ---');
const packageJsonFiles = allFiles.filter(f => f.name === 'package.json');
console.log(`Found ${packageJsonFiles.length} package.json files.`);

const dependencyAudit = [];
const scriptAudit = [];

packageJsonFiles.forEach(pj => {
  let content;
  try {
    content = JSON.parse(fs.readFileSync(pj.fullPath, 'utf8'));
  } catch (err) {
    console.error(`Error parsing ${pj.relPath}:`, err.message);
    return;
  }

  const projectDir = path.dirname(pj.fullPath);
  const relProjectDir = path.dirname(pj.relPath);

  // 1a. Dependencies usage check
  const deps = Object.keys(content.dependencies || {});
  const devDeps = Object.keys(content.devDependencies || {});
  const allDeps = [...deps, ...devDeps];

  if (allDeps.length > 0) {
    // Find all js/ts files in this project directory
    const projectFiles = allFiles.filter(f => 
      f.fullPath.startsWith(projectDir) && 
      ['.ts', '.tsx', '.js', '.jsx', '.cjs', '.mjs'].includes(f.ext)
    );

    // Read files content to check imports
    const fileContents = projectFiles.map(f => {
      try {
        return fs.readFileSync(f.fullPath, 'utf8');
      } catch (err) {
        return '';
      }
    }).join('\n');

    allDeps.forEach(dep => {
      // Simple regex check for imports/requires of this package
      // Escape for regex (e.g. @types/node, lodash, etc.)
      const escapedDep = dep.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const importRegex = new RegExp(`(from\\s+['"]${escapedDep}['"]|require\\s*\\(\\s*['"]${escapedDep}['"]\\))`, 'i');
      
      const isUsed = importRegex.test(fileContents);
      
      // If it's a type package (@types/*), check if the base package is used, or tsconfig includes it
      let isTypeUsed = false;
      if (dep.startsWith('@types/')) {
        const baseDep = dep.substring(7);
        const baseEscaped = baseDep.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const baseImportRegex = new RegExp(`(from\\s+['"]${baseEscaped}['"]|require\\s*\\(\\s*['"]${baseEscaped}['"]\\))`, 'i');
        isTypeUsed = baseImportRegex.test(fileContents) || baseDep === 'node' || baseDep === 'jest';
      }

      if (!isUsed && !isTypeUsed) {
        dependencyAudit.push({
          project: relProjectDir || 'root',
          packageJson: pj.relPath,
          dependency: dep,
          type: deps.includes(dep) ? 'prod' : 'dev'
        });
      }
    });
  }

  // 1b. Redundant scripts check
  const scripts = content.scripts || {};
  Object.entries(scripts).forEach(([name, cmd]) => {
    scriptAudit.push({
      project: relProjectDir || 'root',
      packageJson: pj.relPath,
      name,
      command: cmd
    });
  });
});

console.log(`Unused dependency hits: ${dependencyAudit.length}`);

// Find duplicate scripts across all package.json files
const duplicateScripts = [];
const scriptCommandMap = {};
scriptAudit.forEach(s => {
  if (!scriptCommandMap[s.command]) {
    scriptCommandMap[s.command] = [];
  }
  scriptCommandMap[s.command].push(s);
});

Object.entries(scriptCommandMap).forEach(([cmd, instances]) => {
  if (instances.length > 1) {
    duplicateScripts.push({
      command: cmd,
      instances: instances.map(i => `${i.project} -> ${i.name}`)
    });
  }
});
console.log(`Redundant/duplicate scripts found: ${duplicateScripts.length}`);


// 2. Naming Conventions Validation
console.log('\n--- 2. Checking Naming Conventions ---');
const namingViolations = [];

// Rule: docs/ markdown files must be lowercase-with-hyphens.md
const docFiles = allFiles.filter(f => f.relPath.startsWith('docs/') && f.ext === '.md');
docFiles.forEach(f => {
  const baseName = path.basename(f.name, '.md');
  // Check if it has uppercase letters or underscores (CLAUDE.md and README.md are exceptions)
  if (baseName !== 'CLAUDE' && baseName !== 'README' && (/[A-Z]/.test(baseName) || baseName.includes('_'))) {
    namingViolations.push({
      filePath: f.relPath,
      category: 'Documentation naming',
      description: `File '${f.name}' violates 'lowercase-with-hyphens.md' convention.`,
      severity: 'Low'
    });
  }
});

// Rule: toolforge/skills/{skill-name} must be kebab-case
const skillDirRegex = /^toolforge\/skills\/([^/]+)/;
const processedSkills = new Set();
allFiles.forEach(f => {
  const match = f.relPath.match(skillDirRegex);
  if (match) {
    const skillName = match[1];
    if (!processedSkills.has(skillName)) {
      processedSkills.add(skillName);
      if (/[A-Z_]/.test(skillName) || skillName === '_TEMPLATE') {
        if (skillName !== '_TEMPLATE') {
          namingViolations.push({
            filePath: `toolforge/skills/${skillName}`,
            category: 'Skill directory naming',
            description: `Skill directory '${skillName}' should be in kebab-case (e.g. run-cic-phase).`,
            severity: 'Medium'
          });
        }
      }
    }
  }
});
console.log(`Naming convention violations: ${namingViolations.length}`);


// 3. Missing README.md in Module Directories
console.log('\n--- 3. Checking Missing READMEs ---');
const missingReadmes = [];
const moduleDirs = [
  'services',
  'toolforge/skills',
  'rewrite-mcp/apps',
  'rewrite-mcp/packages',
  'rewrite-mcp/projects',
];

moduleDirs.forEach(parentDir => {
  const fullParentPath = path.join(ROOT_DIR, parentDir);
  if (!fs.existsSync(fullParentPath)) return;

  let children;
  try {
    children = fs.readdirSync(fullParentPath);
  } catch (err) {
    return;
  }

  children.forEach(child => {
    const childPath = path.join(fullParentPath, child);
    if (fs.statSync(childPath).isDirectory()) {
      if (child.startsWith('.') || child === 'node_modules' || child === '_TEMPLATE') return;

      const readmePath = path.join(childPath, 'README.md');
      if (!fs.existsSync(readmePath)) {
        missingReadmes.push({
          modulePath: path.relative(ROOT_DIR, childPath).replace(/\\/g, '/'),
          description: `Directory is missing a README.md file.`
        });
      }
    }
  });
});
console.log(`Missing READMEs: ${missingReadmes.length}`);


// 4. Missing tsconfig.json or references
console.log('\n--- 4. Checking tsconfig files ---');
const missingTsconfigs = [];

// TS source folders should have tsconfig.json
const sourceDirsWithTS = new Set();
allFiles.forEach(f => {
  if (['.ts', '.tsx'].includes(f.ext)) {
    // Determine the logical module folder
    const parts = f.relPath.split('/');
    if (parts.length > 1) {
      // Find where tsconfig should live
      let projectPathParts = [];
      if (parts[0] === 'services' || parts[0] === 'apps' || parts[0] === 'packages' || parts[0] === 'projects') {
        projectPathParts = [parts[0], parts[1]];
      } else if (parts[0] === 'rewrite-mcp' && ['apps', 'packages', 'projects'].includes(parts[1])) {
        projectPathParts = ['rewrite-mcp', parts[1], parts[2]];
      } else {
        projectPathParts = [parts[0]];
      }
      
      const projectPath = projectPathParts.join('/');
      sourceDirsWithTS.add(projectPath);
    }
  }
});

sourceDirsWithTS.forEach(projectPath => {
  if (projectPath === 'node_modules' || projectPath.startsWith('_') || projectPath.startsWith('.')) return;

  const fullPath = path.join(ROOT_DIR, projectPath);
  const tsconfigPath = path.join(fullPath, 'tsconfig.json');
  
  if (!fs.existsSync(tsconfigPath)) {
    missingTsconfigs.push({
      projectPath,
      description: `Project directory contains TS files but is missing a tsconfig.json.`
    });
  }
});
console.log(`Projects with missing tsconfig.json: ${missingTsconfigs.length}`);


// 5. Duplicated Utilities or Logic
console.log('\n--- 5. Detecting Duplicated Scripts/Utilities ---');
const duplicateScriptsReport = [];
const scriptHashMap = {};

// Filter scripts in scripts/ or other utility directories
const scriptsFiles = allFiles.filter(f => 
  ['.js', '.ts', '.py', '.sh', '.ps1'].includes(f.ext) &&
  (f.relPath.includes('/scripts/') || f.relPath.startsWith('scripts/') || f.name.includes('utils') || f.name.includes('review') || f.name.includes('docs'))
);

scriptsFiles.forEach(f => {
  let content;
  try {
    content = fs.readFileSync(f.fullPath, 'utf8').trim().replace(/\r\n/g, '\n');
  } catch (err) {
    return;
  }
  
  if (content.length < 100) return; // Skip trivial/empty scripts

  const hash = crypto.createHash('md5').update(content).digest('hex');
  if (!scriptHashMap[hash]) {
    scriptHashMap[hash] = [];
  }
  scriptHashMap[hash].push(f.relPath);
});

Object.entries(scriptHashMap).forEach(([hash, paths]) => {
  if (paths.length > 1) {
    duplicateScriptsReport.push({
      hash,
      paths,
      fileName: path.basename(paths[0])
    });
  }
});
console.log(`Identical duplicate files groups: ${duplicateScriptsReport.length}`);


// Write temporary results to a JSON file for analysis
const reportData = {
  dependencyAudit,
  duplicateScripts,
  namingViolations,
  missingReadmes,
  missingTsconfigs,
  duplicateScriptsReport
};

fs.writeFileSync(
  path.join(ROOT_DIR, 'repo-hygiene-scan-temp.json'),
  JSON.stringify(reportData, null, 2),
  'utf8'
);
console.log('\nSuccessfully saved temporary hygiene data to repo-hygiene-scan-temp.json');
