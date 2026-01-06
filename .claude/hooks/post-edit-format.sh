#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# PostToolUse Hook: Auto-format files after Write/Edit
# Runs Biome format on changed TypeScript/JavaScript/JSON files
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# Read the tool output from stdin (JSON)
INPUT=$(cat)

# Extract the file path from the tool output
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Exit early if no file path
if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

# Only format supported file types
case "$FILE_PATH" in
  *.ts|*.tsx|*.js|*.jsx|*.json|*.jsonc)
    # Check if file exists (it should after Write/Edit)
    if [[ -f "$FILE_PATH" ]]; then
      # Run Biome format silently
      cd "$CLAUDE_PROJECT_DIR"
      bun x biome format --write "$FILE_PATH" 2>/dev/null || true
    fi
    ;;
esac

exit 0
