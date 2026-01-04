#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# UserPromptSubmit Hook: Add context based on user prompt content
# Injects helpful reminders and guidelines based on what user is asking
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

INPUT=$(cat)
PROMPT=$(echo "$INPUT" | jq -r '.prompt // empty' | tr '[:upper:]' '[:lower:]')

# Exit early if no prompt
if [[ -z "$PROMPT" ]]; then
  exit 0
fi

CONTEXT=""

# ─────────────────────────────────────────────────────────────────────────────
# Context injection based on prompt keywords
# ─────────────────────────────────────────────────────────────────────────────

# Query config related prompts
if echo "$PROMPT" | grep -qE '(query.?config|queryconfig|sql|clickhouse)'; then
  CONTEXT+="Reminder: Check .claude/skills/clickhouse-query-config.md for query config patterns. Use versioned SQL with 'since' field for version compatibility.\n"
fi

# Chart related prompts
if echo "$PROMPT" | grep -qE '(chart|graph|visual|recharts)'; then
  CONTEXT+="Reminder: Charts use SWR with useChartData hook. All chart components require hostId prop. See components/charts/ for patterns.\n"
fi

# shadcn/ui related prompts
if echo "$PROMPT" | grep -qE '(shadcn|ui.component|button|card|dialog|toast)'; then
  CONTEXT+="Reminder: Never modify components/ui/ directly. Create wrapper components instead. Use 'bun x shadcn@latest add <component>' to add new components.\n"
fi

# Deployment related prompts
if echo "$PROMPT" | grep -qE '(deploy|cloudflare|wrangler|production)'; then
  CONTEXT+="Reminder: Deploy with 'bun run cf:deploy'. Ensure .env.local has CLICKHOUSE_HOST, CLICKHOUSE_USER, CLICKHOUSE_PASSWORD.\n"
fi

# Testing related prompts
if echo "$PROMPT" | grep -qE '(test|jest|cypress|e2e)'; then
  CONTEXT+="Note: Jest has known hanging issues (see CLAUDE.md). Use Cypress for component tests: 'bun run component' or 'bun run e2e'.\n"
fi

# Static site architecture
if echo "$PROMPT" | grep -qE '(ssr|server.?side|middleware|redirect)'; then
  CONTEXT+="CRITICAL: This is a fully static site. No SSR, no middleware, no server-side redirects. Use client-side router.replace() in useEffect for redirects.\n"
fi

# Output context if any was generated
if [[ -n "$CONTEXT" ]]; then
  # Use JSON output for additionalContext
  jq -n --arg ctx "$CONTEXT" '{
    "hookSpecificOutput": {
      "hookEventName": "UserPromptSubmit",
      "additionalContext": $ctx
    }
  }'
fi

exit 0
