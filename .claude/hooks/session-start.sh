#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# SessionStart Hook: Load project context on session start/resume
# Provides Claude with current project state and environment info
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

cd "$CLAUDE_PROJECT_DIR"

# Build context information
CONTEXT=""

# Check if ClickHouse hosts are configured
if [[ -f ".env.local" ]]; then
  HOST_COUNT=$(grep -c "CLICKHOUSE_HOST" .env.local 2>/dev/null || echo "0")
  if [[ "$HOST_COUNT" -gt 0 ]]; then
    CONTEXT+="ClickHouse: Configured in .env.local\n"
  fi
fi

# Check git branch
if git rev-parse --git-dir > /dev/null 2>&1; then
  BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
  CONTEXT+="Git branch: $BRANCH\n"

  # Check for uncommitted changes
  if [[ -n $(git status --porcelain 2>/dev/null) ]]; then
    CONTEXT+="Git status: Has uncommitted changes\n"
  fi
fi

# Check if build is healthy
if [[ -d ".next" ]]; then
  CONTEXT+="Build: .next directory exists\n"
else
  CONTEXT+="Build: No .next directory (run 'bun run build')\n"
fi

# Output as JSON for Claude context
if [[ -n "$CONTEXT" ]]; then
  echo -e "$CONTEXT"
fi

exit 0
