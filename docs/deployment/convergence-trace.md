# Deployment Convergence Trace

Full sequence from image push to pod running across the Kubernetes cluster. Deterministic state transitions with timing and troubleshooting.

## Preconditions

- `registry.internal:5000/harness-v3:latest` exists and is healthy
- `registry.internal:5000/onnx-sidecar:latest` exists and is healthy
- Deployments reference these images
- Secret `registry-auth` is bound to service account
- Cluster has at least 1 healthy node (Ready, NotReady, or SchedulingDisabled)

## Convergence Sequence

### Phase 1: Scheduler Awareness (30 seconds)

**Kubelet detects new or updated Deployment**

```
# kubectl get deployment
NAME          READY   UP-TO-DATE   AVAILABLE   AGE
cic-harness   0/2     0            0           5s  (just created)
```

Scheduler loop:
- Reads pending pods from etcd
- Assigns to nodes based on selectors, affinities, taints/tolerations
- Records binding in etcd

**Expected state:**
```
# kubectl get pods -o wide
NAME                  READY   STATUS    RESTARTS   AGE   NODE
cic-harness-abc123    0/2     Pending   0          5s    node1
cic-harness-def456    0/2     Pending   0          5s    node2
```

### Phase 2: Image Pull (60-90 seconds)

**Kubelet on each node pulls images from registry**

Kubelet sequence:
1. Reads pod spec
2. Checks local image cache (docker image ls)
3. If not present locally:
   - Reads imagePullSecrets
   - Authenticates to registry.internal:5000
   - Pulls harness-v3:latest
   - Pulls onnx-sidecar:latest
4. Verifies image digests match registry
5. Records pull completion in pod status

**Expected logs:**
```
# kubectl describe pod cic-harness-abc123
Events:
  Type    Reason     Age    Message
  ----    ------     ----   -------
  Normal  Scheduled  2m     Successfully assigned default/cic-harness-abc123 to node1
  Normal  Pulling    1m55s  Pulling image "registry.internal:5000/harness-v3:latest"
  Normal  Pulled     1m40s  Successfully pulled image "registry.internal:5000/harness-v3:latest"
  Normal  Pulling    1m39s  Pulling image "registry.internal:5000/onnx-sidecar:latest"
  Normal  Pulled     1m20s  Successfully pulled image "registry.internal:5000/onnx-sidecar:latest"
```

### Phase 3: Container Start (10-30 seconds)

**Kubelet creates containers and starts runtime**

Container lifecycle:
1. Create container via container runtime (containerd, docker, cri-o)
2. Mount volumes, bind secrets as environment variables
3. Execute container entrypoint (CMD in Dockerfile)
4. Attach stdout/stderr to logging pipeline

**Expected state:**
```
# kubectl get pods -o wide
NAME                  READY   STATUS            RESTARTS   AGE   NODE
cic-harness-abc123    0/2     ContainerCreating 0          2m    node1
cic-harness-def456    0/2     ContainerCreating 0          2m    node2
```

**Container initialization order:**
- harness container starts first (port 3100)
- onnx-sidecar container starts second (port 3101)
- Both must pass liveness probes within initialDelaySeconds

### Phase 4: Readiness Checking (30-60 seconds)

**Kubelet probes container health**

Liveness probe sequence (harness):
```
GET http://pod-ip:3100/health
Timeout: 5 seconds
InitialDelaySeconds: 10
PeriodSeconds: 10
FailureThreshold: 3
```

Liveness probe sequence (onnx-sidecar):
```
GET http://pod-ip:3101/health
Timeout: 5 seconds
InitialDelaySeconds: 15
PeriodSeconds: 10
FailureThreshold: 3
```

**Expected events:**
```
Normal  Started   40s    Started container harness
Normal  Started   39s    Started container onnx-sidecar
```

Once probes pass:
```
# kubectl get pods
NAME                  READY   STATUS    RESTARTS   AGE
cic-harness-abc123    2/2     Running   0          3m
cic-harness-def456    2/2     Running   0          3m
```

### Phase 5: Deployment Status Convergence (5-10 seconds after all pods Running)

**Deployment controller updates replica status**

Controller reconciliation:
- Counts Running pods with matching selector
- Updates status.replicas, status.updatedReplicas, status.readyReplicas
- Checks if readyReplicas == desiredReplicas

