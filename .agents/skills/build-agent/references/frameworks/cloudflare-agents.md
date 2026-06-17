# Cloudflare Agents SDK

Build **stateful, durable agents on Cloudflare Workers**, backed by Durable
Objects. Each agent instance is an addressable, persistent object that can hold
state, run on a schedule, hibernate, and wake on events — scales to zero.

**Live docs:** https://developers.cloudflare.com/agents/ ·
llms: https://developers.cloudflare.com/agents/llms-full.txt ·
npm `agents` · CLI `wrangler`

## Glossary
- **`Agent` class** — your agent, one Durable Object instance per id.
- **Durable Object** — single-threaded, strongly-consistent stateful compute.
- **`this.setState` / `sql`** — built-in persistence (KV-ish state + embedded SQL).
- **WebSocket / `onMessage`** — real-time bidirectional chat; hibernatable.
- **`schedule()`** — cron/delayed self-invocation for long-running work.
- **AI Gateway / Workers AI** — model access + caching/observability at the edge.
- **MCP on Workers** — host an MCP server as a Worker (host skill: `building-mcp-server-on-cloudflare`).

## When to choose
Edge-native, low-latency, globally distributed agents; durable per-user/session
state without managing a database; pay-per-use scale-to-zero.

## Before coding
Use host skills `building-ai-agent-on-cloudflare`, `agents-sdk`, `wrangler`,
`workers-best-practices`, or Cloudflare docs MCP. Verify `wrangler.jsonc`
bindings and Durable Object migration config against current docs.
