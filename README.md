# ClickHouse Monitoring Dashboard

[![Build and Test](https://github.com/duyet/clickhouse-monitoring/actions/workflows/ci.yml/badge.svg)](https://github.com/duyet/clickhouse-monitoring/actions/workflows/ci.yml)
[![All-time uptime](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fduyet%2Fuptime%2FHEAD%2Fapi%2Fclickhouse-monitoring-vercel-app%2Fuptime.json)](https://duyet.github.io/uptime/history/clickhouse-monitoring-vercel-app)

A modern Next.js 15 dashboard that provides real-time insights into ClickHouse clusters through system tables. Features static site generation with client-side data fetching for optimal performance and CDN caching.

**Features:**

- **Query Monitoring**: Running queries, query history, resources (memory, parts read, file_open), expensive queries, slow queries, failed queries, query profiler
- **Cluster Overview**: Memory/CPU usage, distributed queue, global settings, MergeTree settings, metrics, asynchronous metrics
- **Data Explorer**: Interactive database tree browser with fast tab switching and column-level details, projections, dictionaries
- **Table Analytics**: Size, row count, compression, part sizes with column-level granularity, detached parts, readonly tables, view refreshes
- **Visualization**: 30+ metric charts for queries, resources, merges, performance, and system health
- **Merge & Replication**: Merge operations, merge performance, replication queue, replicas
- **Security & Access**: Users, roles, security settings
- **Developer Tools**: Zookeeper explorer, query EXPLAIN, query kill, distributed DDL queue, mutations
- **Multi-Host Support**: Monitor multiple ClickHouse instances from a single dashboard
- **AI Agent**: Built-in AI chat for natural language queries against your ClickHouse cluster
- **MCP Server**: Model Context Protocol endpoint for AI tool integration (Claude, Cursor, etc.)
- **Rust CLI**: Standalone terminal and TUI monitoring tool

## Demo

_The ClickHouse server running on my homelab so can be slow sometimes_:

- [chmonitor.dev](https://chmonitor.dev) (Cloudflare Workers)
- [clickhouse-monitoring.duyet.net](https://clickhouse-monitoring.duyet.net)
- [clickhouse-monitor.duyet.workers.dev](https://clickhouse-monitor.duyet.workers.dev) (Cloudflare Workers legacy)

## Deployment

### Cloudflare Workers

This project supports deployment to Cloudflare Workers with static site generation and API routes.

**Prerequisites:**
- Node.js 18+ and Bun
- Cloudflare Workers account
- Wrangler CLI: `npm install -g wrangler`

**Setup:**

1. Clone and install dependencies:
```bash
git clone https://github.com/duyet/clickhouse-monitoring.git
cd clickhouse-monitoring
bun install
```

2. Configure environment variables in `.env.local`:
```bash
CLICKHOUSE_HOST=https://your-clickhouse-host.com
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=yourpassword
CLICKHOUSE_TZ=UTC
```

Optional API-key protection for `/api/v1/*` routes:

```bash
CHM_API_KEY_SECRET=your-signing-secret
```

Optional Clerk UI/session support:

```bash
CHM_AUTH_PROVIDER=clerk
NEXT_PUBLIC_AUTH_PROVIDER=clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_key
CLERK_SECRET_KEY=sk_live_your_key
```

Feature permissions default to enabled and public. Add sparse overrides when a
deployment should hide or protect a feature:

```toml
# /etc/clickhouse-monitor/config.toml
[features.agent]
access = "authenticated"

[features.metrics]
enabled = false
```

`access = "guest"` is accepted as an alias for `access = "public"`.

```bash
CHM_CONFIG_FILE=/etc/clickhouse-monitor/config.toml
# or env-only:
CHM_FEATURE_AGENT_ACCESS=authenticated
CHM_DISABLED_FEATURES=settings,metrics
```

Leave auth provider env unset or set it to `none` for self-hosted deployments
without auth.

3. Deploy to Cloudflare Workers:
```bash
# Set CLOUDFLARE_API_TOKEN in .env.prod or export it
# OR use OAuth: npx wrangler login

# Unified deploy (config, build, deploy, cache — same as CI)
bun run cf:deploy
```

**Manual Deployment Steps:**
```bash
# Step by step (same as CI)
bun run cf:config      # Set secrets from .env.prod
bun run cf:build       # Next.js build + OpenNext
wrangler deploy --minify
opennextjs-cloudflare populateCache remote
```

**Important Notes:**
- Build uses **Webpack** (not Turbopack) due to Cloudflare Workers compatibility
- Next.js version pinned to **15.5.x** (React 19) for stability
- Static pages are pre-rendered at edge for optimal performance
- API routes run on Workers using Fetch API
- Supports multi-host monitoring with query parameter routing (`?host=0`)

### Docker

```bash
docker run -d \
  -p 3000:3000 \
  -e CLICKHOUSE_HOST=https://your-clickhouse-host.com \
  -e CLICKHOUSE_USER=default \
  -e CLICKHOUSE_PASSWORD=yourpassword \
  ghcr.io/duyet/clickhouse-monitoring:latest
```

### Releases

Tagged releases are built by GitHub Actions from tags matching `v*`. The release page includes:

- Docker images published to `ghcr.io/duyet/clickhouse-monitoring` with the release version tag
- a Next.js standalone archive for Node.js deployments
- a Cloudflare Workers/OpenNext archive for manual inspection or deployment
- generated release notes with CLI command usage, Docker tags, deployment steps, and checksums

For repeatable Docker deploys, prefer the versioned image tag from the release page instead of `latest`.

## Documentation

- **[/docs](/docs)** - Full documentation site (local/docs)
- **llms.txt** - AI agent discovery file for automated code understanding
- https://zread.ai/duyet/clickhouse-monitoring _(AI Generated)_
- https://duyet.github.io/clickhouse-monitoring
  - [Getting Started](https://duyet.github.io/clickhouse-monitoring/getting-started)
    - [Local Development](https://duyet.github.io/clickhouse-monitoring/getting-started/local)
    - [User Role and Profile](https://duyet.github.io/clickhouse-monitoring/getting-started/clickhouse-requirements)
    - [Enable System Tables](https://duyet.github.io/clickhouse-monitoring/getting-started/clickhouse-enable-system-tables)
  - [Deployments](https://duyet.github.io/clickhouse-monitoring/deploy)
    - [Vercel](https://duyet.github.io/clickhouse-monitoring/deploy/vercel)
    - [Docker](https://duyet.github.io/clickhouse-monitoring/deploy/docker)
    - [Kubernetes Helm Chart](https://duyet.github.io/clickhouse-monitoring/deploy/k8s)
  - [Advanced](https://duyet.github.io/clickhouse-monitoring/advanced)

### AI Agent Access

**llms.txt** — standardized file that helps AI coding agents discover and understand the codebase structure. Access at `https://your-domain.com/llms.txt` or `/llms.txt` in local development.

**MCP Server** — exposes a Model Context Protocol endpoint at `/api/mcp` for AI tools to query your ClickHouse cluster directly. See [docs/knowledge/mcp-server.md](docs/knowledge/mcp-server.md) for setup.

**Knowledge Graph** — developer-facing notes in `docs/knowledge/` with decisions, conventions, and architecture docs. See [docs/knowledge/README.md](docs/knowledge/README.md) for the index.

## Screenshots

![](.github/screenshots/screenshot_1.png)
![](.github/screenshots/screenshot_2.png)
![](.github/screenshots/screenshot_3.png)
![](.github/screenshots/screenshot_4.png)
![](.github/screenshots/screenshot_5.png)
![](.github/screenshots/screenshot_6.png)
![](.github/screenshots/screenshot_7.png)
![](.github/screenshots/screenshot_8.png)
![](.github/screenshots/screenshot_9.png)
![](.github/screenshots/screenshot_10.png)

## Feedback and Contributions

Feedback and contributions are welcome! Feel free to open issues or submit pull requests.

## License

See [LICENSE](LICENSE).

---

![Alt](https://repobeats.axiom.co/api/embed/830f9ce7ba9e7a42f93630e2581506ca34c84067.svg 'Repobeats analytics image')
