---
title: "Logs"
editUrl: "https://github.com/duyet/clickhouse-monitoring/edit/main/docs/content/features/logs.mdx"
---

> Browse server text logs, crash reports, and live thread stack traces.

| | |
|---|---|
| **Routes** | `/logs/text-log`, `/logs/stack-traces`, `/logs/crashes` |
| **Feature id** | `logs` |
| **Default access** | `public` |
| **Requires auth** | No (set `CHM_FEATURE_LOGS_ACCESS=authenticated` to gate) |
| **System tables** | `system.text_log`, `system.stack_trace`, `system.crash_log` |
| **ClickHouse grants** | `SELECT` on the system tables above |

## What it does

The Logs section surfaces server-level diagnostic information that would otherwise require SSH access or log file parsing.

**Text Log** queries `system.text_log` to show structured server log entries with level, logger name, query context, and message. Filter by log level or message text to narrow down issues.

**Stack Traces** queries `system.stack_trace` for live stack traces of all running threads. Useful for diagnosing a hung or slow server without restarting it.

**Crashes** queries `system.crash_log` to show historical crash reports with diagnostics. The table is small — it only grows when the server crashes.

## Pages

| Page | Route | What it shows | System tables |
|---|---|---|---|
| Text Log | `/logs/text-log` | Server log entries with level, context, message | `system.text_log` |
| Stack Traces | `/logs/stack-traces` | Live thread stack traces | `system.stack_trace` |
| Crashes | `/logs/crashes` | Historical crash reports with diagnostics | `system.crash_log` |

## Permissions & access

All Logs pages share the `logs` feature id.

This section exposes detailed server internals. Consider gating it in production:

```bash
CHM_FEATURE_LOGS_ACCESS=authenticated
```

Disable entirely:

```bash
CHM_FEATURE_LOGS_ENABLED=false
```

Config file:

```toml
[features.logs]
enabled = true
access = "authenticated"
```

## Configuration

No feature-specific configuration. All three tables must be enabled in the ClickHouse server config to produce data.

## Notes & limitations

- **`system.text_log` is optional.** It requires `<text_log>` to be configured in the ClickHouse server config. Without it the Text Log page shows no rows. The table's retention TTL is also server-configured (default 30 days).
- **`system.crash_log` is optional.** It exists on all ClickHouse servers but only contains rows after an actual crash. An empty table is the normal state for a healthy server.
- **`system.stack_trace` is always available** on a running ClickHouse server (it is a live in-memory table). It shows the current state of all threads at the moment of the query; results are not historical.
- `system.error_log` (historical error event log, distinct from `system.errors` in-memory counts) is surfaced under the Operations > Errors page rather than here. It also requires explicit server-side enablement.
- Text log queries on busy servers can be slow if `system.text_log` is large. Apply log-level or time filters to reduce scan size.

## Related

- [Health](/features/health)
- [Feature permissions](/advanced/feature-permissions)
- [ClickHouse system.text_log docs](https://clickhouse.com/docs/en/operations/system-tables/text_log)
- [ClickHouse system.crash_log docs](https://clickhouse.com/docs/en/operations/system-tables/crash_log)
