Run promptfoo e2e agent tests.

Starts the dev server if needed, then runs promptfoo against the agent API at localhost:3000.

Usage: /test-agent-e2e [filter pattern]

Arguments:
- $ARGUMENTS - Optional filter pattern to run specific tests (e.g., "greeting" or "query tool")

Steps:
1. Check if dev server is running at http://localhost:3000/api/healthz
2. If not running, start it with `bun run dev` in the background and wait until healthy
3. Run: `AGENT_API_TOKEN=16bc4bae467d8726b5b2baacc42741bc4bc5590735221962c3c3538bd6e91357 bunx promptfoo eval -c tests/agent/promptfooconfig.yaml --no-cache --max-concurrency 1` (add `--filter-pattern "$ARGUMENTS"` if arguments provided)
4. Report the results table and pass/fail summary
5. Kill the dev server if we started it
