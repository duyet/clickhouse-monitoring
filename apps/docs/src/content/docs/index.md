---
title: "Introduction"
editUrl: "https://github.com/duyet/clickhouse-monitoring/edit/main/docs/content/index.mdx"
---

chmonitor is a client-rendered ClickHouse monitoring dashboard. The core dashboard reads from ClickHouse `system.*` tables and renders query performance, storage, cluster health, and operational metrics directly in the browser. No SSR of your ClickHouse data; no database writes except optional self-tracking events.

It also ships an AI agent that can answer natural-language questions about your cluster, and an MCP server that exposes monitoring tools to external AI clients.

## Who it's for

- **Self-hosting teams** who run ClickHouse on their own infrastructure and need an operational dashboard they can deploy and own.
- **Operators** who want to inspect running queries, track storage growth, monitor replication lag, or debug merge performance without writing ad-hoc queries by hand.
- **Platform engineers** who want to integrate ClickHouse monitoring into their existing auth and deployment stack (Docker, Kubernetes, Cloudflare Workers).

## What it is not

chmonitor is read-only by default. It does not manage schema, run DDL, or modify ClickHouse configuration. Optional action grants (kill query, optimize table) are off by default.

## Pick your path

| I want to… | Start here |
|---|---|
| Get a dashboard running in 5 minutes | [Getting Started](/getting-started) |
| Install on Docker, Kubernetes, or Cloudflare | [Install & Configure](/deploy) |
| Add authentication | [Authentication](/authentication) |
| Understand what pages do what | [Features](/features) |
| Set up the AI agent | [AI Agent](/ai-agent) |
| See all environment variables | [Reference](/reference/environment-variables) |
