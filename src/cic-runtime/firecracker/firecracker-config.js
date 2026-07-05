import * as crypto from 'crypto';
import * as fs from 'fs';
export function buildConfig(vmId, kernelPath, rootfsPath, seed) {
    if (!fs.existsSync(kernelPath) || !fs.existsSync(rootfsPath)) {
        if (process.env.NODE_ENV !== 'test') {
            throw new Error(`Pinned kernel (${kernelPath}) or rootfs (${rootfsPath}) missing`);
        }
    }
    const config = {
        'boot-source': {
            kernel_image_path: kernelPath,
            boot_args: 'console=ttyS0 reboot=k panic=1 pci=off root=/dev/vda'
        },
        drives: [
            {
                drive_id: 'rootfs',
                path_on_host: rootfsPath,
                is_root_device: true,
                is_read_only: true
            },
            {
                drive_id: 'tmpfs',
                path_on_host: `/tmp/fc-${vmId}-tmp`,
                is_root_device: false,
                is_read_only: false
            }
        ],
        'machine-config': {
            vcpu_count: 2,
            mem_size_mib: 1024,
            smt: false
        },
        'network-interfaces': [],
        vsock: {
            guest_cid: 3,
            uds_path: `/tmp/firecracker-${vmId}.socket`
        },
        metadata: {
            seed: seed ?? 0,
            deterministic: true
        }
    };
    const configString = JSON.stringify(config);
    const vmConfigHash = crypto.createHash('sha256').update(configString).digest('hex');
    const configPath = `/tmp/firecracker-${vmId}.json`;
    if (process.env.NODE_ENV !== 'test') {
        fs.writeFileSync(configPath, configString);
    }
    return { configPath, vmConfigHash };
}
//# sourceMappingURL=firecracker-config.js.map