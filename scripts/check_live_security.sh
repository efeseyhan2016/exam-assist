#!/usr/bin/env bash
set -euo pipefail

URL="${1:-https://exam-assist.vercel.app}"

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required for live checks." >&2
  exit 1
fi

echo "Checking security headers for: ${URL}"
echo

curl -I -s "$URL" | awk '
  BEGIN {
    IGNORECASE = 1
  }
  NR == 1 ||
  /^strict-transport-security:/ ||
  /^content-security-policy:/ ||
  /^x-content-type-options:/ ||
  /^x-frame-options:/ ||
  /^referrer-policy:/ ||
  /^permissions-policy:/ {
    print
  }
'
