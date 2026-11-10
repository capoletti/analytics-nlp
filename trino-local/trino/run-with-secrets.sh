#!/bin/sh
set -eu
SECRET_FILE=/etc/trino/secrets/shared-secret
if [ ! -s "$SECRET_FILE" ]; then
  echo "Missing $SECRET_FILE; run the trino-secrets service first." >&2
  exit 1
fi
TRINO_INTERNAL_SHARED_SECRET="$(cat "$SECRET_FILE")"
export TRINO_INTERNAL_SHARED_SECRET
exec /usr/lib/trino/bin/launcher run --etc-dir /etc/trino
