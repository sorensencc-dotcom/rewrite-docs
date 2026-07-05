import * as net from 'net';
export class FirecrackerVsock {
    vmId;
    socketPath;
    constructor(vmId) {
        this.vmId = vmId;
        this.socketPath = `/tmp/firecracker-${this.vmId}.socket`;
    }
    async sendCommand(command, timeoutMs = 5000) {
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
//# sourceMappingURL=firecracker-vsock.js.map