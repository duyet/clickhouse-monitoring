#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# PreToolUse Hook: Protect sensitive files from modification
# Blocks writes to lock files, generated files, and config files
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Exit early if no file path
if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

# ─────────────────────────────────────────────────────────────────────────────
# BLOCK: Files that should never be modified directly
# ─────────────────────────────────────────────────────────────────────────────

case "$FILE_PATH" in
  # Lock files (managed by package managers)
  *bun.lock|*package-lock.json|*yarn.lock|*pnpm-lock.yaml)
    echo '{"decision": "block", "reason": "Lock files should not be edited directly. Use bun add/remove instead."}'
    exit 0
    ;;

  # Generated files
  *.next/*|*node_modules/*|*.turbo/*|*.wrangler/*|*.open-next/*)
    echo '{"decision": "block", "reason": "Generated files should not be edited. They will be overwritten on build."}'
    exit 0
    ;;

  # Sensitive credential files
  *.env.local|*.env.prod|*.dev.vars)
    echo '{"decision": "block", "reason": "Credential files should be edited manually by the user for security."}'
    exit 0
    ;;
esac

# ─────────────────────────────────────────────────────────────────────────────
# WARN: Files that need careful handling
# ─────────────────────────────────────────────────────────────────────────────

case "$FILE_PATH" in
  # UI components from shadcn (should not be customized per CLAUDE.md)
  *components/ui/*)
    echo "Warning: shadcn/ui components should not be customized directly. Consider creating a wrapper component instead." >&2
    ;;

  # Wrangler config
  *wrangler.toml)
    echo "Warning: Modifying Cloudflare Workers configuration" >&2
    ;;
esac

exit 0
