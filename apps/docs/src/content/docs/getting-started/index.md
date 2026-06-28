---
title: "Getting Started"
editUrl: "https://github.com/duyet/clickhouse-monitoring/edit/main/docs/content/getting-started.mdx"
sidebar:
  label: Overview
  order: 0
---

The fastest path: run chmonitor against an existing ClickHouse instance using Docker. You need three environment variables and one command.

## Prerequisites

- A running ClickHouse instance reachable from where you deploy.
- A ClickHouse user with `SELECT` on `system.*` (see [ClickHouse user & grants](/getting-started/clickhouse-requirements)).
- Docker installed locally.

## Run with Docker

Replace `vX.Y.Z` with a real release tag from [GitHub releases](https://github.com/duyet/clickhouse-monitoring/releases):

```bash
docker run -d \
  --name chmonitor \
  -p 3000:3000 \
  -e CLICKHOUSE_HOST=http://your-clickhouse-host:8123 \
  -e CLICKHOUSE_USER=monitoring \
  -e CLICKHOUSE_PASSWORD=your-password \
  ghcr.io/duyet/chmonitor:vX.Y.Z
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** If ClickHouse runs on the same Docker host, use the host gateway address instead of `localhost`. On Linux that is typically `172.17.0.1`; on Mac/Windows use `host.docker.internal`.

## Verify it works

The overview page loads immediately. If pages are empty or show errors:

1. Check the container logs: `docker logs chmonitor`
2. Confirm the ClickHouse user can query `system.query_log` directly.
3. See [Enable system tables](/getting-started/clickhouse-enable-system-tables) if some tables are missing.

## Next steps

| Task | Guide |
|---|---|
| Create a safe read-only monitoring user | [ClickHouse user & grants](/getting-started/clickhouse-requirements) |
| Enable system log tables for full feature coverage | [Enable system tables](/getting-started/clickhouse-enable-system-tables) |
| Deploy to Kubernetes, Cloudflare, or Vercel | [Install & Configure](/deploy) |
| Require login before accessing the dashboard | [Authentication](/authentication) |
| Set up the AI agent | [AI Agent](/ai-agent) |
| Develop locally from source | [Local development](/getting-started/local) |
