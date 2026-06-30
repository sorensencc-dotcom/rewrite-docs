# Environment Configuration

Configuration options for running the MAAL Sandbox system.

## Environment Variables

### Application Environment

**NODE_ENV**
- Default: `production`
- Options: `production`, `development`, `test`
- Usage: Controls log levels and features

```bash
export NODE_ENV=production
./final.sh
```

### Logging

**LOG_LEVEL**
- Default: `info`
- Options: `error`, `warn`, `info`, `debug`, `trace`
- Usage: Controls verbosity

```bash
export LOG_LEVEL=debug
./final.sh
```

**DEBUG**
- Default: `false`
- Options: `true`, `false`
- Usage: Enable debug output

```bash
export DEBUG=true
./final.sh
```

### Performance

**NODE_OPTIONS**
- Default: (none)
- Usage: Pass Node.js options

```bash
export NODE_OPTIONS="--max-old-space-size=4096"
./final.sh
```

### Paths

**MAAL_HOME**
- Default: Current directory
- Usage: Base directory for all paths

```bash
export MAAL_HOME=/opt/maal
cd $MAAL_HOME
./final.sh
```

## Configuration Files

### .env

Optional environment file for local development:

```bash
# Create .env
touch .env

# Add configuration
echo "NODE_ENV=development" >> .env
echo "LOG_LEVEL=debug" >> .env

# Load automatically
source .env
./final.sh
```

### .env.local

Local overrides (not in version control):

```bash
# Create .env.local
touch .env.local

# Add local settings
echo "DEBUG=true" >> .env.local

# Load in addition to .env
source .env
source .env.local
./final.sh
```

### .env.example

Template for environment configuration:

```bash
# Copy template
cp .env.example .env

# Edit with your values
vi .env
```

Example content:

```env
# Environment
NODE_ENV=production
LOG_LEVEL=info
DEBUG=false

# Paths
MAAL_HOME=/opt/maal

# Performance
NODE_OPTIONS="--max-old-space-size=2048"

# Timeout (milliseconds)
SEAL_TIMEOUT=30000
VERIFY_TIMEOUT=10000
```

## Runtime Configuration

### package.json Scripts

Defined scripts in `package.json`:

```json
{
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "start": "node dist/index.js",
    "seal:access": "bash access.sh",
    "seal:federation": "bash federation.sh",
    "seal:snapshot": "bash snapshot.sh",
    "seal:all": "bash final.sh",
    "verify": "node final/verify.js"
  }
}
```

Running:

```bash
npm run seal:all
npm run verify
npm test
```

### TypeScript Configuration

**tsconfig.json**

Controls TypeScript compilation:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

Compile:

```bash
npx tsc
```

## Docker Environment

### Dockerfile Variables

**Passed at build time**:

```bash
docker build \
  --build-arg NODE_VERSION=20 \
  --build-arg LOG_LEVEL=info \
  -t maal-sandbox .
```

**Passed at runtime**:

```bash
docker run \
  -e NODE_ENV=production \
  -e LOG_LEVEL=debug \
  -e DEBUG=true \
  maal-sandbox bash final.sh
```

### docker-compose

**docker-compose.yml**:

```yaml
version: '3.8'

services:
  maal:
    build: .
    environment:
      NODE_ENV: production
      LOG_LEVEL: info
      DEBUG: "false"
    volumes:
      - ./access:/app/access
      - ./federation:/app/federation
      - ./snapshot:/app/snapshot
      - ./final:/app/final
    command: bash final.sh
```

Run:

```bash
docker-compose up
```

## CI/CD Environment

### GitHub Actions

**Environment variables in workflow**:

```yaml
env:
  NODE_ENV: test
  LOG_LEVEL: debug

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '20'
      - run: npm test
```

### Secrets Management

**GitHub Secrets** (for sensitive values):

```bash
# Set secrets
gh secret set DATABASE_PASSWORD

# Use in workflow
env:
  DB_PASS: ${{ secrets.DATABASE_PASSWORD }}
```

## Performance Tuning

### Memory

For large systems, increase heap:

```bash
NODE_OPTIONS="--max-old-space-size=8192" ./final.sh
```

### Timeout

Increase seal timeout:

```bash
export SEAL_TIMEOUT=60000  # 60 seconds
./final.sh
```

### Parallelization

Run independent seals in parallel:

```bash
./access.sh &
./federation.sh &
./snapshot.sh &
wait
./final.sh
```

## Verification

Check environment:

```bash
#!/bin/bash
echo "Node: $(node --version)"
echo "NPM: $(npm --version)"
echo "Home: $MAAL_HOME"
echo "Env: $NODE_ENV"
echo "Debug: $DEBUG"
```

## Best Practices

✅ **Do**:
- Use `.env` for local development
- Use environment variables for CI/CD
- Document configuration in `.env.example`
- Version control script files

❌ **Don't**:
- Hard-code paths in scripts
- Commit `.env.local` or secrets
- Mix environment and config files
- Change compiler settings without testing

## See Also

- [Running the System](../operations/running.md)
- [Schemas](schemas.md)
- [Manifests](manifests.md)
