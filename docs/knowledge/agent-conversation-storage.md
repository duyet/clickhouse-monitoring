---
id: agent-conversation-storage
title: Agent Conversation Storage
type: spec
status: active
updated: 2026-06-06
related:
  - deployment
  - secret-rotation
  - static-site-architecture
tags:
  - ai-agent
  - persistence
  - cloudflare
  - clickhouse
---

# Agent Conversation Storage

## Rule

Agent chat history defaults to browser localStorage. Server persistence is
enabled only with `AGENT_CONVERSATION_PERSISTENCE=true` and selected at runtime
with `AGENT_CONVERSATION_STORE`.

## Why

ClickHouse monitor supports read-only self-hosted deployments and Cloudflare
Workers deployments. A build-time public flag cannot safely choose between
AgentState, D1, Durable Objects, ClickHouse, Postgres, memory, and local storage
after deployment.

## How To Apply

- Keep storage code behind `lib/conversation-store/resolve-store.ts`.
- Keep adapter-specific details in one backend file per store.
- Persist agent turns from `/api/v1/agent` finish callbacks, not partial stream
  updates.
- Require authenticated user identity for server stores. Unauthenticated
  sessions use local browser history.
- Use `CHM_CLOUD_D1` only for conversation D1 migrations. Never fall back to
  `NEXT_TAG_CACHE_D1`.
- Active Wrangler D1 bindings need a concrete `database_id`. Deploys should use
  `scripts/prepare-dashboard-wrangler.ts` so unprovisioned optional
  `CHM_CLOUD_D1` bindings are removed unless `CHM_CLOUD_D1_DATABASE_ID`
  is set.
- Prefer D1 over Durable Objects for ordinary Cloudflare history because D1 is a
  managed queryable database. Use Durable Objects when per-user coordination is
  the core requirement.

## Code References

- `apps/dashboard/lib/conversation-store/config.ts`
- `apps/dashboard/lib/conversation-store/resolve-store.ts`
- `apps/dashboard/lib/conversation-store/persist-agent-turn.ts`
- `apps/dashboard/app/api/v1/agent/route.ts`
- `apps/dashboard/app/api/v1/conversations/status/route.ts`
