#!/usr/bin/env bash
# Lists the production licences (backend image and frontend dependencies) into docs/LICENCES.md.
# Exits 1 on a GPL licence, psycopg, or a real sharp build.
set -euo pipefail

cd "$(dirname "$0")/.."
mkdir -p docs

docker build --quiet --target prod -t firstfan-backend:licenses backend >/dev/null
docker build --quiet --target dev -t firstfan-frontend:licenses frontend >/dev/null

docker run --rm firstfan-frontend:licenses pnpm licenses list --prod --json \
  | docker run --rm -i -v "$PWD/scripts/licenses.py:/tmp/licenses.py:ro" --entrypoint python \
    firstfan-backend:licenses /tmp/licenses.py >docs/LICENCES.md

echo "docs/LICENCES.md à jour."
