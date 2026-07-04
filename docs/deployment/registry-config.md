# Registry Configuration

Kubernetes-ready Docker registry secrets and image pull policies for deterministic pod scheduling.

## Secret: Registry Authentication

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: registry-auth
  namespace: default
type: kubernetes.io/dockerconfigjson
data:
  .dockerconfigjson: <BASE64_OF_DOCKER_CONFIG>
```

**How to generate .dockerconfigjson:**

```bash
# Build Docker config locally
cat ~/.docker/config.json | base64 -w 0 > /tmp/dockerconfig.b64

# Replace <BASE64_OF_DOCKER_CONFIG> in YAML above
cat /tmp/dockerconfig.b64
```

Or use kubectl inline:

```bash
kubectl create secret docker-registry registry-auth \
  --docker-server=registry.internal:5000 \
  --docker-username=<username> \
  --docker-password=<password> \
  --docker-email=operator@internal
```

## Pod Manifest: Image Pull Secrets

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: example
spec:
  imagePullSecrets:
    - name: registry-auth
  containers:
    - name: harness
      image: registry.internal:5000/harness-v3:latest
      imagePullPolicy: Always
    - name: onnx
      image: registry.internal:5000/onnx-sidecar:latest
      imagePullPolicy: Always
```

**Deterministic guarantees:**
- Explicit `imagePullSecrets` — no reliance on node-local credentials
- Explicit `imagePullPolicy: Always` — always pull, never cache
- No implicit registry assumptions
- Auth decoupled from image layers

## Deployment Manifest: Full Example

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cic-harness
  labels:
    app: cic-harness
spec:
  replicas: 2
  selector:
    matchLabels:
      app: cic-harness
  template:
    metadata:
      labels:
        app: cic-harness
    spec:
      imagePullSecrets:
        - name: registry-auth
      containers:
        - name: harness
          image: registry.internal:5000/harness-v3:latest
          imagePullPolicy: Always
          ports:
            - containerPort: 3100
          env:
            - name: NODE_ENV
              value: "production"
          livenessProbe:
            httpGet:
              path: /health
              port: 3100
            initialDelaySeconds: 10
            periodSeconds: 10
        - name: onnx-sidecar
          image: registry.internal:5000/onnx-sidecar:latest
          imagePullPolicy: Always
          ports:
            - containerPort: 3101
          env:
            - name: NODE_ENV
              value: "production"
          livenessProbe:
            httpGet:
              path: /health
              port: 3101
            initialDelaySeconds: 15
            periodSeconds: 10
```

## Service: Load Balancing

```yaml
apiVersion: v1
kind: Service
metadata:
  name: cic-harness-svc
spec:
  type: LoadBalancer
  selector:
    app: cic-harness
  ports:
    - name: harness
      port: 3100
      targetPort: 3100
    - name: onnx
      port: 3101
      targetPort: 3101
```

## Verify Registry Access

```bash
# From cluster node
curl -H "Authorization: Bearer $(cat /var/run/secrets/kubernetes.io/serviceaccount/token)" \
  https://kubernetes.default.svc.cluster.local/api/v1/namespaces/default/secrets/registry-auth

# From registry endpoint
curl https://registry.internal:5000/v2/_catalog
```
