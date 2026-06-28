---
title: "ClickHouse User & Grants"
editUrl: "https://github.com/duyet/clickhouse-monitoring/edit/main/docs/content/getting-started/clickhouse-requirements.mdx"
---

chmonitor needs a ClickHouse user with at minimum `SELECT` on `system.*`. Do not use an admin account for a shared dashboard.

## Minimum: read-only monitoring user

This user can view all monitoring pages. It cannot kill queries, run optimizations, or mutate data.

```sql
-- Create the user
CREATE USER monitoring
  IDENTIFIED WITH sha256_password BY 'your-password'
  HOST ANY;

-- Grant read-only access to system tables
GRANT SELECT ON system.* TO monitoring;

-- Allow temporary tables (required for some merge-aware queries)
GRANT CREATE TEMPORARY TABLE ON *.* TO monitoring;
```

## Optional grants for actions

Add these only if you want operators to use the corresponding actions from the UI.

```sql
-- Kill Query action (Running Queries page)
GRANT KILL QUERY ON *.* TO monitoring;

-- Optimize Table action (Data Explorer page)
GRANT OPTIMIZE ON *.* TO monitoring;
```

> **Important:** `AGENT_ENABLE_CONTROL_TOOLS` must also be set to `true` for the AI agent to use kill/optimize. Keep it `false` (the default) on public or shared deployments.

## Optional: self-tracking events table

chmonitor can write dashboard pageview events to a ClickHouse table (`system.monitoring_events` by default). Change `EVENTS_TABLE_NAME` to a table in your own database if you prefer not to write to `system.*`.

If you enable this, the monitoring user needs write access to that table:

```sql
GRANT SELECT, INSERT
  ON your_database.monitoring_events
  TO monitoring;
```

## Optional: ClickHouse Keeper / ZooKeeper access

`system.zookeeper` is available only when ZooKeeper or ClickHouse Keeper is configured. No special grants are needed — `SELECT ON system.*` covers it.

## Multi-host setup

Each ClickHouse host in a multi-host deployment can have its own user and password. Use comma-separated values in the same position across all four variables:

```bash
CLICKHOUSE_HOST=https://prod-a:8443,https://prod-b:8443
CLICKHOUSE_USER=monitoring,monitoring
CLICKHOUSE_PASSWORD=secret-a,secret-b
CLICKHOUSE_NAME=prod-a,prod-b
```

`CLICKHOUSE_HOST` defines the host count. `CLICKHOUSE_USER` and `CLICKHOUSE_PASSWORD` may be a single shared value or one value per host position. `CLICKHOUSE_NAME` is optional. Position N maps to host index N.

## Recommended ClickHouse profile

Create a monitoring profile to enable query caching and the experimental analyzer:

```xml
<!-- /etc/clickhouse-server/users.d/monitoring_profile.xml -->
<clickhouse>
  <profiles>
    <monitoring_profile>
      <allow_experimental_analyzer>1</allow_experimental_analyzer>

      <!-- Optional: reduce repeated load from dashboard queries -->
      <use_query_cache>1</use_query_cache>
      <query_cache_ttl>50</query_cache_ttl>
      <query_cache_max_entries>0</query_cache_max_entries>
      <query_cache_system_table_handling>save</query_cache_system_table_handling>
      <query_cache_nondeterministic_function_handling>save</query_cache_nondeterministic_function_handling>
    </monitoring_profile>
  </profiles>

  <users>
    <monitoring>
      <profile>monitoring_profile</profile>
    </monitoring>
  </users>
</clickhouse>
```
