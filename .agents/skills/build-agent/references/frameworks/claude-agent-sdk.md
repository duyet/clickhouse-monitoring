# Claude Agent SDK

The SDK that powers Claude Code, exposed for building your own agents on the same
harness: the agent loop, tool use, **subagents**, **MCP**, **hooks**,
**permissions**, and session management. Best when you want a capable coding/
computer-use agent or to embed Claude Code-style behavior.

**Live docs:** https://docs.claude.com/en/api/agent-sdk/overview ·
Python `claude-agent-sdk` · TS `@anthropic-ai/claude-agent-sdk` ·
host skills: `agents-sdk`, `claude-api`; agents: `agent-sdk-dev:*`

## Glossary
- **`query()` / streaming** — run the agent loop, stream messages/events.
- **Tools** — built-in (file ops, bash, web) + custom; MCP servers as tools.
- **Subagents** — delegate scoped tasks with their own context/tools.
- **Hooks** — deterministic shell/code on lifecycle events (pre/post tool, stop).
- **Permissions / modes** — allow/deny tool use; `bypassPermissions` for autonomy.
- **MCP** — connect external tool servers (stdio / HTTP).
- **System prompt + settings** — shape behavior; reuse Claude Code config.

## When to choose
Coding agents, computer-use, autonomous multi-step tasks, or anything that
benefits from Claude Code's battle-tested loop, subagents, and MCP — in Python
or TypeScript.

## Before coding
Use the host `agents-sdk` / `claude-api` skills and the `agent-sdk-dev`
verifier agents. Confirm current model ids (e.g. `claude-opus-4-8`,
`claude-sonnet-4-6`) and `query()` options against live docs.
