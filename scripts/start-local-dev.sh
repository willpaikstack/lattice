#!/usr/bin/env bash
set -euo pipefail

cd /Users/willsclaw/lattice

export LATTICE_DEV_HOST="${LATTICE_DEV_HOST:-0.0.0.0}"
export LATTICE_DEV_PORT="${LATTICE_DEV_PORT:-3000}"

exec npm run dev -- --hostname "$LATTICE_DEV_HOST" --port "$LATTICE_DEV_PORT"
