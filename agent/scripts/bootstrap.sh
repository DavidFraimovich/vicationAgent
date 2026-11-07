#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
cp -n agent/.env.example agent/.env || true
npm run setup
echo
echo "Next:"
echo "  npm run dashboard"
echo "  export GOOGLE_MAPS_GROUNDING_API_KEY=..."
echo "  open the project in Codex and run /mcp"
