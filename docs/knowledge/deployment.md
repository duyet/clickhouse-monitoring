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
  ghcr.io/duyet/clickhouse-monitoring:latest
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

## Cloudflare Workers

```bash
# Login
npx wrangler login

# Full deploy (config + build + deploy)
bun run cf:deploy

# Or step by step
bun run cf:config    # Set secrets from .env.local
bun run cf:build     # Build + OpenNext transform
wrangler deploy      # Deploy
```

### Environment Configuration

**Non-sensitive** (`wrangler.toml` `[vars]`):
```toml
CLICKHOUSE_HOST = "https://your-host.com"
CLICKHOUSE_USER = "default"
CLICKHOUSE_MAX_EXECUTION_TIME = "60"
CLOUDFLARE_WORKERS = "1"
```

**Secrets** (via Wrangler):
```bash
wrangler secret put CLICKHOUSE_PASSWORD
# Or batch: bun run cf:config
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

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Docker connection errors | Check ClickHouse accessibility and docker-compose depends_on |
| `__name is not defined` (CF) | `wrangler.toml` has `keep_names = false` |
| Build lock error | Remove `.next/lock` and retry |
| Secrets not updating | See [secret-rotation.md](secret-rotation.md) — redeploy after updating |
