#!/usr/bin/env bash
set -euo pipefail

echo "==> Voyage dev setup"

# Frontend
cp -n apps/mobile/.env.example apps/mobile/.env 2>/dev/null || true
cd apps/mobile && npm ci && cd ../..

# Backend
cp -n apps/api/src/main/resources/application.properties.example \
       apps/api/src/main/resources/application.properties 2>/dev/null || true
echo "  Edit apps/api/src/main/resources/application.properties and fill in secrets"

echo "==> Done. Run 'npx expo start --clear' in apps/mobile/ and 'mvn spring-boot:run' in apps/api/"