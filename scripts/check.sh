#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
npm test
npm run validate
npm run build
