#!/usr/bin/env bash
# Scan the working tree for secrets using gitleaks.
# Used as a manual check and as the pre-commit hook body.
# Run from the repo root: bash scripts/check-secrets.sh
set -euo pipefail

# Try PATH first, then fall back to the winget install location
if command -v gitleaks &>/dev/null; then
  GITLEAKS="gitleaks"
elif [ -f "$LOCALAPPDATA/Microsoft/WinGet/Packages/Gitleaks.Gitleaks_Microsoft.Winget.Source_8wekyb3d8bbwe/gitleaks.exe" ]; then
  GITLEAKS="$LOCALAPPDATA/Microsoft/WinGet/Packages/Gitleaks.Gitleaks_Microsoft.Winget.Source_8wekyb3d8bbwe/gitleaks.exe"
else
  echo "WARNING: gitleaks not found — install via: winget install Gitleaks.Gitleaks"
  exit 0
fi

echo "==> Scanning for secrets..."
"$GITLEAKS" detect --source . --verbose
echo "==> Clean."
