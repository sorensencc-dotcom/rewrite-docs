---
title: installation
---

# Installation Guide

## System Requirements

### Minimum
- Node.js 18+
- 2GB RAM
- 500MB disk space

### Recommended
- Node.js 20+
- 4GB RAM
- 1GB disk space
- SSD for better performance

## Step 1: Get the Code

```bash
git clone https://github.com/example/maal-sandbox.git
cd maal-sandbox
```

## Step 2: Install Node Modules

```bash
npm install
```

This installs all dependencies for:
- TypeScript/Node runtime
- Jest for testing
- Development tools

## Step 3: Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
NODE_ENV=production
LOG_LEVEL=info
DEBUG=false
```

## Step 4: Verify Installation

Test the installation:

```bash
npm run build
npm test
```

Expected output:
```
All tests passing ✓
Build successful ✓
```

## Step 5: Seal System

Run the complete seal:

```bash
./final.sh
```

Expected output:
```json
{
  "corpus": { "seal": "abc123...", "verify": true },
  "world": { "seal": "def456...", "verify": true },
  "torque": { "seal": "ghi789...", "verify": true }
}
```

## Docker Installation (Alternative)

```bash
docker build -t maal-sandbox .
docker run -it maal-sandbox /bin/bash

# Inside container
npm install
./final.sh
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Node not found | Install Node.js 20+ from nodejs.org |
| npm install fails | Delete node_modules, run `npm install` again |
| Permission denied | Run with `bash ./access.sh` explicitly |
| Hash mismatch | Ensure all files are unchanged, re-seal |

## Next: First Steps

→ [First Steps](first-steps.md)
