---
title: "Features"
editUrl: "https://github.com/duyet/clickhouse-monitoring/edit/main/docs/content/features.mdx"
sidebar:
  label: Overview
  order: 0
---

chmonitor is organized around the operational questions you answer while running a ClickHouse cluster. Each feature maps to one or more routes in the UI and a feature id you can use to control access or disable it.

All features are **public and enabled by default**. You only configure what you want to restrict or turn off.

## Feature index

| Feature | What it answers | Feature id | Page |
|---|---|---|---|
| Overview | Is my cluster healthy right now? | `overview` | [Overview](/features/overview) |
| Query Monitoring | What queries are running or slow? | `queries` | [Query Monitoring](/features/queries) |
| Tables & Storage | How big are my tables? Where is disk going? | `tables` | [Tables & Storage](/features/tables) |
| Data Explorer | What columns/dependencies does this table have? | `tables` | [Data Explorer](/features/explorer) |
| Merges & Operations | Are merges/mutations keeping up? | `operations` | [Merges & Operations](/features/operations) |
| Clusters & Replication | Is replication lagging? Are replicas healthy? | `cluster` | [Clusters & Replication](/features/cluster) |
| Metrics & Profiler | What are the server's CPU/memory/IO metrics? | `metrics` | [Metrics & Profiler](/features/metrics) |
| Insights | What patterns or anomalies does the AI surface? | `insights` | [Insights](/features/insights) |
| Health & Alerting | Are there active alerts? | `health` | [Health & Alerting](/features/health) |
| Security & Audit | Who is accessing ClickHouse and how? | `security` | [Security & Audit](/features/security) |
| Logs | What did the server log? | `logs` | [Logs](/features/logs) |
| Dashboard | Custom pinned metrics view | `dashboard` | [Dashboard](/features/dashboard) |
| AI Agent | Natural language questions about my cluster | `agent` | [AI Agent](/ai-agent) |
| MCP Server | ClickHouse monitoring tools for AI clients | `mcp` | [MCP Server](/features/mcp) |
| PeerDB | PeerDB replication pipeline status | `peerdb` | [PeerDB](/features/peerdb) |
| Browser Connections | Personal ad-hoc connections stored in the browser | — | [Browser Connections](/features/browser-connections) |
| Actions | Row-level actions across data pages (kill query, optimize, etc.) | `actions` | — |
| Settings | In-app settings and configuration | `settings` | [Settings](/settings) |
| Authentication | Who can sign in and what each visitor may access | — | [Authentication](/authentication) |

## Controlling features

Disable or restrict any feature with environment variables:

```bash
## Disable a feature entirely
CHM_FEATURE_AGENT_ENABLED=false

## Require authentication for a feature
CHM_FEATURE_AGENT_ACCESS=authenticated

## Restrict multiple features at once
CHM_AUTH_REQUIRED_FEATURES=agent,mcp,settings,actions

## Disable multiple features at once
CHM_DISABLED_FEATURES=peerdb,browser-connections
```

Or use a config file for complex setups:

```bash
CHM_CONFIG_FILE=/etc/clickhouse-monitor/config.toml
```

```toml
[features.agent]
access = "authenticated"

[features.mcp]
access = "authenticated"

[features.peerdb]
enabled = false
```

See [Feature Permissions](/advanced/feature-permissions) for the full reference.
