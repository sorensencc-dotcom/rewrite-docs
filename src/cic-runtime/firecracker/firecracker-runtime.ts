import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { buildConfig } from './firecracker-config';

export class FirecrackerRuntime {
  private vmProcess: ChildProcess | null = null;
  private state: 'init' | 'booting' | 'running' | 'teardown' = 'init';

  constructor(
    private vmId: string,
    private kernelPath: string,
    private rootfsPath: string,
    private jailerOptions: any
  ) {}

  async boot(seed?: number) {
    this.state = 'booting';
    console.log(`[Firecracker] Booting VM ${this.vmId} with pinned kernel/rootfs`);
    
    const { configPath, vmConfigHash } = buildConfig(this.vmId, this.kernelPath, this.rootfsPath, seed);

    return new Promise((resolve, reject) => {
      // Mocked boot process for CI compliance, real spawn in prod
      if (process.env.NODE_ENV === 'test') {
        this.state = 'running';
        return resolve(vmConfigHash);
      }

      this.vmProcess = spawn('firecracker', [
        '--api-sock', `/tmp/firecracker-${this.vmId}-api.socket`,
        '--config-file', configPath
      ]);

      this.vmProcess.on('error', reject);
      this.vmProcess.on('spawn', () => {
        this.state = 'running';
        resolve(vmConfigHash);
      });
    });
  }

  async teardown() {
    this.state = 'teardown';
    console.log(`[Firecracker] Tearing down VM ${this.vmId}`);
    if (this.vmProcess) {
      this.vmProcess.kill('SIGTERM');
    }
    // Cleanup sockets
    const apiSockPath = `/tmp/firecracker-${this.vmId}-api.socket`;
    if (fs.existsSync(apiSockPath)) fs.unlinkSync(apiSockPath);
    const vsockPath = `/tmp/firecracker-${this.vmId}.socket`;
    if (fs.existsSync(vsockPath)) fs.unlinkSync(vsockPath);
  }
}
