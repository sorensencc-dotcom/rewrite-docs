/**
 * Jest Global Setup
 * Starts the unified-api server before running tests
 */

const { spawn } = require('child_process');

module.exports = async () => {
  console.log('Building TypeScript...');

  // Build TypeScript first using tsc directly
  await new Promise((resolve, reject) => {
    const tscPath = require.resolve('typescript/bin/tsc');
    const build = spawn(process.execPath, [tscPath], {
      stdio: 'pipe',
      cwd: process.cwd(),
    });

    build.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Build failed with code ${code}`));
      } else {
        resolve(null);
      }
    });

    build.on('error', (err) => {
      reject(new Error(`Build error: ${err.message}`));
    });
  });

  console.log('Starting Unified API server for tests...');

  return new Promise((resolve, reject) => {
    const serverProcess = spawn('node', ['dist/server.js'], {
      cwd: process.cwd(),
      stdio: 'pipe',
      env: {
        ...process.env,
        NODE_ENV: 'test',
        UNIFIED_API_PORT: '3100',
        TORQUEQUERY_URL: 'http://torquequery:3110',
        VAULT_URL: 'http://vault:3111',
        REPOMIX_URL: 'http://repomix-ingestion:3112',
        GOVERNANCE_URL: 'http://cic-governance:3113',
        PLANNING_ENGINE_URL: 'http://planning-engine:3114',
        HARVESTER_V2_URL: 'http://harvester-v2:3115',
        PLANNING_CONSOLE_URL: 'http://planning-console:3000',
      }
    });

    let output = '';
    serverProcess.stdout?.on('data', (data) => {
      output += data.toString();
      console.log('[Server]', data.toString().trim());
      if (output.includes('listening on port')) {
        // Smoke test: health check before tests start
        const http = require('http');
        http.get('http://localhost:3100/health', (res) => {
          if (res.statusCode === 200) {
            console.log('[Smoke Test] ✓ Server healthy');
            resolve();
          } else {
            reject(new Error(`Health check failed: ${res.statusCode}`));
          }
        }).on('error', (err) => {
          reject(new Error(`Health check failed: ${err.message}`));
        });
      }
    });

    serverProcess.stderr?.on('data', (data) => {
      console.error('[Server Error]', data.toString());
    });

    serverProcess.on('error', (err) => {
      console.error('Failed to start server:', err);
      reject(err);
    });

    setTimeout(() => {
      reject(new Error('Server startup timeout'));
    }, 10000);
  });
};
