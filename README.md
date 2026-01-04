# ClickHouse Monitoring Dashboard

[![Build and Test](https://github.com/duyet/clickhouse-monitoring/actions/workflows/ci.yml/badge.svg)](https://github.com/duyet/clickhouse-monitoring/actions/workflows/ci.yml)
[![All-time uptime](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fduyet%2Fuptime%2FHEAD%2Fapi%2Fclickhouse-monitoring-vercel-app%2Fuptime.json)](https://duyet.github.io/uptime/history/clickhouse-monitoring-vercel-app)

A modern Next.js 16 dashboard that provides real-time insights into ClickHouse clusters through system tables. Features static site generation with client-side data fetching for optimal performance and CDN caching.

**Features:**

- **Query Monitoring**: Current queries, query history, resources (memory, parts read, file_open), expensive queries, most used tables/columns
- **Cluster Overview**: Memory/CPU usage, distributed queue, global settings, MergeTree settings, metrics
- **Data Explorer**: Interactive database tree browser with fast tab switching and column-level details
- **Table Analytics**: Size, row count, compression, part sizes with column-level granularity
- **Visualization**: 30+ metric charts for queries, resources, merges, performance, and system health
- **Developer Tools**: Zookeeper explorer, query EXPLAIN, query kill functionality
- **Multi-Host Support**: Monitor multiple ClickHouse instances from a single dashboard

## Demo

_The ClickHouse server running on my homelab so can be slow sometimes_:

- [clickhouse-monitoring.duyet.net](https://clickhouse-monitoring.duyet.net)
- [clickhouse-monitor.duyet.workers.dev](https://clickhouse-monitor.duyet.workers.dev) (Cloudflare Workers)

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

3. Deploy to Cloudflare Workers:
```bash
# Login to Cloudflare
npx wrangler login

# Set secrets and deploy
bun run cf:deploy
```

**Important Notes:**
- Build uses **Webpack** (not Turbopack) due to Cloudflare Workers compatibility
- Next.js version pinned to **16.0.7** (React 19) for stability
- Static pages are pre-rendered at edge for optimal performance
- API routes run on Workers using Fetch API
- Supports multi-host monitoring with query parameter routing (`?host=0`)

**Manual Deployment Steps:**
```bash
# Set secrets manually
bun run cf:config

# Build with webpack
bun run cf:build

# Deploy
wrangler deploy
```

### Docker

```bash
docker run -d \
  -p 3000:3000 \
  -e CLICKHOUSE_HOST=https://your-clickhouse-host.com \
  -e CLICKHOUSE_USER=default \
  -e CLICKHOUSE_PASSWORD=yourpassword \
  ghcr.io/duyet/clickhouse-monitoring:latest
```

## Documentation

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

## Screenshots

![](.github/screenshots/screenshot_1.png)
![](.github/screenshots/screenshot_2.png)
![](.github/screenshots/screenshot_3.png)
![](.github/screenshots/screenshot_4.png)
![](.github/screenshots/screenshot_5.png)
![](.github/screenshots/screenshot_6.png)
![](.github/screenshots/screenshot_7.png)
![](.github/screenshots/screenshot_8.png)

## Feedback and Contributions

Feedback and contributions are welcome! Feel free to open issues or submit pull requests.

## License

See [LICENSE](LICENSE).

---

![Alt](https://repobeats.axiom.co/api/embed/830f9ce7ba9e7a42f93630e2581506ca34c84067.svg 'Repobeats analytics image')

