#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# PreToolUse Hook: Bash command safety checks
# Blocks dangerous commands and provides warnings for risky operations
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Exit early if no command
if [[ -z "$COMMAND" ]]; then
  exit 0
fi

# ─────────────────────────────────────────────────────────────────────────────
# BLOCK: Dangerous commands that should never run
# ─────────────────────────────────────────────────────────────────────────────

# Block rm -rf on root or home directories
if echo "$COMMAND" | grep -qE 'rm\s+(-[rf]+\s+)*(/|~|\$HOME|/Users)'; then
  echo '{"decision": "block", "reason": "Blocked: rm -rf on root/home directory is too dangerous"}'
  exit 0
fi

# Block git push --force to main/master
if echo "$COMMAND" | grep -qE 'git\s+push\s+.*--force.*\s+(main|master)'; then
  echo '{"decision": "block", "reason": "Blocked: Force push to main/master is not allowed"}'
  exit 0
fi

# Block dropping databases in ClickHouse
if echo "$COMMAND" | grep -qiE 'DROP\s+(DATABASE|TABLE)\s+(?!IF\s+EXISTS)'; then
  echo '{"decision": "block", "reason": "Blocked: DROP without IF EXISTS is dangerous. Use DROP IF EXISTS instead."}'
  exit 0
fi

# ─────────────────────────────────────────────────────────────────────────────
# WARN: Risky commands that should show a warning (but allow)
# ─────────────────────────────────────────────────────────────────────────────

# Warn about production deployments
if echo "$COMMAND" | grep -qE '(wrangler\s+deploy|cf:deploy)'; then
  echo "Note: This will deploy to Cloudflare Workers production" >&2
fi

# Warn about database migrations
if echo "$COMMAND" | grep -qiE '(ALTER\s+TABLE|TRUNCATE)'; then
  echo "Warning: Database schema modification detected" >&2
fi

exit 0
