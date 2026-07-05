import { spawn } from 'child_process';
import readline from 'readline';
import fs from 'fs';
import path from 'path';
export class McpClientRunner {
    static loadConfig() {
        const configPath = path.resolve(process.cwd(), '.mcp.json');
        if (fs.existsSync(configPath)) {
            try {
                return JSON.parse(fs.readFileSync(configPath, 'utf8'));
            }
            catch (e) {
                console.warn('Failed to parse .mcp.json config, using defaults:', e);
            }
        }
        return {
            mcpServers: {
                truecode: { command: 'truecode', args: ['serve', '--stdio'] },
                gitnexus: { command: 'gitnexus', args: ['serve', '--stdio'] },
                graphify: { command: 'graphify', args: ['serve', '--stdio'] }
            }
        };
    }
    static async callTool(serverName, toolName, args) {
        const config = this.loadConfig();
        const serverConfig = config.mcpServers[serverName];
        if (!serverConfig) {
            throw new Error(`MCP server config not found for: ${serverName}`);
        }
        // Security validation to prevent shell injection (since shell: true is used on Windows).
        // Note: User-controlled tool arguments are safely sent via stdio JSON-RPC, never command-line args.
        const safePattern = /^[a-zA-Z0-9.\-_ /\\:]+$/;
        if (!safePattern.test(serverConfig.command)) {
            throw new Error(`Insecure command path/name: ${serverConfig.command}`);
        }
        for (const arg of serverConfig.args) {
            if (!safePattern.test(arg)) {
                throw new Error(`Insecure command argument: ${arg}`);
            }
        }
        return new Promise((resolve, reject) => {
            // On Windows, spawned commands might need shell: true if they are batch scripts
            const child = spawn(serverConfig.command, serverConfig.args, {
                shell: true,
                stdio: ['pipe', 'pipe', 'inherit']
            });
            let resolved = false;
            const rl = readline.createInterface({ input: child.stdout });
            child.on('error', (err) => {
                if (!resolved) {
                    resolved = true;
                    reject(err);
                }
            });
            // Handshake first
            const initRequest = {
                jsonrpc: "2.0",
                id: 0,
                method: "initialize",
                params: {
                    protocolVersion: "2024-11-05",
                    capabilities: {},
                    clientInfo: { name: "cic-client", version: "1.0.0" }
                }
            };
            child.stdin.write(JSON.stringify(initRequest) + '\n');
            let stage = 'init'; // 'init' -> 'call'
            rl.on('line', (line) => {
                try {
                    const response = JSON.parse(line);
                    if (stage === 'init') {
                        if (response.id === 0) {
                            // Handshake complete, call tool
                            stage = 'call';
                            const callRequest = {
                                jsonrpc: "2.0",
                                id: 1,
                                method: "tools/call",
                                params: {
                                    name: toolName,
                                    arguments: args
                                }
                            };
                            child.stdin.write(JSON.stringify(callRequest) + '\n');
                        }
                    }
                    else if (stage === 'call') {
                        if (response.id === 1) {
                            resolved = true;
                            child.stdin.end();
                            child.kill();
                            if (response.error) {
                                reject(new Error(response.error.message || JSON.stringify(response.error)));
                            }
                            else {
                                const textContent = response.result?.content?.[0]?.text;
                                if (textContent) {
                                    try {
                                        resolve(JSON.parse(textContent));
                                    }
                                    catch (e) {
                                        resolve(textContent);
                                    }
                                }
                                else {
                                    resolve(response.result);
                                }
                            }
                        }
                    }
                }
                catch (e) {
                    if (!resolved) {
                        resolved = true;
                        reject(e);
                    }
                }
            });
            child.on('close', (code) => {
                if (!resolved) {
                    resolved = true;
                    reject(new Error(`MCP server closed unexpectedly with code: ${code}`));
                }
            });
        });
    }
}
//# sourceMappingURL=McpClientRunner.js.map