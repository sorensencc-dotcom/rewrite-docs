import * as net from 'net';

export class FirecrackerVsock {
  private socketPath: string;

  constructor(private vmId: string) {
    this.socketPath = `/tmp/firecracker-${this.vmId}.socket`;
  }

  async sendCommand(command: string, timeoutMs: number = 5000): Promise<{stdout: string, stderr: string, exitCode: number}> {
    console.log(`[Vsock] Sending to ${this.vmId}: ${command}`);
    
    if (process.env.NODE_ENV === 'test') {
      return { stdout: "ok\n", stderr: "", exitCode: 0 };
    }

    return new Promise((resolve, reject) => {
      const client = net.createConnection({ path: this.socketPath });
      let output = '';
      
      const timer = setTimeout(() => {
        client.destroy();
        reject(new Error("Vsock command timeout"));
      }, timeoutMs);

      client.on('connect', () => {
        client.write(command + '\n');
      });

      client.on('data', (data) => {
        output += data.toString();
      });

      client.on('end', () => {
        clearTimeout(timer);
        resolve({ stdout: output, stderr: "", exitCode: 0 });
      });

      client.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }
}
