---
title: monitoring
summary: ""
created: "2026-07-03T19:44:38.052Z"
updated: "2026-07-03T19:44:38.052Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---

# Monitoring

Monitor system seals, hashes, and reproducibility.

## Monitoring Commands

### Check Seal Status

```bash
# Check if seals exist
ls -lh *-seal-report.json

# Check seal timestamps
stat final-seal-report.json
```

### Watch Seal Execution

```bash
# Run with timestamp
time ./final.sh

# Verbose output
DEBUG=true ./final.sh

# Monitor output in real-time
./final.sh | tee seal.log
```

### Monitor File Changes

```bash
# Watch access layer
watchmedo shell-command \
  --patterns="access/*" \
  --recursive \
  --command='./access.sh' \
  .

# Or simpler: run on file save
npm install -g nodemon
nodemon --watch access --exec "./access.sh"
```

## Seal Reports

### Inspect Seal Report

```bash
# Pretty print
cat final-seal-report.json | jq '.'

# Count layers
cat final-seal-report.json | jq 'keys | length'
# Should output: 25

# Check all passed
cat final-seal-report.json | jq '.[] | select(.verify.passed == false)'
# Should output nothing if all pass
```

### Track Hash Changes

```bash
# Save hash before
cat final-seal-report.json > seal-baseline.json

# Make changes
echo "test" >> access/acl/acl.json

# Save hash after
./access.sh > seal-after.json

# Compare
diff seal-baseline.json seal-after.json
# Shows what changed
```

### Monitor Reproducibility

```bash
# Create baseline
./final.sh
cp final-seal-report.json baseline.json

# Restore files (git checkout)
git checkout .

# Re-seal
./final.sh

# Compare
diff baseline.json final-seal-report.json
# Should be identical
```

## Automated Monitoring

### Daily Seal Script

```bash
#!/bin/bash
# daily-seal.sh

DATE=$(date +%Y-%m-%d)
LOG="seals/$DATE.log"

mkdir -p seals

echo "Sealing system: $DATE" > $LOG
./final.sh >> $LOG 2>&1

if grep -q '"passed": true' final-seal-report.json; then
  echo "✅ Seal successful" >> $LOG
  cp final-seal-report.json seals/$DATE.json
else
  echo "❌ Seal failed" >> $LOG
  mail -s "Seal failed" admin@example.com < $LOG
fi

echo "Done: $(date)" >> $LOG
```

Run daily:

```bash
chmod +x daily-seal.sh
crontab -e
# Add: 0 0 * * * /path/to/daily-seal.sh
```

### Reproducibility Monitor

```bash
#!/bin/bash
# check-reproducibility.sh

# Seal system
./final.sh > /tmp/current-seal.json

# Load baseline
BASELINE="final-seal-baseline.json"

if ! test -f $BASELINE; then
  echo "Creating baseline..."
  cp final-seal-report.json $BASELINE
  exit 0
fi

# Compare
if diff -q $BASELINE final-seal-report.json > /dev/null; then
  echo "✅ System reproducible"
  exit 0
else
  echo "❌ Reproducibility broken!"
  echo "Changes:"
  diff $BASELINE final-seal-report.json
  exit 1
fi
```

### Alert on Changes

```bash
#!/bin/bash
# alert-on-change.sh

PREVIOUS_HASH=$(cat final-seal-report.json | jq '.access.seal')

# Wait and reseal
sleep 3600  # 1 hour

./final.sh > /dev/null

CURRENT_HASH=$(cat final-seal-report.json | jq '.access.seal')

if [ "$PREVIOUS_HASH" != "$CURRENT_HASH" ]; then
  echo "⚠️  Access layer changed!"
  git log -n 1 --oneline access/
fi
```

## Metrics to Track

| Metric | Command | What It Means |
|--------|---------|---------------|
| Seal time | `time ./final.sh` | Performance |
| Hash change | `diff baseline.json current.json` | Files changed |
| Reproducibility | `node final/verify.js` | System stability |
| Layer count | `jq 'keys \| length' final-seal-report.json` | Coverage |
| Pass rate | `jq '.[] \| select(.verify.passed == true) \| length' final-seal-report.json` | Success rate |

## Dashboard

Create simple HTML dashboard:

```html
<!DOCTYPE html>
<html>
<head>
  <title>MAAL Seal Status</title>
  <style>
    body { font-family: monospace; }
    .pass { color: green; }
    .fail { color: red; }
  </style>
</head>
<body>
  <h1>System Seal Status</h1>
  <div id="status"></div>
  <script>
    fetch('final-seal-report.json')
      .then(r => r.json())
      .then(data => {
        let html = '';
        for (const [name, seal] of Object.entries(data)) {
          const passed = seal.verify.passed ? 'pass' : 'fail';
          html += `<div class="${passed}">${name}: ${seal.seal.substr(0, 8)}...</div>`;
        }
        document.getElementById('status').innerHTML = html;
      });
  </script>
</body>
</html>
```

## See Also

- [Sealing Layers](sealing.md)
- [Verification](verification.md)
- [Running the System](running.md)
