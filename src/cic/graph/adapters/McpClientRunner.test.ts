import fs from 'fs';
import os from 'os';
import path from 'path';
import { McpClientRunner } from './McpClientRunner.js';

test('callTool writes one 2026-07-28 tools/call and does not open a handshake', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-client-runner-'));
  const script = path.join(dir, 'server.mjs');
  const seen = path.join(dir, 'seen.json');
  fs.writeFileSync(script, `
import fs from 'node:fs';
import readline from 'node:readline';
const lines = [];
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
  if (!line.trim()) return;
  lines.push(JSON.parse(line));
  fs.writeFileSync(${JSON.stringify(seen)}, JSON.stringify(lines));
  const request = lines[0];
  process.stdout.write(JSON.stringify({
    jsonrpc: '2.0',
    id: request.id,
    result: { content: [{ type: 'text', text: JSON.stringify({ ok: request.method }) }] }
  }) + '\\n');
});
`);
  fs.writeFileSync(path.join(dir, '.mcp.json'), JSON.stringify({
    mcpServers: { probe: { command: 'node', args: [script] } },
  }));
  const previous = process.cwd();
  process.chdir(dir);
  try {
    const result = await McpClientRunner.callTool('probe', 'probe.echo', { q: 'a' });
    expect(result).toEqual({ ok: 'tools/call' });
    const lines = JSON.parse(fs.readFileSync(seen, 'utf8'));
    expect(lines).toHaveLength(1);
    expect(lines[0].method).toBe('tools/call');
    expect(lines[0].params.name).toBe('probe.echo');
    expect(lines[0].params.arguments).toEqual({ q: 'a' });
    expect(lines[0].params._meta['io.modelcontextprotocol/protocolVersion']).toBe('2026-07-28');
    expect(lines[0].params._meta['io.modelcontextprotocol/clientCapabilities']).toEqual({});
    expect(JSON.stringify(lines)).not.toContain(['init', 'ialize'].join(''));
  } finally {
    process.chdir(previous);
  }
}, 15000);
