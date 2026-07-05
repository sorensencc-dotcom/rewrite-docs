const fs = require('fs');
const path = require('path');

const ROOT_DIR = 'C:\\dev';
const data = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'repo-hygiene-scan-temp.json'), 'utf8'));

console.log('--- HYGIENE SCAN SUMMARY ---');

// 1. Dependency Audit Summary
console.log(`\nUnused Dependencies: ${data.dependencyAudit.length}`);
const depByProject = {};
data.dependencyAudit.forEach(d => {
  if (!depByProject[d.project]) depByProject[d.project] = [];
  depByProject[d.project].push(d.dependency);
});
console.log('Top 10 projects with unused dependencies:');
Object.entries(depByProject)
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 10)
  .forEach(([project, deps]) => {
    console.log(`  - ${project}: ${deps.length} unused deps (${deps.slice(0, 5).join(', ')}${deps.length > 5 ? '...' : ''})`);
  });

// 2. Duplicate Scripts Summary
console.log(`\nRedundant/Duplicate Scripts: ${data.duplicateScripts.length}`);
data.duplicateScripts.slice(0, 10).forEach(d => {
  console.log(`  - Command: "${d.command}"`);
  console.log(`    Instances: ${d.instances.join(', ')}`);
});

// 3. Naming Violations Summary
console.log(`\nNaming Violations: ${data.namingViolations.length}`);
const namingByCat = {};
data.namingViolations.forEach(n => {
  if (!namingByCat[n.category]) namingByCat[n.category] = 0;
  namingByCat[n.category]++;
});
Object.entries(namingByCat).forEach(([cat, count]) => {
  console.log(`  - ${cat}: ${count}`);
});
console.log('Sample violations:');
data.namingViolations.slice(0, 5).forEach(n => {
  console.log(`  - ${n.filePath}: ${n.description}`);
});

// 4. Missing READMEs
console.log(`\nMissing READMEs: ${data.missingReadmes.length}`);
data.missingReadmes.forEach(m => {
  console.log(`  - ${m.modulePath}`);
});

// 5. Missing tsconfigs
console.log(`\nMissing tsconfig.json: ${data.missingTsconfigs.length}`);
data.missingTsconfigs.forEach(m => {
  console.log(`  - ${m.projectPath}`);
});

// 6. Duplicate Scripts/Utilities files
console.log(`\nDuplicate Utilities (identical file hashes): ${data.duplicateScriptsReport.length}`);
// Group by fileName
const dupGroups = {};
data.duplicateScriptsReport.forEach(d => {
  if (!dupGroups[d.fileName]) dupGroups[d.fileName] = [];
  dupGroups[d.fileName].push(d.paths);
});
Object.entries(dupGroups).slice(0, 15).forEach(([fileName, pathsList]) => {
  console.log(`  - File: ${fileName}`);
  pathsList.forEach(paths => {
    console.log(`    Locations: ${paths.join(', ')}`);
  });
});
