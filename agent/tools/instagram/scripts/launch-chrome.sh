#!/bin/bash
set -euo pipefail
: "${CHROME_USER_DATA_DIR:?Set the dedicated travel Chrome profile directory explicitly}"
exec "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --remote-debugging-port=9222 \
  --user-data-dir="$CHROME_USER_DATA_DIR" \
  --no-first-run --no-default-browser-check about:blank
