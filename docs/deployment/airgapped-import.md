# Air-Gapped Node-Local Import

For clusters without registry access or immediate network constraints, save and import images directly into the node-local container runtime (containerd).

## Save Images to TAR

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "[SAVE] harness-v3 → harness-v3.tar"
docker save harness-v3:latest -o harness-v3.tar

echo "[SAVE] onnx-sidecar → onnx-sidecar.tar"
docker save onnx-sidecar:latest -o onnx-sidecar.tar

echo "[DONE] TAR files ready for transfer"
ls -lh harness-v3.tar onnx-sidecar.tar
```

## Transfer to Node (via scp, rsync, or mount)

```bash
# Example: SCP to node
scp harness-v3.tar operator@node1:/tmp/
scp onnx-sidecar.tar operator@node1:/tmp/
```

## Import into containerd (Node-Local)

```bash
#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="k8s.io"

echo "[IMPORT] harness-v3 into containerd"
sudo ctr -n ${NAMESPACE} images import /tmp/harness-v3.tar

echo "[IMPORT] onnx-sidecar into containerd"
sudo ctr -n ${NAMESPACE} images import /tmp/onnx-sidecar.tar

echo "[VERIFY] Images in containerd"
sudo ctr -n ${NAMESPACE} images ls | grep -E "harness-v3|onnx-sidecar"

echo "[DONE] Images imported and ready for kubelet"
```

## Verify in Kubernetes

```bash
# Pod manifest uses IfNotPresent — will pull from node local
cat > /tmp/test-pod.yaml <<'EOF'
apiVersion: v1
kind: Pod
metadata:
  name: test-local-image
spec:
  containers:
    - name: harness
      image: harness-v3:latest
      imagePullPolicy: IfNotPresent
  restartPolicy: Never
EOF

kubectl apply -f /tmp/test-pod.yaml

# Pod should go Running immediately (no ImagePullBackOff)
kubectl get pod test-local-image -w

# Logs confirm container started
kubectl logs test-local-image -c harness
```

## Air-Gapped Cluster Workflow

1. **Build on source node** (network access)
   - `docker build -t harness-v3:latest ./harness-v3`
   - `docker build -t onnx-sidecar:latest ./onnx-sidecar`

2. **Export to TAR**
   - `docker save` → `harness-v3.tar`, `onnx-sidecar.tar`

3. **Transfer to target nodes** (offline, sneaker-net, USB, rsync, etc.)

4. **Import into containerd** on each node
   - `ctr -n k8s.io images import`

5. **Schedule pods with `imagePullPolicy: IfNotPresent`**
   - kubelet will find images in local storage
   - No registry calls, no network dependency

## Advantages

- **No registry required** — offline deployment
- **Instant pod start** — images pre-loaded on node
- **Deterministic** — same binary across all nodes
- **Air-gapped friendly** — disconnected environments
- **Fallback mechanism** — combine with registry for hybrid mode

## Disadvantages

- Manual transfer workflow
- Requires manual sync across all nodes
- No versioning (TAR is point-in-time)

## Hybrid Mode (Recommended)

Use registry as primary, air-gapped import as fallback:

```yaml
spec:
  containers:
    - name: harness
      image: registry.internal:5000/harness-v3:latest
      imagePullPolicy: IfNotPresent  # Try local first, fall back to registry
```

If registry is unreachable, kubelet uses node-local image. If image missing locally, attempts registry pull (will fail if registry down, but pod keeps trying).
