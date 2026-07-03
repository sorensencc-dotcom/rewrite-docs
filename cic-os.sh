#!/usr/bin/env bash
set -e
DIR="$(dirname "$0")"
"$DIR/cic-os-preflight.sh"
docker compose -f "$DIR/docker-compose.cic-os.yml" "$@"
