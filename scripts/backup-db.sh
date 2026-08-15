#!/usr/bin/env bash
set -euo pipefail

# Backs up the SQLite database to S3. Intended to run via cron on the server
# hosting the app — see README.md's Deployment section for setup and schedule.
#
# Required env vars (set in the cron environment or a sourced .env file):
#   DB_PATH    - absolute path to the SQLite database file (default: ./dev.db)
#   S3_BUCKET  - target S3 bucket name, e.g. domaine-seetloo-backups
#   S3_PREFIX  - key prefix within the bucket (default: backups)
#
# Requires the AWS CLI, configured with credentials that have s3:PutObject on
# the target bucket/prefix (see README for a minimal IAM policy).

DB_PATH="${DB_PATH:-./dev.db}"
S3_BUCKET="${S3_BUCKET:?Set S3_BUCKET to the target backup bucket}"
S3_PREFIX="${S3_PREFIX:-backups}"

if [ ! -f "$DB_PATH" ]; then
  echo "Database file not found at $DB_PATH" >&2
  exit 1
fi

TIMESTAMP="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
TMP_BACKUP="$(mktemp -u).db"

# Use sqlite3's own .backup command so a WAL checkpoint happens first and the
# copy is always transactionally consistent, even if the app is mid-write.
if command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 "$DB_PATH" ".backup '$TMP_BACKUP'"
else
  echo "sqlite3 CLI not found - falling back to a plain file copy (may miss uncommitted WAL data)" >&2
  cp "$DB_PATH" "$TMP_BACKUP"
fi

KEY="${S3_PREFIX}/domaine-seetloo-${TIMESTAMP}.db"
aws s3 cp "$TMP_BACKUP" "s3://${S3_BUCKET}/${KEY}"

rm -f "$TMP_BACKUP"
echo "Backed up $DB_PATH to s3://${S3_BUCKET}/${KEY}"
