// PASTE THIS AT TOP OF main() IN scheduler.js
// ============================================

const manifestPath = path.join(__dirname, '..', 'TheFoundry', 'out', 'manifest.json');

let manifest;
try {
  const content = fs.readFileSync(manifestPath, 'utf8');
  manifest = JSON.parse(content);
} catch (e) {
  console.error(`[ERROR] TheFoundry manifest missing: ${e.message}`);
  console.error(`[ERROR] Run: cd TheFoundry && make build`);
  process.exit(1);
}

// Check manifest is valid
if (!manifest.version || !manifest.generated_at) {
  console.error('[ERROR] TheFoundry manifest is invalid');
  process.exit(1);
}

// Check manifest is fresh (< 1 hour old)
const manifestAge = Date.now() - new Date(manifest.generated_at).getTime();
const maxAge = 60 * 60 * 1000; // 1 hour

if (manifestAge > maxAge) {
  console.error(
    `[ERROR] TheFoundry manifest is stale (${(manifestAge / 60000).toFixed(0)} minutes old)`
  );
  console.error('[ERROR] Run: cd TheFoundry && make build');
  process.exit(1);
}

console.log(`[OK] TheFoundry manifest valid | generated ${new Date(manifest.generated_at).toISOString()}`);
console.log(`[OK] Dependency graph: ${manifest.graph_nodes_count} nodes, ${manifest.graph_edges_count} edges`);

// ============================================
// END PASTE
