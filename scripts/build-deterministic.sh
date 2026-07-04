#!/usr/bin/env bash
set -euo pipefail

REGISTRY="${REGISTRY:-registry.internal:5000}"

build_image() {
  local NAME="$1"
  echo "[BUILD] ${NAME}"
  docker build -t "${NAME}:latest" "./${NAME}"
}

tag_and_push() {
  local NAME="$1"
  echo "[TAG] ${NAME}"
  docker tag "${NAME}:latest" "${REGISTRY}/${NAME}:latest"

  echo "[PUSH] ${NAME}"
  docker push "${REGISTRY}/${NAME}:latest"
}

verify_registry() {
  echo "[VERIFY] Registry catalog"
  curl -s "${REGISTRY}/v2/_catalog" | jq .
}

build_image "harness-v3"
build_image "onnx-sidecar"

tag_and_push "harness-v3"
tag_and_push "onnx-sidecar"

verify_registry

echo "[DONE] Images built, tagged, pushed, and verified."
