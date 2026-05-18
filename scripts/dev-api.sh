#!/usr/bin/env bash
# Start the Spring Boot API in development mode (H2 in-memory DB, hot reload).
# Run from the repo root: bash scripts/dev-api.sh
set -euo pipefail

PROPS="apps/api/src/main/resources/application.properties"
if [ ! -f "$PROPS" ]; then
  echo "ERROR: $PROPS not found."
  echo "Run: bash scripts/setup.sh"
  exit 1
fi

echo "==> Starting Voyage API on :8080 (H2 dev DB)"
cd apps/api
mvn spring-boot:run -DskipTests
