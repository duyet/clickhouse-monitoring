#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# PostToolUse Hook: Validate query config changes
# Checks that query configs follow the expected structure
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Only validate query config files
if [[ "$FILE_PATH" != *"lib/query-config"* ]]; then
  exit 0
fi

# Check if it's a TypeScript file
case "$FILE_PATH" in
  *.ts|*.tsx)
    # Verify file exists
    if [[ ! -f "$FILE_PATH" ]]; then
      exit 0
    fi

    # Check for required QueryConfig fields
    if grep -q "QueryConfig" "$FILE_PATH"; then
      # Verify 'name' field exists
      if ! grep -q "name:" "$FILE_PATH"; then
        echo "Warning: QueryConfig missing 'name' field in $FILE_PATH" >&2
      fi

      # Verify 'sql' field exists
      if ! grep -q "sql:" "$FILE_PATH"; then
        echo "Warning: QueryConfig missing 'sql' field in $FILE_PATH" >&2
      fi
    fi
    ;;
esac

exit 0
