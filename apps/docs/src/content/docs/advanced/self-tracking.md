---
title: "Self-Tracking"
editUrl: "https://github.com/duyet/clickhouse-monitoring/edit/main/docs/content/advanced/self-tracking.mdx"
---

chmonitor writes events to a ClickHouse table as users interact with the dashboard. This self-tracking data lets you audit dashboard usage, debug unexpected behavior, and see which pages and queries are most active.

---

## What it records

Every page visit, query execution, and action in the dashboard writes a row to the events table. Recorded fields include the event type, page path, host index, timestamp, and relevant metadata (e.g. query fingerprint, table name).

A companion `monitoring_findings` table stores persistent findings recorded by the AI agent across sessions.

---

## Configuration

| Variable | Default | Description |
|---|---|---|
| `EVENTS_TABLE_NAME` | `system.monitoring_events` | Full table name for self-tracking events. Override to use a different database or table. |
| `CLICKHOUSE_DATABASE` | `system` | Default database for app-owned tables when `EVENTS_TABLE_NAME` is not explicitly set. |

The table is created automatically on first use if it does not exist and the configured ClickHouse user has `CREATE TABLE` permission on the target database.

---

## Change the table location

To write events to a non-system database:

```bash
CLICKHOUSE_DATABASE=chmonitor
## EVENTS_TABLE_NAME defaults to chmonitor.monitoring_events
```

Or set the full table name directly:

```bash
EVENTS_TABLE_NAME=my_db.dashboard_events
```

---

## Disable self-tracking

chmonitor does not currently have a single flag to disable all event writes. To suppress writes, point `EVENTS_TABLE_NAME` at a Null-engine table:

```sql
CREATE TABLE my_db.monitoring_events_null AS system.monitoring_events
ENGINE = Null;
```

```bash
EVENTS_TABLE_NAME=my_db.monitoring_events_null
```

Inserts succeed instantly and no data is retained.

---

## ClickHouse grants required

The configured `CLICKHOUSE_USER` needs:

```sql
GRANT INSERT ON system.monitoring_events TO monitoring_user;
-- Or on the custom table if EVENTS_TABLE_NAME is overridden:
GRANT CREATE TABLE, INSERT ON my_db.* TO monitoring_user;
```

If the user lacks `INSERT` permission, event writes fail silently and the dashboard continues to work normally.

---

## Related

- [Environment Variables — Query Execution](/reference/environment-variables#query-execution) — `EVENTS_TABLE_NAME` and `CLICKHOUSE_DATABASE`.
- [Queries History](/advanced/queries-history) — how the dashboard reads `system.query_log` for history pages.
