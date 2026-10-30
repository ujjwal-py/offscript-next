#!/usr/bin/env bash
# Restore a backup produced by scripts/backup.sh.
#
#   scripts/restore.sh backups/db-<stamp>.sql.gz
#   scripts/restore.sh backups/db-<stamp>.sql.gz backups/uploads-<stamp>.tar.gz
#   scripts/restore.sh --yes backups/db-<stamp>.sql.gz   # skip the prompt (CI)
#
# The database restore drops and recreates the dumped objects, so it must be
# asked for explicitly. Uploaded files are only added/overwritten, never
# removed: anything uploaded after the backup is left in place.
#
# Set RESTORE_DB to load the dump into a different database, e.g. to check a
# backup without touching live data:
#   RESTORE_DB=offscript_verify scripts/restore.sh --yes backups/db-<stamp>.sql.gz
set -euo pipefail
cd "$(dirname "$0")/.."

ASSUME_YES=0
ARGS=()
for arg in "$@"; do
  case "$arg" in
    --yes|-y) ASSUME_YES=1 ;;
    -*) echo "error: unknown option $arg" >&2; exit 1 ;;
    *) ARGS+=("$arg") ;;
  esac
done

DB_DUMP=${ARGS[0]:-}
UPLOADS_ARCHIVE=${ARGS[1]:-}

if [ -z "$DB_DUMP" ]; then
  echo "usage: scripts/restore.sh [--yes] <db-*.sql.gz> [uploads-*.tar.gz]" >&2
  exit 1
fi
[ -f "$DB_DUMP" ] || { echo "error: $DB_DUMP not found" >&2; exit 1; }
gzip -t "$DB_DUMP"
if [ -n "$UPLOADS_ARCHIVE" ]; then
  [ -f "$UPLOADS_ARCHIVE" ] || { echo "error: $UPLOADS_ARCHIVE not found" >&2; exit 1; }
  tar -tzf "$UPLOADS_ARCHIVE" > /dev/null
fi

DB_USER=$(docker compose exec -T db printenv POSTGRES_USER | tr -d '\r\n')
# RESTORE_DB targets another database (e.g. a scratch one) instead of the live one.
DB_NAME=${RESTORE_DB:-$(docker compose exec -T db printenv POSTGRES_DB | tr -d '\r\n')}

echo "This will REPLACE the contents of database $DB_NAME from:"
echo "  $DB_DUMP"
if [ -n "$UPLOADS_ARCHIVE" ]; then
  echo "and extract uploaded files from:"
  echo "  $UPLOADS_ARCHIVE"
fi
if [ "$ASSUME_YES" -ne 1 ]; then
  printf 'Type "restore" to continue: '
  read -r answer
  [ "$answer" = "restore" ] || { echo "aborted"; exit 1; }
fi

echo "restoring database ..."
docker compose exec -T db psql -v ON_ERROR_STOP=1 -q -U "$DB_USER" -d "$DB_NAME" < <(gzip -dc "$DB_DUMP")

if [ -n "$UPLOADS_ARCHIVE" ]; then
  echo "restoring uploads ..."
  docker compose exec -T app tar xzf - -C /app < "$UPLOADS_ARCHIVE"
fi

echo "done. Restart the app so caches pick up the restored rows: docker compose restart app"
