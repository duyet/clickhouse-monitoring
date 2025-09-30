# Cloudflare Pages Deployment Guide

This guide explains how to deploy the ClickHouse Monitor application to Cloudflare Pages using OpenNext Cloudflare adapter.

## Prerequisites

- Cloudflare account
- GitHub repository connected to Cloudflare Pages
- Required secrets configured in GitHub:
  - `CLOUDFLARE_API_TOKEN` - API token with Pages deploy permissions
  - `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID

## Architecture

The application uses [@opennextjs/cloudflare](https://opennext.js.org/cloudflare) to adapt Next.js for Cloudflare Workers/Pages:

- **Build Process**: `pnpm cf:build` → generates `.open-next/` directory
- **Entry Point**: `.open-next/worker.js` (Cloudflare Worker)
- **Static Assets**: `.open-next/assets/` (served via Cloudflare CDN)
- **Configuration**: `wrangler.jsonc` and `open-next.config.ts`

## Local Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for Cloudflare
pnpm cf:build

# Preview locally with Cloudflare environment
pnpm cf:preview
```

## Deployment Methods

### 1. Automated Deployment (Recommended)

GitHub Actions workflow automatically deploys on push to `main` or `feat/cloudflare-pages-deployment` branches.

See: `.github/workflows/cloudflare-pages.yml`

### 2. Manual Deployment via CLI

```bash
# Build the application
pnpm cf:build

# Deploy to Cloudflare
pnpm cf:deploy

# Or upload to Cloudflare Workers
pnpm cf:upload
```

### 3. Cloudflare Dashboard

If deploying via Cloudflare dashboard:

1. Connect your GitHub repository
2. Configure build settings:
   - **Build command**: `pnpm install && pnpm cf:build`
   - **Build output directory**: `.open-next`
   - **Root directory**: `/` (project root)
   - **Node version**: 22

## Configuration

### wrangler.jsonc

Main Cloudflare Workers configuration:
- Entry point: `.open-next/worker.js`
- Assets directory: `.open-next/assets`
- Node.js compatibility enabled
- R2, D1, KV, and Durable Objects bindings configured

### open-next.config.ts

OpenNext Cloudflare adapter configuration:
- Incremental cache: KV namespace
- Tag cache: D1 database
- Queue: Durable Objects
- Cache interception enabled

## Environment Variables

Configure in Cloudflare dashboard under Pages → Settings → Environment variables:

- `CLICKHOUSE_HOST` - ClickHouse server URL(s)
- `CLICKHOUSE_USER` - Authentication username(s)
- `CLICKHOUSE_PASSWORD` - Authentication password(s)
- `CLICKHOUSE_NAME` - Optional custom name(s) for instances
- `CLICKHOUSE_MAX_EXECUTION_TIME` - Query timeout (default: 60)

## Bindings

The application requires these Cloudflare resources:

### KV Namespace
- **Binding**: `NEXT_INC_CACHE_KV`
- **Purpose**: Incremental static regeneration cache

### D1 Database
- **Binding**: `NEXT_TAG_CACHE_D1`
- **Database**: `clickhouse-monitor`
- **Purpose**: Next.js cache tags storage

### R2 Bucket
- **Binding**: `NEXT_INC_CACHE_R2_BUCKET`
- **Bucket**: `clickhouse-monitoring-inc-cache`
- **Purpose**: Large cache objects storage

### Durable Objects
- **Binding**: `NEXT_CACHE_DO_QUEUE`
- **Class**: `DOQueueHandler`
- **Purpose**: Background task processing

## Troubleshooting

### "The entry-point file at '.open-next/worker.js' was not found"

**Cause**: The build command didn't run `pnpm cf:build` to generate the `.open-next/` directory.

**Solutions**:
1. Ensure build command in Cloudflare dashboard is: `pnpm install && pnpm cf:build`
2. Check that GitHub Actions workflow runs successfully
3. Verify `.open-next/` is not in `.gitignore` (it should be, but Cloudflare builds it fresh)

### Build Failures

1. Check Node.js version is 22 or higher
2. Ensure pnpm is installed (automatic in GitHub Actions)
3. Review build logs for missing dependencies or configuration issues

### Runtime Errors

1. Verify all environment variables are set correctly
2. Check Cloudflare bindings (KV, D1, R2, DO) are created and configured
3. Review Cloudflare Workers logs for detailed error messages

## Resources

- [OpenNext Cloudflare Documentation](https://opennext.js.org/cloudflare)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
