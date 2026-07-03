---
title: cli
summary: ""
created: "2026-07-03T19:44:38.070Z"
updated: "2026-07-03T19:44:38.070Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---

# CLI Commands

Complete reference of command-line interface commands.

## Seal Commands

### Seal Access Layer

```bash
./access.sh
```

Seals access control definitions.

**Output**: `access-seal-report.json`

**Options**:
- `bash ./access.sh` — Explicit bash execution
- `DEBUG=true ./access.sh` — Verbose output

### Seal Federation Layer

```bash
./federation.sh
```

Seals federation definitions.

**Output**: `federation-seal-report.json`

**Options**:
- `bash ./federation.sh` — Explicit bash execution
- `DEBUG=true ./federation.sh` — Verbose output

### Seal Snapshot Layer

```bash
./snapshot.sh
```

Seals snapshot definitions.

**Output**: `snapshot-seal-report.json`

**Options**:
- `bash ./snapshot.sh` — Explicit bash execution
- `DEBUG=true ./snapshot.sh` — Verbose output

### Seal Full System

```bash
./final.sh
```

Seals entire system (all 25 layers).

**Output**: 
- `final-seal-report.json`
- `final/certificate.json`

**Options**:
- `bash ./final.sh` — Explicit bash execution
- `DEBUG=true ./final.sh` — Verbose output
- `time ./final.sh` — Measure execution time

## Verification Commands

### Verify Access Layer

```bash
node access/seals/access-verify.js
```

Verifies access layer hashes.

**Output**: Verification report JSON

### Verify Federation Layer

```bash
node federation/seals/federation-verify.js
```

Verifies federation layer hashes.

### Verify Snapshot Layer

```bash
node snapshot/seals/snapshot-verify.js
```

Verifies snapshot layer hashes.

### Verify Full System

```bash
node final/verify.js
```

Verifies all 25 layers.

**Output**: Full verification report

## NPM Commands

### Install Dependencies

```bash
npm install
```

Installs all Node.js dependencies.

### Build TypeScript

```bash
npm run build
```

Compiles TypeScript to JavaScript.

**Output**: `dist/` directory

### Run Tests

```bash
npm test
```

Runs all Jest tests.

**Options**:
- `npm test -- src/tests/batch-36.test.ts` — Run specific test
- `npm test -- --watch` — Watch mode
- `npm test -- --coverage` — Coverage report

### Start Application

```bash
npm start
```

Starts the application (if configured).

## Git Commands

### Check Status

```bash
git status
```

Shows current git state.

### View Differences

```bash
git diff
```

Shows all file changes.

**Options**:
- `git diff access/` — Changes in access layer
- `git diff --stat` — Summary of changes

### Commit Changes

```bash
git add .
git commit -m "message"
```

Commit seal reports and changes.

### View History

```bash
git log
```

Shows commit history.

**Options**:
- `git log --oneline` — One-line format
- `git log --graph` — Visual graph

## Utility Commands

### List Files

```bash
ls -la access/ federation/ snapshot/ final/
```

Shows all layer files.

### View Reports

```bash
cat final-seal-report.json
```

Display seal report.

**Options**:
- `cat final-seal-report.json | jq '.'` — Pretty JSON
- `cat final/certificate.json` — View certificate

### Compare Reports

```bash
diff baseline.json final-seal-report.json
```

Compare two seal reports.

### Measure Performance

```bash
time ./final.sh
```

Time seal execution.

**Output**: real, user, sys times

### Monitor Processes

```bash
ps aux | grep node
```

Show running Node processes.

## Docker Commands

### Build Image

```bash
docker build -t maal-sandbox .
```

Build Docker image.

### Run Container

```bash
docker run -it maal-sandbox bash
```

Run interactive container.

### Run with Environment

```bash
docker run \
  -e NODE_ENV=production \
  -e LOG_LEVEL=debug \
  maal-sandbox bash final.sh
```

Pass environment variables.

### Docker Compose

```bash
docker-compose up
```

Run with docker-compose.

**Options**:
- `docker-compose up -d` — Detached
- `docker-compose down` — Stop containers
- `docker-compose logs` — View logs

## Troubleshooting Commands

### Check Node Version

```bash
node --version
npm --version
```

Verify requirements.

### Find Permission Issues

```bash
ls -la *.sh
chmod +x *.sh
```

Fix executable permissions.

### Check Disk Space

```bash
du -sh .
df -h
```

Monitor disk usage.

### View Recent Errors

```bash
tail -n 50 final-seal-report.json
```

Check latest entries.

### Clean Build

```bash
rm -rf node_modules dist
npm install
npm run build
```

Fresh rebuild.

## Common Workflows

### Complete System Seal & Verify

```bash
#!/bin/bash
./final.sh && \
node final/verify.js && \
cat final/certificate.json
```

### Daily Check

```bash
#!/bin/bash
echo "=== Seal Status ==="
date
./final.sh > /tmp/seal.log 2>&1
echo "Seal: $?"

echo "=== Verification ==="
node final/verify.js | grep -c "true"

echo "=== Certificate ==="
cat final/certificate.json | jq '.sandbox3.version'
```

### Pre-Commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

./final.sh > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "❌ Seal failed, commit blocked"
  exit 1
fi

git add *-seal-report.json
```

### CI/CD Pipeline

```bash
#!/bin/bash
# run-tests.sh

set -e

echo "Installing dependencies..."
npm install

echo "Building..."
npm run build

echo "Testing..."
npm test

echo "Sealing..."
./final.sh

echo "Verifying..."
node final/verify.js

echo "✅ All checks passed"
```

## See Also

- [Running the System](../operations/running.md)
- [Sealing Layers](../operations/sealing.md)
- [Environment](environment.md)
