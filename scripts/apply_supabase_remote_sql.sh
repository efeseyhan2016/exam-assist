#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SQL_FILE="${1:-$ROOT_DIR/supabase/foundation.sql}"

if [[ ! -f "$SQL_FILE" ]]; then
  echo "SQL file not found: $SQL_FILE" >&2
  exit 1
fi

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  cat >&2 <<'EOF'
SUPABASE_DB_URL is required.

Example:
  export SUPABASE_DB_URL='postgresql://postgres:[password]@db.<project-ref>.supabase.co:5432/postgres'
  bash scripts/apply_supabase_remote_sql.sh
EOF
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required to apply remote SQL." >&2
  exit 1
fi

echo "Applying SQL to remote Supabase database from: ${SQL_FILE}"
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f "$SQL_FILE"
