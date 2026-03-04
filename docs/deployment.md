# Deployment Guide

This guide covers deploying the ClickHouse Monitor to Docker and Cloudflare Workers.

## Overview

The application uses a **single build process** that produces artifacts for multiple platforms:

- **Docker**: Produces `.next/standalone/server.js` - a Node.js server entry point
- **Cloudflare Workers**: Produces `.open-next/worker.js` - a Workers entry point via OpenNext

Both deployments originate from the same `next build` command with `output: 'standalone'` in `next.config.ts`.

---

## Build Artifacts

### What Each Build Produces

| Platform | Build Command | Entry Point | Description |
|----------|--------------|-------------|-------------|
| **Docker** | `docker build` | `.next/standalone/server.js` | Node.js standalone server with embedded dependencies |
| **Cloudflare** | `bun run cf:build` | `.open-next/worker.js` | Cloudflare Workers bundle via OpenNext |

### Build Artifacts Location

```
.next/standalone/         # Docker output
  ├── server.js           # Main server entry point
  ├── node_modules/       # Embedded production dependencies
  └── ...

.open-next/               # Cloudflare output
  ├── worker.js           # Workers entry point
  ├── assets/             # Static assets
  └── ...
```

### How `next build` Produces Both Outputs

The `next.config.ts` file sets `output: 'standalone'`, which tells Next.js to:

1. **For Docker**: Create `.next/standalone/` with a minimal Node.js server and all production dependencies bundled inline
2. **For Cloudflare**: The OpenNext Cloudflare adapter (`opennextjs-cloudflare build --skipBuild`) transforms the `.next/` output into a Workers-compatible bundle

The `--skipBuild` flag tells OpenNext to reuse the existing `.next/` build artifacts rather than running `next build` again.

---

## Docker Deployment

### Quick Start

```bash
# Build the Docker image
docker build -t clickhouse-monitor .

# Run with docker compose (includes ClickHouse)
docker compose up -d
```

### Build Details

The `Dockerfile` uses a multi-stage build:

1. **deps**: Install dependencies with `bun install --frozen-lockfile`
2. **builder**: Run `bun run build` to create `.next/standalone/`
3. **runner**: Production image with only necessary files

```dockerfile
# IMPORTANT: .next/standalone already contains all necessary production dependencies
# DO NOT copy node_modules from deps stage - this causes 438MB+ duplication
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
COPY --from=builder --chown=app:app /app/public ./public
```

### Environment Variables

The application requires these environment variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `CLICKHOUSE_HOST` | Yes | ClickHouse URL (e.g., `http://localhost:8123`) |
| `CLICKHOUSE_USER` | Yes | ClickHouse username (e.g., `default`) |
| `CLICKHOUSE_PASSWORD` | Yes | ClickHouse password |
| `PORT` | No | Server port (default: `3000`) |
| `HOSTNAME` | No | Server hostname (default: `0.0.0.0`) |

### Health Check

```bash
# Check if the application is running
bun run docker:health
```

This calls `http://localhost:3000/api/v1/health` and returns the status.

---

## Cloudflare Workers Deployment

### Prerequisites

1. Install Wrangler CLI:
   ```bash
   bun install
   ```

2. Login to Cloudflare:
   ```bash
   npx wrangler login
   ```

### Quick Start

```bash
# Deploy to Cloudflare Workers
bun run cf:deploy
```

This command:
1. **`bun run cf:config`** - Sets secrets from `.env.prod` or `.env.local` using Wrangler bulk API
2. **`bun run cf:build`** - Builds Next.js and transforms for Workers via OpenNext
3. **`wrangler deploy`** - Deploys to Cloudflare

### Environment Configuration

For Cloudflare Workers, environment variables are set in two ways:

#### 1. Non-Sensitive Variables ([vars] in `wrangler.toml`)

These are public and set in `wrangler.toml`:

```toml
[vars]
CLICKHOUSE_HOST = "https://your-clickhost.com"
CLICKHOUSE_USER = "default"
CLICKHOUSE_MAX_EXECUTION_TIME = "60"
CLOUDFLARE_WORKERS = "1"
```

#### 2. Secrets (via Wrangler)

Sensitive values are set via `wrangler secret put`:

```bash
# Set individually
wrangler secret put CLICKHOUSE_PASSWORD

# Or batch-set from .env.local
bun run cf:config
```

The `set-secrets.ts` script handles bulk secret setting from `.env.prod` or `.env.local`.

### Local Development

```bash
# Preview Cloudflare deployment locally
bun run cf:preview
```

### Health Check

```bash
# Check production deployment health
bun run cf:health
```

This calls the production Workers URL and checks the `/api/v1/health` endpoint.

### Cloudflare Resources

The deployment uses these Cloudflare resources:

| Resource | Binding | Purpose |
|----------|---------|---------|
| **R2 Bucket** | `NEXT_INC_CACHE_R2_BUCKET` | Next.js incremental static cache |
| **D1 Database** | `NEXT_TAG_CACHE_D1` | Next.js tag cache |
| **KV Namespace** | `NEXT_INC_CACHE_KV` | Next.js incremental cache |
| **Durable Objects** | `NEXT_CACHE_DO_QUEUE` | Next.js cache queue handler |

---

## Troubleshooting

### Docker

**Issue**: Container fails to start with connection errors

**Solution**: Ensure ClickHouse is accessible. Check `docker-compose.yml` depends_on configuration and ClickHouse health check.

### Cloudflare

**Issue**: `__name is not defined` error

**Solution**: This is caused by minification with `keep_names = true`. The `wrangler.toml` has `keep_names = false` to prevent this.

**Issue**: Build lock error

**Solution**: Remove `.next/lock` and retry:
```bash
rm -rf .next/lock
bun run cf:deploy
```

**Issue**: Wrangler secrets not updating

**Solution**: Use `wrangler secret bulk` instead of individual `put` commands. The `bun run cf:config` script handles this automatically.

---

## See Also

- [CLAUDE.md - Deployment Section](../CLAUDE.md) - Project-level deployment documentation
- [wrangler.toml](../wrangler.toml) - Full Cloudflare Workers configuration
- [.dev.vars.example](../.dev.vars.example) - Local development environment template
