import { FirecrackerRuntime } from '../../cic-runtime/firecracker/firecracker-runtime';
import { runJailer } from '../../cic-runtime/firecracker/firecracker-jailer';

describe('Firecracker Execution', () => {
  it('should generate deterministic jailer config', async () => {
    process.env.NODE_ENV = 'test';
    const result = await runJailer('test-vm-1', { uid: 1000, gid: 1000 });
    expect(result.pid).toBeDefined();
    expect(result.vmDir).toBe('/srv/jailer/firecracker/test-vm-1');
  });

  it('should boot VM synchronously in test mode', async () => {
    process.env.NODE_ENV = 'test';
    const runtime = new FirecrackerRuntime('test-vm-1', '/kernel', '/rootfs', {});
    const configHash = await runtime.boot();
    expect(configHash).toBeDefined();
    await runtime.teardown();
  });
});
