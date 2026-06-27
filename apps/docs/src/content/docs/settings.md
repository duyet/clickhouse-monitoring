---
title: "Settings"
editUrl: "https://github.com/duyet/clickhouse-monitoring/edit/main/docs/content/settings.mdx"
---

The in-app Settings page (feature id: `settings`, route `/settings`) lets operators configure alert thresholds, manage browser connections, tune agent session options, and change the UI theme — without redeploying.

To reach it, open the dashboard and click **Settings** in the navigation.

## What you can configure in-app

| Setting area | What you control |
|---|---|
| Alert thresholds | CPU %, memory %, replication lag limits for health sweep alerts |
| Browser connections | Add/remove personal ClickHouse connections stored in the browser |
| Agent session | Model picker, token/cost display, conversation store selection |
| Theme | Light / dark / system |

Settings changes made in-app are stored per browser session or in the configured conversation store. They do not affect server-side environment variables.

## Conversation History (agent settings sidebar)

The agent settings sidebar includes a **read-only** "Conversation History" section that names the backend currently storing agent chats. The backend is chosen at deploy time by environment variables — it cannot be switched from the UI. Labels you may see:

| Label | Meaning |
|---|---|
| **Browser** | History stays in `localStorage` (server persistence is off) |
| **AgentState** | Managed/self-hosted [AgentState](https://agentstate.app) service; when AI enrichment is on, the chat also suggests follow-up questions |
| **D1** | Cloudflare D1 (SQLite) database |
| **Postgres** | A PostgreSQL-compatible database |

To change the active backend, set the relevant server-side env vars and redeploy. See [Conversation history backends](/ai-agent#conversation-history-backends) in the AI Agent docs for the full env-var reference and setup steps.

## Gating or disabling Settings

By default, the Settings page is **public** — any visitor can open it. To restrict or remove it:

```bash
## Require authentication to access Settings
CHM_FEATURE_SETTINGS_ACCESS=authenticated

## Disable the Settings page entirely (removes it from nav)
CHM_FEATURE_SETTINGS_ENABLED=false
```

Or in a config file:

```toml
[features.settings]
access = "authenticated"
```

## Server-side configuration

Most operational configuration is done through environment variables, not the in-app Settings UI. Key variables:

**ClickHouse connection**

```bash
CLICKHOUSE_HOST=https://your-clickhouse-host:8443
CLICKHOUSE_USER=monitoring
CLICKHOUSE_PASSWORD=change-me

## Multi-host (comma-separated, same index across all four)
CLICKHOUSE_HOST=https://prod-a:8443,https://prod-b:8443
CLICKHOUSE_USER=monitoring,monitoring
CLICKHOUSE_PASSWORD=secret-a,secret-b
CLICKHOUSE_NAME=prod-a,prod-b
```

**Query runtime**

```bash
CLICKHOUSE_MAX_EXECUTION_TIME=60    # seconds
CLICKHOUSE_TZ=UTC
NEXT_QUERY_CACHE_TTL=3600           # seconds; lower for fresher data
```

**Feature permissions**

```bash
CHM_FEATURE_AGENT_ACCESS=authenticated
CHM_FEATURE_SETTINGS_ACCESS=authenticated
CHM_AUTH_REQUIRED_FEATURES=agent,mcp,settings,actions
CHM_DISABLED_FEATURES=peerdb
```

**Health alerting**

```bash
HEALTH_ALERT_ENABLED=true
HEALTH_ALERT_WEBHOOK_URL=https://hooks.slack.com/...
HEALTH_ALERT_MIN_SEVERITY=warning
CRON_SECRET=your-cron-endpoint-secret
```

**AI agent**

```bash
LLM_API_KEY=your-key
LLM_API_BASE=https://openrouter.ai/api/v1
LLM_MODEL=openrouter/free
```

**Conversation persistence**

```bash
AGENT_CONVERSATION_PERSISTENCE=true
AGENT_CONVERSATION_STORE=auto
```

**Branding (build-time, TanStack app)**

```bash
VITE_TITLE_SHORT=ClickHouse
VITE_LOGO=https://example.com/logo.svg
VITE_MEASUREMENT_ID=G-XXXXXXXXXX
```

> The legacy Next.js app (v0.2 and earlier) used `NEXT_PUBLIC_*` equivalents for these client-side variables.

## Related

- [Feature Permissions](/advanced/feature-permissions) — full reference for `CHM_FEATURE_*` env
- [Authentication](/authentication) — setting up Clerk, Cloudflare Access, or proxy auth
- [AI Agent](/ai-agent) — agent configuration and conversation store options
- [Install & Configure](/deploy) — platform-specific deployment with all env vars
