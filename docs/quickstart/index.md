# Quickstart Guide

Get the MAAL Sandbox system running in 5 minutes.

## Prerequisites

- Node.js 20+
- Bash or PowerShell
- Git
- ~500MB disk space

## Installation

1. **Clone repository**
   ```bash
   git clone <repo>
   cd maal-sandbox
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment**
   ```bash
   cp .env.example .env
   ```

## First Seal

Run the complete system seal in sequence:

```bash
# Seal access layer
./access.sh

# Seal federation layer
./federation.sh

# Seal snapshot layer
./snapshot.sh

# Final system seal
./final.sh
```

Each script generates a `*-seal-report.json` file confirming deterministic hashing.

## Verify Reproducibility

```bash
# Verify all layers
node final/verify.js

# Check certificate
cat final/certificate.json
```

## What You Get

✅ 4 sealed layers (access, federation, snapshot, final)  
✅ Hash reports for each layer  
✅ Reproducibility certificate  
✅ Verification scripts  

## Next Steps

- [Installation Details](installation.md)
- [First Steps](first-steps.md)
- [Full Architecture](../architecture/overview.md)
