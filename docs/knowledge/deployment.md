---
id: deployment
title: Deployment Guide
type: reference
status: active
updated: 2026-05-13
tags:
  - deployment
  - docker
  - cloudflare-workers
related:
  - secret-rotation
  - static-site-architecture
  - memory-optimization
---

# Deployment Guide

Dual deployment support: Docker and Cloudflare Workers from the same codebase.

## Build Artifacts

| Platform | Build Command | Entry Point |
|----------|--------------|-------------|
| **Docker** | `docker build` | `.next/standalone/server.js` |
| **Cloudflare** | `bun run cf:build` | `.open-next/worker.js` |

Both use `next build` with `output: 'standalone'` in `next.config.ts`.

## Unified Cloudflare Deploy (CI + Local)

The same script deploys from both CI and local:

```bash
bun run cf:deploy
```

This runs `scripts/cloudflare-deploy.ts` which executes:

1. `bun run cf:build` — Next.js build + OpenNext transform
2. `wrangler deploy --minify` — Deploy to Workers
3. `opennextjs-cloudflare populateCache remote` — Populate KV cache

**Auth priority**:
1. `CLOUDFLARE_API_TOKEN` env var (set in `.env.prod` or CI secrets)
2. `wrangler login` OAuth (localhost fallback)

### Step-by-step (equivalent to CI)

```bash
bun run cf:config    # Set secrets from .env.prod
bun run cf:build     # Build + OpenNext transform
wrangler deploy --minify
opennextjs-cloudflare populateCache remote
```

### CI

Production deploys on push to `main` via `.github/workflows/cloudflare.yml`. It uses
the same `bun run cf:build` command and the same env var names — secrets come
from GitHub Secrets instead of local files.

## Docker

```bash
# Quick start with docker compose
docker compose up -d

# Or build manually
docker build -t clickhouse-monitor .
docker run -d -p 3000:3000 \
  -e CLICKHOUSE_HOST=https://your-host.com \
  -e CLICKHOUSE_USER=default \
  -e CLICKHOUSE_PASSWORD=yourpassword \
  ghcr.io/duyet/chmonitor:latest
```

### Multi-stage Build

1. **deps**: `bun install --frozen-lockfile`
2. **builder**: `bun run build` → `.next/standalone/`
3. **runner**: Production image with only necessary files

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CLICKHOUSE_HOST` | Yes | ClickHouse URL |
| `CLICKHOUSE_USER` | Yes | Username |
| `CLICKHOUSE_PASSWORD` | Yes | Password |
| `PORT` | No | Server port (default: 3000) |

### Health Check

```bash
bun run docker:health
```

## Cloudflare Environment Configuration

**Non-sensitive** (`wrangler.toml` `[vars]`):
```toml
CLICKHOUSE_HOST = "https://your-host.com"
CLICKHOUSE_USER = "default"
CLICKHOUSE_MAX_EXECUTION_TIME = "60"
CLOUDFLARE_WORKERS = "1"
```

**Secrets** (set via `bun run cf:config` or manually):
```bash
wrangler secret put CLICKHOUSE_PASSWORD
```

### Cloudflare Resources

| Resource | Binding | Purpose |
|----------|---------|---------|
| R2 Bucket | `NEXT_INC_CACHE_R2_BUCKET` | Incremental static cache |
| D1 Database | `NEXT_TAG_CACHE_D1` | Tag cache |
| KV Namespace | `NEXT_INC_CACHE_KV` | Incremental cache |
| Durable Objects | `NEXT_CACHE_DO_QUEUE` | Cache queue handler |

### Health Check

```bash
bun run cf:health
```

## Edge Routing & Host Redirects (4-worker topology)

Production runs four workers on the `chmonitor.dev` zone:

| Worker | Host / route |
|--------|--------------|
| `chmonitor-landing` | `chmonitor.dev` (apex marketing) |
| `chmonitor-dash` | `dash.chmonitor.dev` + `cloud.chmonitor.dev` (custom domains) |
| `chmonitor-mcp` | `dash.chmonitor.dev/api/mcp*` + `/api/v1/mcp/info*` (Workers Routes) |
| `chmonitor-docs` | `docs.chmonitor.dev` |

A specific Workers **Route** (`.../api/mcp*`) wins over a whole-hostname
**Custom Domain** (`dash.chmonitor.dev`) — sub-path routes are more specific —
so the MCP worker intercepts `/api/mcp` even though the dashboard owns the host.

**`cloud.chmonitor.dev` → `dash.chmonitor.dev` 301** is a Cloudflare edge
**Redirect Rule**, NOT Next.js middleware. `middleware.ts` cannot redirect the
prerendered static root: OpenNext serves `/` as an asset without invoking the
worker, so the host-redirect code never runs. A zone Redirect Rule fires at the
edge *before* the worker, covering every path uniformly. Provision/refresh it
(idempotent) with a `CLOUDFLARE_API_TOKEN` scoped to **Zone › Single Redirect ›
Edit** (manages the rule) **and Zone › Zone › Read** (the script resolves the
zone id first, so a token missing read still fails):

```bash
bun run cf:redirect-rule            # apply
bun run cf:redirect-rule --dry-run  # preview the ruleset payload
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Docker connection errors | Check ClickHouse accessibility and docker-compose depends_on |
| `__name is not defined` (CF) | `wrangler.toml` has `keep_names = false` |
| Build lock error | Remove `.next/lock` and retry |
| Secrets not updating | See [secret-rotation.md](secret-rotation.md) — redeploy after updating |
| `/api/mcp` → 503 "MCP API key auth is not configured" | `CHM_API_KEY_SECRET` empty on `chmonitor-mcp`. Worker secrets don't survive a rename. Set the GitHub secret (`bun run gh:sync-secrets`) and redeploy; CI pushes it to both workers. |
| `cloud.chmonitor.dev` returns 200 instead of 301 | Edge Redirect Rule missing — run `bun run cf:redirect-rule`. Middleware can't fix this (prerendered root skips the worker). |
