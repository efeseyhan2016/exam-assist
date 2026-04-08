#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

if ! command -v npx >/dev/null 2>&1; then
  echo "npx is required to deploy with Vercel." >&2
  exit 1
fi

echo "Deploying EXAM ASSIST to Vercel production..."
npx vercel deploy --prod --yes "$@"
