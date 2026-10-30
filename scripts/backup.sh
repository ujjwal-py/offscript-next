#!/usr/bin/env bash
# Snapshot the database and the uploaded images into a folder on the host.
#
#   scripts/backup.sh                # -> backups/db-<stamp>.sql.gz + uploads-<stamp>.tar.gz
#   scripts/backup.sh /mnt/backups   # -> write somewhere else
#
# Safe against a running stack: pg_dump reads a consistent snapshot and tar
# reads the app's uploads volume. Both outputs are verified before the script
# reports success, so a half-written backup is never left behind as "valid".
set -euo pipefail
cd "$(dirname "$0")/.."

DEST=${1:-backups}
STAMP=$(date +%Y%m%d-%H%M%S)
mkdir -p "$DEST"

if ! docker compose ps --status running --format '{{.Service}}' | grep -qx db; then
  echo "error: the db service is not running (start it with: docker compose up -d db)" >&2
  exit 1
fi
if ! docker compose ps --status running --format '{{.Service}}' | grep -qx app; then
  echo "error: the app service is not running (start it with: docker compose up -d)" >&2
  exit 1
fi

DB_USER=$(docker compose exec -T db printenv POSTGRES_USER | tr -d '\r\n')
DB_NAME=$(docker compose exec -T db printenv POSTGRES_DB | tr -d '\r\n')
DB_OUT="$DEST/db-$STAMP.sql.gz"
UPLOADS_OUT="$DEST/uploads-$STAMP.tar.gz"

echo "dumping database $DB_NAME ..."
docker compose exec -T db pg_dump --clean --if-exists -U "$DB_USER" -d "$DB_NAME" | gzip > "$DB_OUT"

echo "archiving uploads volume ..."
docker compose exec -T app tar czf - -C /app uploads > "$UPLOADS_OUT"

# Verify before declaring success (a failed dump still produces a readable gzip).
gzip -t "$DB_OUT"
tar -tzf "$UPLOADS_OUT" > /dev/null
if ! gzip -dc "$DB_OUT" | grep -q 'CREATE TABLE'; then
  echo "error: $DB_OUT does not look like a pg_dump archive" >&2
  exit 1
fi

printf 'db      %s (%s)\nuploads %s (%s files)\n' \
  "$DB_OUT" "$(du -h "$DB_OUT" | cut -f1)" \
  "$UPLOADS_OUT" "$(tar -tzf "$UPLOADS_OUT" | grep -c 'uploads/.' || true)"

echo "done. Restore with: scripts/restore.sh $DB_OUT $UPLOADS_OUT"
