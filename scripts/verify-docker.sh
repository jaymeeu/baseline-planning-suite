#!/usr/bin/env bash
# Phase 14 — smoke-check Docker Compose stack (Shell + remotes + config.js).
set -euo pipefail

SHELL_URL="${SHELL_URL:-http://localhost:8080}"
PEOPLE_URL="${PEOPLE_URL:-http://localhost:8081}"
DELIVERY_URL="${DELIVERY_URL:-http://localhost:8082}"

fail() {
  echo "verify-docker: FAIL — $*" >&2
  exit 1
}

ok() {
  echo "verify-docker: ok — $*"
}

need() {
  local url="$1"
  local label="$2"
  if ! curl -sf --max-time 10 "$url" >/dev/null; then
    fail "unreachable: $label ($url)"
  fi
  ok "$label"
}

need "$SHELL_URL/" "Shell HTML"
need "$PEOPLE_URL/" "People standalone HTML"
need "$DELIVERY_URL/" "Delivery standalone HTML"
need "$PEOPLE_URL/remoteEntry.js" "People remoteEntry.js"
need "$DELIVERY_URL/remoteEntry.js" "Delivery remoteEntry.js"

CONFIG="$(curl -sf --max-time 10 "$SHELL_URL/config.js")" || fail "Shell config.js"
echo "$CONFIG" | grep -q 'peopleRemoteUrl' || fail "config.js missing peopleRemoteUrl"
echo "$CONFIG" | grep -q 'deliveryRemoteUrl' || fail "config.js missing deliveryRemoteUrl"
echo "$CONFIG" | grep -q 'remoteEntry.js' || fail "config.js missing remoteEntry.js paths"
ok "Shell config.js has remote URL keys"

# Remotes must resolve from runtime config, not baked host:port defaults in Shell bundles.
# Skip if dist is absent (pure Docker host without a local Shell build).
DIST_DIR="$(cd "$(dirname "$0")/.." && pwd)/apps/shell/dist"
if [[ -d "$DIST_DIR" ]]; then
  if grep -R -l -E 'localhost:808[12]|127\.0\.0\.1:808[12]' "$DIST_DIR" --include='*.js' 2>/dev/null \
    | grep -v 'config\.js' >/dev/null; then
    fail "Shell dist JS embeds remote host:port defaults (expected only in /config.js)"
  fi
  ok "Shell dist does not bake remote :8081/:8082 URLs"
else
  ok "skip Shell dist bake check (no local apps/shell/dist)"
fi

echo "verify-docker: all checks passed"