**Expected state:**
```
# kubectl get deployment
NAME          READY   UP-TO-DATE   AVAILABLE   AGE
cic-harness   2/2     2            2           4m
```

**Service endpoints updated:**
```
# kubectl get endpoints cic-harness-svc
NAME               ENDPOINTS                              AGE
cic-harness-svc    10.0.1.5:3100,10.0.2.6:3100           4m
```

### Phase 6: System Steady State

**Cluster reaches desired state**

All systems healthy:
```
# kubectl get all -l app=cic-harness
NAME                          READY   STATUS    RESTARTS   AGE
pod/cic-harness-abc123        2/2     Running   0          5m
pod/cic-harness-def456        2/2     Running   0          5m

NAME                   TYPE           CLUSTER-IP     EXTERNAL-IP   PORT(S)
svc/cic-harness-svc    LoadBalancer   10.0.10.10     203.0.113.1   3100:30100/TCP

NAME                      READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/cic-harness   2/2     2            2           5m

NAME                               DESIRED   CURRENT   READY   AGE
replicaset.apps/cic-harness-abc123 2         2         2       5m
```

Logs flowing:
```
# kubectl logs -f deployment/cic-harness -c harness
[LOG] Server listening on port 3100
[LOG] Health check passed
...
```

Metrics available:
```
# kubectl top nodes
NAME    CPU(cores)   CPU%   MEMORY(Mi)   MEMORY%
node1   250m         25%    512Mi        51%
node2   280m         28%    490Mi        49%

# kubectl top pods -l app=cic-harness
NAME                  CPU(cores)   MEMORY(Mi)
cic-harness-abc123    140m         256Mi
cic-harness-def456    138m         254Mi
```

## Troubleshooting Guide

### Pod stuck in ImagePullBackOff

```bash
# Check image pull error
kubectl describe pod <pod-name> | grep -A 5 "Events:"

# Typical causes:
# - Registry unreachable: "connection refused"
# - Auth failure: "401 Unauthorized"
# - Image not found: "404 Not Found"
```

**Fix:**
```bash
# Verify registry is up
curl -u <user>:<pass> https://registry.internal:5000/v2/_catalog

# Verify secret
kubectl get secret registry-auth -o yaml | grep dockerconfigjson

# Force pull
kubectl set image deployment/cic-harness harness=registry.internal:5000/harness-v3:v2.0.0

# Watch reconciliation
kubectl rollout status deployment/cic-harness -w
```

### Pod stuck in ContainerCreating

```bash
# Check runtime errors
kubectl describe pod <pod-name>

# Check kubelet logs on node
ssh node1 sudo journalctl -u kubelet | grep <pod-name>

# Typical causes:
# - Mount failure: "volume X not found"
# - Resource request too high: "insufficient memory"
```

### Liveness probe failing

```bash
# Exec into container and test manually
kubectl exec -it <pod-name> -c harness -- curl localhost:3100/health

# Check probe config
kubectl get pod <pod-name> -o yaml | grep -A 10 "livenessProbe"

# Increase initialDelaySeconds if service startup is slow
```

### Pod CrashLoopBackOff

```bash
# Check container logs
kubectl logs <pod-name> -c harness --previous

# Typical causes:
# - Entrypoint error: "node: command not found"
# - Missing env var: "Cannot read property X of undefined"
# - Port binding failure: "EADDRINUSE: address already in use"
```

**Fix:**
```bash
# Check Dockerfile CMD
docker inspect registry.internal:5000/harness-v3:latest | jq '.Cmd'

# Rebuild if needed
./scripts/build-deterministic.sh
```

## Convergence Timeline Summary

| Phase | Duration | Event | Status |
|-------|----------|-------|--------|
| 1 | 0-30s | Scheduler assigns pods | Pending |
| 2 | 30-120s | Images pull from registry | ContainerCreating |
| 3 | 120-150s | Containers start | Starting |
| 4 | 150-210s | Liveness probes pass | Running |
| 5 | 210-220s | Deployment reads replicas | Ready |
| 6 | 220s+ | Steady state | Healthy |

**Total: ~3-4 minutes from image push to all pods Running.**

## Deterministic Guarantees

✓ All pods start in parallel (no sequential rollout)
✓ All pods pull from same registry (no divergence)
✓ All nodes use same image digest (no version skew)
✓ All containers report health via same probe (observable)
✓ Cluster stable when status shows `READY: N/N`
✓ No implicit cache assumptions (imagePullPolicy: Always)
