---
title: "Browser Connections"
editUrl: "https://github.com/duyet/clickhouse-monitoring/edit/main/docs/content/features/browser-connections.mdx"
---

> Add personal ClickHouse connections in the browser and query them via the chmonitor proxy — without touching server config.

| | |
|---|---|
| **Routes** | (app shell, connection selector in header) |
| **Feature id** | (none — part of the app shell, not a gated feature) |
| **Default access** | `public` |
| **Requires auth** | No |
| **System tables** | None |
| **ClickHouse grants** | Whatever the connection's user has |

## What it does

chmonitor normally connects to ClickHouse using the server-side `CLICKHOUSE_HOST`, `CLICKHOUSE_USER`, and `CLICKHOUSE_PASSWORD` environment variables. Browser Connections lets individual users add extra ClickHouse hosts directly in their browser, without changing server config.

When a user adds a connection, the credentials are stored in **encrypted browser localStorage** (AES-256-GCM with a device-bound key). When they query, chmonitor creates a short-lived **session token** server-side; subsequent chart/table requests use the token instead of sending the password on every request. All queries still proxy through the chmonitor server — the browser never opens a direct connection to ClickHouse.

This is useful for:

- Personal development: quickly point chmonitor at a local ClickHouse instance
- Testing: connect to a staging cluster without redeploying
- Demos: show a read-only user's view without sharing admin credentials

The connection selector in the header shows both server-configured hosts and browser-stored connections. Switching between them changes which host all dashboard pages query.

## Permissions & access

Browser Connections is part of the app shell and has no dedicated feature id. It cannot be disabled independently.

If you want to prevent users from switching hosts at all, restrict access to the dashboard itself using the global auth model (`CHM_AUTH_PROVIDER`) rather than trying to remove the connection selector.

## Configuration

No server-side configuration. Browser connections are managed entirely in the client.

For teams, configure hosts server-side:

```bash
CLICKHOUSE_HOST=https://host1.example.com:8443,https://host2.example.com:8443
CLICKHOUSE_USER=chmonitor,chmonitor
CLICKHOUSE_PASSWORD=secret1,secret2
CLICKHOUSE_NAME=Production,Staging
```

Server-configured hosts appear for all users without any browser setup.

## Notes & limitations

- **Credentials are encrypted in browser localStorage**, but XSS on the dashboard could still expose decrypted values in memory. Do not use write-capable production credentials on shared or untrusted devices.
- **Session tokens** expire after 15 minutes; the client refreshes them automatically when needed.
- Browser connections are per-browser, per-device. They are not shared across users or synchronized.
- All queries still go through the chmonitor server proxy — the browser never connects directly to ClickHouse. The chmonitor server must have network access to the target ClickHouse host.
- For team or multi-user deployments, prefer server-side `CLICKHOUSE_HOST`/`CLICKHOUSE_USER`/`CLICKHOUSE_PASSWORD` configuration so all users share the same host list.
- If chmonitor is deployed behind authentication (`CHM_AUTH_PROVIDER=clerk` or `proxy`), the proxy still enforces auth before forwarding any query, regardless of which host is selected.

## Related

- [Getting started](/getting-started)
- [Authentication](/authentication)
- [Settings reference](/settings)
