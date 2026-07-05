#!/usr/bin/env bash
set -euo pipefail

echo "[SCAN] Locating TS2307/2305 rot..."

grep -R "from '" -n src | while read -r line; do
  FILE=$(echo "$line" | cut -d: -f1)
  IMPORT=$(echo "$line" | sed -E "s/.*from '([^']+)'.*/\1/")

  if [[ "$IMPORT" != .* ]]; then
    continue
  fi

  TARGET="src/${IMPORT#./}.ts"
  TARGET_JS="src/${IMPORT#./}.js"

  if [[ ! -f "$TARGET" && ! -f "$TARGET_JS" ]]; then
    echo "[ROT] $FILE → missing: $IMPORT"
  fi
done

echo "[DONE] Rot scan complete."
