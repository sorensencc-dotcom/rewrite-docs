#!/usr/bin/env bash
# PHASE-0.9 runner harness.
# Verifies the gates in roadmap-runner/phases/PHASE-0.9.yaml from real execution:
#   reproducibility_score    — two full pipeline runs must produce identical out/ trees
#   multi_stage_build_layers — instruction count parsed from the baked-in Dockerfile
#   output patterns          — printed only when the underlying check truly passed
set -uo pipefail

FAIL=0

# Pin timestamps so reproducibility measures the pipeline, not the clock
export SOURCE_DATE_EPOCH=1751500800

hash_out() {
  find out -type f | LC_ALL=C sort | xargs sha256sum | sha256sum | cut -d' ' -f1
}

echo "[harness] Run 1/2: full pipeline"
rm -rf out
if ! bash build.sh > /tmp/build1.log 2>&1; then
  echo "[harness] build.sh run 1 FAILED:"
  tail -n 20 /tmp/build1.log
  FAIL=1
fi
HASH1=$(hash_out 2>/dev/null || echo "run1-failed")

echo "[harness] Run 2/2: full pipeline"
rm -rf out
if ! bash build.sh > /tmp/build2.log 2>&1; then
  echo "[harness] build.sh run 2 FAILED:"
  tail -n 20 /tmp/build2.log
  FAIL=1
fi
HASH2=$(hash_out 2>/dev/null || echo "run2-failed")

echo "[harness] run1 sha256: $HASH1"
echo "[harness] run2 sha256: $HASH2"

if [ "$FAIL" -eq 0 ] && [ "$HASH1" = "$HASH2" ] && [ "$HASH1" != "run1-failed" ]; then
  REPRO=1.0
  echo "✓ node-build reproducible (out/ sha256 identical across runs)"
else
  REPRO=0.0
  echo "✗ node-build NOT reproducible"
  FAIL=1
fi
echo "{\"metric\":\"reproducibility_score\",\"value\":$REPRO}"

# Layer count from the Dockerfile baked into this image
if [ -f Dockerfile ]; then
  LAYERS=$(grep -cE '^(FROM|RUN|COPY)' Dockerfile)
else
  LAYERS=0
  FAIL=1
fi
echo "[harness] Dockerfile layer instructions: $LAYERS"
echo "{\"metric\":\"multi_stage_build_layers\",\"value\":$LAYERS}"

# Sealed runtime: build tools must be absent in this stage
SEALED=1
for tool in git jq curl yq; do
  if command -v "$tool" > /dev/null 2>&1; then
    echo "[harness] SEAL VIOLATION: $tool present in runtime image"
    SEALED=0
    FAIL=1
  fi
done
if [ "$SEALED" -eq 1 ]; then
  echo "✓ node-runtime sealed (git/jq/curl/yq absent)"
else
  echo "✗ node-runtime NOT sealed"
fi

exit $FAIL
