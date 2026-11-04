#!/usr/bin/env bash
set -euo pipefail
# Resets are permitted only in the runner-created disposable fixture.
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
exec node "$SCRIPT_DIR/e2e/guard.mjs" reset
