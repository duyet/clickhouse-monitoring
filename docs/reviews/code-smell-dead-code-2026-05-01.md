# Code Smell and Dead Code Review - 2026-05-01

Scope: recent changes since the last automation run on 2026-04-29, focused on
agent chat extraction, chart primitive updates, history query filters, and the
WASM benchmark pilot.

## Findings

### Warning: WASM test file used a production-looking suffix

- File: `lib/wasm/monitor-core.wasm.ts:4` and `package.json:48`
- Severity: warning
- Confidence: confident
- Evidence:
  - `lib/wasm/monitor-core.wasm.ts` contains Bun test globals
    `describe`, `it`, and `expect`.
  - `tsconfig.json` excludes `**/*.test.ts` and `**/*.test.tsx`, but not
    `*.wasm.ts`, so the file name made test-only code look like runtime code
    to TypeScript and dead-code scans.
  - `rg -n "monitor-core.wasm.ts" --glob '!**/*.test.*' --glob '!**/*.cy.*'`
    showed the only non-test reference was the `wasm:test` package script.
- Fix:
  - Renamed the file to `lib/wasm/monitor-core.wasm.test.ts`.
  - Updated `wasm:test` to use the new path.
- Behavior:
  - No runtime behavior change. The same test still runs through the package
    script, but the file now follows the repository test-file convention.

### Info: unused chat message prop

- File: `components/agents/chat/message.tsx:39` and
  `components/agents/agents-chat-area.tsx:350`
- Severity: info
- Confidence: confident
- Evidence:
  - `rg -n "allMessages|ChatMessage\\b" components app lib --glob '!**/*.test.*' --glob '!**/*.cy.*'`
    showed `allMessages` was passed only from `AgentsChatArea` to
    `ChatMessage`.
  - Inside `ChatMessage`, the prop was destructured as `_allMessages` and was
    never read.
- Fix:
  - Removed the unused prop from the component interface, destructuring, and
    call site.
- Behavior:
  - No runtime behavior change. The removed value was not read.

## Dead Code Check

No other confident dead-code removals were found in the reviewed files.

- `AgentChatHeader`, `AgentChatCompactControls`, and `AgentChatEmptyState`
  are referenced from `components/agents/agents-chat-area.tsx`.
- `ResultTable`, `renderToolOutput`, and `AgentToolPart` are live within the
  extracted chat tool-output renderer.
- `getHistoryQuerySearchParams` is used by `app/history-queries/page.tsx`;
  tests were excluded from the dead-code decision.
- WASM helpers are referenced by `lib/clickhouse/clickhouse-fetch.ts`,
  `scripts/bench-wasm.ts`, `scripts/build-wasm.ts`, and the renamed test.

## Code Smell Check

No critical maintainability issues were found that could be fixed without
changing behavior.
